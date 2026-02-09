import { Request, Response } from "express";
import {
  CreateOrderService,
  deleteOrderServer,
  getAllOrder,
  getDashboardAnalytics,
  getHistory,
  getSingleOrder,
  storeOTPForOrder,
  updateSingleOrder,
} from "../services/createOrder.service";
import { ObjectId } from "mongodb";
import { sendEmail } from "../helper/nodemailerFun";

export const CreateOrder = async (req: Request, res: Response) => {
  const orderData = req.body;
  const ip = (req as any).userIP;
  if (!orderData) {
    return res.status(500).json({
      success: false,
      message: "body data not found",
    });
  }

  const finalPayload = {ip, ...orderData}

  try {
    console.log("create order knocked")
    const result = await CreateOrderService(finalPayload);

    console.log({orderResult: result})


    if(result.status === "FRAUD" || result.status === "SUSPICIOUS"){

      const otpStore = await storeOTPForOrder(result)

      if (!otpStore.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate OTP",
        });
      }

      return res.status(200).json({
        success: false,
        message: "Need to verify email",
        data: otpStore,
        orderId: result.orderId,
        isRedirect: true,
      });
    }

    res.status(201).send(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "something is wrong",
      data: err,
    });
  }
};

export const orderController = async (req: Request, res: Response) => {
  try {
    const result = await getAllOrder();

    if (result.length === 0) {
      res.status(404).json({
        success: false,
        message: "No Order found in db",
        data: result,
      });
    }

    res.status(200).json({
      success: false,
      message: "All data found",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "something is wrong",
      data: err,
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };

  try {
    const response = await getSingleOrder(query);

    if (!response) {
      res.status(404).json({
        success: false,
        message: "No Data found in db",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order Founded",
      data: response,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "something is wrong",
      data: err,
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const query = { _id: new ObjectId(id) };

  try {
    if (!ObjectId.isValid(id!)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const result = await updateSingleOrder(query, payload);

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const historyController = async (req: Request, res: Response) => {
  const userPhone = req.params.id;

  if (!userPhone) {
    return res.status(400).json({
      success: false,
      message: "User id is required",
    });
  }

  const query = { "customerInfo.phone": userPhone };

  try {
    const result = await getHistory(query);

    // if(result.length ===0){
    //   return res.status(404).json({
    //     success:false,
    //     message:"No order found for this user"
    //   })
    // }
    res.status(200).json({
      success: true,
      message: "Order history found",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: err,
    });
  }
};

export const dashboardAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getDashboardAnalytics();

    res.status(200).json({
      success: true,
      message: "Dashboard analytics data found",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: err,
    });
  }
};

export const deleteOrderController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = { _id: new ObjectId(id) };

    const result = await deleteOrderServer(query);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Order Deleted successfully",
        data: result,
      });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      data: err,
    });
  }
};
