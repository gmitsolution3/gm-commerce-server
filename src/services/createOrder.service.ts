import axios from "axios";
import { client } from "../config/db";
import { hashSha256 } from "../utils/encryption";
import { getFacebookCredentialsService } from "./facebook.service";
import { productCollection } from "./product.service";
import { VisitorDoc } from "../types";
import { calculateRisk } from "../utils/calculateRisk";
import { generateSecureOTP } from "../helper/generateOTP";
import { sendEmail } from "../helper/nodemailerFun";
import { addFraudScoreService } from "./visitorLOg.service";
import { ObjectId } from "mongodb";

const createOrderCollection = client
  .db("loweCommerce")
  .collection("create_order");
const visitorLog = client.db("loweCommerce").collection("VisitorLog");
const userLocation = client
  .db("loweCommerce")
  .collection<VisitorDoc>("UserLocation");

const otpCollection = client
  .db("loweCommerce")
  .collection("OTPStore");

const usersCollection = client.db("loweCommerce").collection("users");

// created order
export async function CreateOrderService(payload: any) {
  //  Extract slugs from cart
  const slugs = payload.products.map((p: any) => p.slug);

  //  Fetch products from DB
  const productsFromDB = await productCollection
    .find({
      slug: { $in: slugs },
    })
    .toArray();

  if (!productsFromDB.length) {
    return { success: false, message: "No Data found in database" };
  }

  //  Merge frontend cart with DB data & validate price / stock
  const finalProducts = payload.products.map((cartItem: any) => {
    const productDB = productsFromDB.find(
      (p) => p.slug === cartItem.slug,
    );
    if (!productDB) {
      return {
        success: false,
        message: `Product not found: ${cartItem.slug}`,
      };
    }

    const variant = productDB.variants.find(
      (v: any) => v.sku === cartItem.variant.sku,
    );

    if (!variant) {
      return {
        success: false,
        message: `Variant not found for ${productDB.title}`,
      };
    }

    // Validate stock
    const availableStock = parseInt(
      productDB.stockQuantity as string,
      10,
    );
    if (cartItem.quantity > availableStock) {
      return {
        success: false,
        message: `Not enough stock for product: ${productDB.title}`,
      };
    }

    // Calculate price after discount
    let basePrice = parseFloat(productDB.basePrice);
    if (productDB.discount?.type === "percentage") {
      basePrice =
        basePrice -
        (basePrice * parseFloat(productDB.discount.value)) / 100;
    }

    return {
      productId: productDB._id,
      title: productDB.title,
      slug: productDB.slug,
      sku: variant.sku,
      quantity: cartItem.quantity,
      price: basePrice,
      subtotal: basePrice * cartItem.quantity,
      variant: cartItem.variant,
    };
  });

  // Calculate order totals
  const subtotal = finalProducts.reduce(
    (sum: any, p: any) => sum + p.subtotal,
    0,
  );

  const deliveryCharge =
    payload.deliveryMethod === "inside" ? 80 : 100;
  const grandTotal = subtotal + deliveryCharge;

  //  Prepare final order object
  const orderData = {
    customerInfo: {
      firstName: payload.customerInfo.firstName,
      lastName: payload.customerInfo.lastName,
      phone: payload.customerInfo.phone,
      email: payload.customerInfo.email,
    },
    shippingAddress: {
      street: payload.shippingAddress.street,
      city: payload.shippingAddress.city,
      region: payload.shippingAddress.region,
      postalCode: payload.shippingAddress.postalCode,
    },
    products: finalProducts,
    subtotal,
    deliveryCharge,
    grandTotal,
    paymentMethod: payload.paymentMethod,
    deliveryMethod: payload.deliveryMethod,
    promoCode: payload.promoCode || "",
    createdAt: new Date(),
    orderStatus: payload.orderStatus,
    paymentStatus: payload.paymentStatus,
    customerIp: payload.ip,
  };

  const [orderResult, locationResult] = await Promise.all([
    visitorLog.findOne({ ip: (payload as any).ip }),
    userLocation.findOne({ ip: (payload as any).ip }),
  ]);

  const riskScore = calculateRisk({
    ...orderResult,
    ...locationResult,
  });

  const finalORderData = {
    ...orderData,
    riskScore,
    FakeOrderStatus:
      riskScore >= 60
        ? "FRAUD"
        : riskScore >= 40
          ? "SUSPICIOUS"
          : "LEGIT",
    isEmailVerified: riskScore >= 40 ? false : true,
  };

  // Insert order into DB
  const result =
    await createOrderCollection.insertOne(finalORderData);

  const orderId = result.insertedId;

  // update product count
  for (const item of finalProducts) {
    await productCollection.updateOne(
      {
        _id: item.productId,
        "variants.sku": item.sku,
      },
      {
        $inc: {
          "variants.$.stock": -item.quantity,
        },
      },
    );
  }

  const updateRiskScore = await addFraudScoreService({
    ip: payload.ip,
    riskScore: riskScore,
  });

  if (riskScore >= 60) {
    return {
      status: "FRAUD",
      requireEmailOTP: true,
      orderId: orderId,
      email: payload.customerInfo.email,
      riskScore,
    };
  }

  if (riskScore >= 40) {
    return {
      status: "SUSPICIOUS",
      requireEmailOTP: true,
      orderId: orderId,
      email: payload.customerInfo.email,
      riskScore,
    };
  }

  try {
    const fbCreds = await getFacebookCredentialsService();

    if (fbCreds?.isEnabled && fbCreds._internal.fbCapiToken) {
      const fbPayload = {
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url:
              payload.sourceUrl ||
              "https://gm-commerce.vercel.app/checkout",
            user_data: {
              em: payload.customerInfo.email
                ? hashSha256(payload.customerInfo.email)
                : undefined,
              ph: payload.customerInfo.phone
                ? hashSha256(payload.customerInfo.phone)
                : undefined,
            },
            custom_data: {
              currency: "BDT",
              value: orderData.grandTotal,
              content_ids: orderData.products.map((p: any) => p.slug),
              content_type: "product",
            },
          },
        ],
      };

      await axios.post(
        `https://graph.facebook.com/v17.0/${fbCreds.fbPixelId}/events?access_token=${fbCreds._internal.fbCapiToken}`,
        fbPayload,
      );
      console.log("Facebook CAPI Purchase sent successfully");
    }
  } catch (err) {
    console.error("Facebook CAPI error:", err);
  }

  // send order email to admins
  const admins = await usersCollection
    .find({
      role: "admin",
    })
    .toArray();

  const adminMail = admins.map((admin) => admin.email);

  adminMail.forEach(async (email) => {
    const emailPayload = {
      to: email,
      subject: "Order Placement Alert",
      text: `An Order has been placed.`,
      type: "order-placement",
    };

    await sendEmail(emailPayload);
  });

  return {
    success: true,
    orderId: orderId,
    grandTotal,
    message: "Order created successfully",
    paymentMethod: payload.paymentMethod,
  };
}

// get all order
export async function getAllOrder() {
  const result = await createOrderCollection
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  return result;
}

export async function getOrderForUserService(email: string) {
  const result = await createOrderCollection
    .find({
      "customerInfo.email": email,
    })
    .toArray();

  return result;
}

// get single order for details and edit
export async function getSingleOrder(query: any) {
  const result = await createOrderCollection.findOne(query);

  return result;
}

export const updateSingleOrder = async (query: any, payload: any) => {
  const { _id, ...updateData } = payload;

  return await createOrderCollection.updateOne(query, {
    $set: updateData,
  });
};

export async function getHistory(query: any) {
  const historyTracker = await createOrderCollection
    .aggregate([
      {
        $match: {
          "customerInfo.phone": query["customerInfo.phone"],
        },
      },
      {
        $group: {
          _id: "$customerInfo.phone",

          // 🔹 Total Orders
          totalOrders: { $sum: 1 },

          // 🔹 Financial
          totalGrandTotal: { $sum: "$grandTotal" },

          // 🔹 Order Status Counts
          pending: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "processing"] }, 1, 0],
            },
          },
          courier: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "courier"] }, 1, 0],
            },
          },
          onHold: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "on-hold"] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
            },
          },
          returned: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "return"] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0],
            },
          },

          // 🔹 Payment Summary
          totalPaidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "success"] }, 1, 0],
            },
          },

          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "success"] },
                "$grandTotal",
                0,
              ],
            },
          },
          totalDueOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
            },
          },
          totalDueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "pending"] },
                "$grandTotal",
                0,
              ],
            },
          },
          userInfo: { $first: "$customerInfo" },

          // 🔹 Dates
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
    ])
    .toArray();

  return historyTracker;
}

export async function getDashboardAnalytics() {
  const analytics = await createOrderCollection
    .aggregate([
      {
        $group: {
          _id: null,

          //  Total Orders
          totalOrders: { $sum: 1 },

          // Financial
          totalGrandTotal: { $sum: "$grandTotal" },

          //  Order Status Counts
          pending: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "pending"] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "processing"] }, 1, 0],
            },
          },
          courier: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "courier"] }, 1, 0],
            },
          },
          onHold: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "on-hold"] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
            },
          },
          returned: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "return"] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0],
            },
          },

          //  Payment Summary
          totalPaidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "success"] }, 1, 0],
            },
          },

          totalPaidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "success"] },
                "$grandTotal",
                0,
              ],
            },
          },
          totalDueOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0],
            },
          },
          totalDueAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "pending"] },
                "$grandTotal",
                0,
              ],
            },
          },

          // Dates
          firstOrderDate: { $min: "$createdAt" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
    ])
    .toArray();

  const productAnalytics = await createOrderCollection
    .aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalQuantitySold: { $sum: "$products.quantity" },
          totalSalesAmount: { $sum: "$products.subtotal" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          totalQuantitySold: 1,
          totalSalesAmount: 1,
          categoryName: "$productDetails.category",
          productTitle: "$productDetails.title",
          productSlug: "$productDetails.slug",
          productThumbnail: "$productDetails.thumbnail",
        },
      },
    ])
    .toArray();

  const totalPurchaseResult = await productCollection
    .aggregate([
      {
        $match: {
          isDelete: false,
        },
      },
      {
        $project: {
          purchase: {
            $toDouble: "$purchase",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalOverallPurchase: { $sum: "$purchase" },
        },
      },
    ])
    .toArray();

  const totalOverallPurchase =
    totalPurchaseResult[0]?.totalOverallPurchase || 0;

  const totalOrder = await createOrderCollection.countDocuments();

  const totalProduct = await productCollection.countDocuments();
  return {
    totalOrder: totalOrder,
    analytics: analytics,
    totalProduct: totalProduct,
    productAnalytics: productAnalytics,
    totalOverallPurchase,
  };
}

export const topSellingProduct = async () => {
  const topSellingProducts = await createOrderCollection
    .aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalQuantitySold: { $sum: "$products.quantity" },
          totalSalesAmount: { $sum: "$products.subtotal" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $match: {
          "product.isDelete": false,
          "product.isDraft": false,
        },
      },
      {
        $replaceRoot: {
          newRoot: "$product",
        },
      },
    ])
    .toArray();

  return topSellingProducts;
};

export const deleteOrderServer = async (query: any) => {
  const deleteOrder = await createOrderCollection.deleteOne(query);
  return deleteOrder;
};

export const storeOTPForOrder = async (payload: any) => {
  const { orderId, email } = payload;
  const otp = generateSecureOTP();

  if (!email || !orderId || otp.length === 0) {
    return {
      status: false,
      message: "Missing required information for OTP generation",
    };
  }

  await otpCollection.deleteMany({ orderId: new ObjectId(orderId) });

  try {
    const otpData = await otpCollection.insertOne({
      email: email,
      orderId: new ObjectId(orderId),
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const emailPayload = {
      to: email,
      subject: "Your OTP for Order Verification",
      text: `Your OTP for verifying order ${orderId} is: ${otp}. It will expire in 2 minutes.`,
      orderId: orderId,
      otp: otp,
    };

    await sendEmail(emailPayload);

    return {
      success: true,
      message: "OTP generated and email sent successfully",
      otpId: otpData.insertedId,
      productId: orderId,
    };
  } catch (err) {
    console.error("Error storing OTP:", err);
    return { status: false, message: "Error storing OTP" };
  }
};
