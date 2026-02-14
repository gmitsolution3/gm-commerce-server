import { ObjectId } from "mongodb";
import { client } from "../config/db";
import { storeOTPForOrder } from "./createOrder.service";
import { sendEmail } from "./../helper/nodemailerFun";

const otpCollection = client
  .db("loweCommerce")
  .collection("OTPStore");
const createOrderCollection = client
  .db("loweCommerce")
  .collection("create_order");
const usersCollection = client.db("loweCommerce").collection("users");

export const verifyOTPForOrder = async (query: any, otp: string) => {
  const otpRecord = await otpCollection.findOne(query);

  if (!otpRecord) {
    return {
      success: false,
      message: "OTP record not found for the given orderId",
    };
  }

  if (otpRecord.otp !== otp) {
    return {
      success: false,
      message: "Invalid OTP",
    };
  }

  await createOrderCollection.updateOne(
    { _id: otpRecord.orderId },
    {
      $set: {
        riskScore: 15,
        isEmailVerified: true,
        FakeOrderStatus: "LEGIT",
      },
    },
  );

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
    message: "OTP verified successfully",
  };
};

export const resendOTPService = async (orderId: string) => {
  const query = { _id: new ObjectId(orderId) };

  const result = await createOrderCollection.findOne(query);

  if (!result) {
    return result;
  }

  const email = result?.customerInfo?.email;

  const payload = { orderId, email };

  const reSendOTP = await storeOTPForOrder(payload);

  console.log({ result: reSendOTP });

  if (!reSendOTP.success) {
    return { success: false, message: "Something was wrong!!" };
  }

  return reSendOTP;
};
