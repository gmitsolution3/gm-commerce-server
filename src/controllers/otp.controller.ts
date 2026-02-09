import { Request, Response } from "express";
import { resendOTPService, verifyOTPForOrder } from "../services/otp.service";
import { ObjectId } from "mongodb";

export const verifyOTPController = async (req: Request, res: Response) => {
  const { orderId, otp } = req.body;

  try {
    if (!orderId || !otp) {
      return res.status(400).json({
        success: false,
        message: "orderId and otp are required",
      });
    }

    const query = { orderId: new ObjectId(orderId)};

    const verifyResult = await verifyOTPForOrder(query, otp);

    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
      });
    }

    res.status(200).json({
      success: true,
      message: verifyResult.message,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "something is wrong",
      data: err,
    });
  }
};

export const reSendOTPController = async(req:Request, res:Response)=>{
  try{
    const { orderId } = req.body;

    if(!orderId){
      return res.status(404).json({
        success: false,
        message: "Order Id is require!!"
      })
    }

    const result = await resendOTPService(orderId)


    res.status(200).json({
      success: true, 
      message: "Send OtP in your email",
      data: result
    })

  }catch(err:any){
    res.status(500).json({
      success: false,
      message: err.message || "Something was wrong",
      data: err
    })
  }
}
