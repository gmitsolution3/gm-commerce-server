import axios from "axios";
import { getBkashToken } from "./../utils/bkash";
import { client } from "./../config/db";
import { ObjectId } from "mongodb";
import { Response } from "express";

const paymentCollection = client
  .db("loweCommerce")
  .collection("payment");

const createOrderCollection = client
  .db("loweCommerce")
  .collection("create_order");

export const createBkashPayment = async (
  amount: number,
  invoice: string,
) => {
  const token = await getBkashToken();

  const orderId = invoice.split("-")[1];

  const res = await axios.post(
    process.env.BKASH_CREATE_PAYMENT_URL!,
    {
      mode: "0011",
      payerReference: "Crab Fashion BD",
      callbackURL: process.env.BKASH_CALLBACK_URL,
      amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: invoice,
    },
    {
      headers: {
        Authorization: token,
        "X-App-Key": process.env.BKASH_API_KEY!,
      },
    },
  );

  const paymentResponse = await paymentCollection.insertOne({
    paymentID: res?.data?.paymentID,
    amount: parseFloat(res?.data?.amount),
    orderId,
  });

  await createOrderCollection.updateOne(
    {
      _id: new ObjectId(orderId),
    },
    {
      $set: {
        paymentId: paymentResponse.insertedId,
      },
    },
  );

  return res.data;
};

export const executeBkashPayment = async (
  response: Response,
  paymentID: string,
) => {
  const token = await getBkashToken();

  if (!token) {
    return response.status(401).json({
      success: false,
      message: "Missing Bkash Token",
    });
  }

  const res = await axios.post(
    process.env.BKASH_EXECUTE_PAYMENT_URL!,
    { paymentID },
    {
      headers: {
        Authorization: token,
        "X-App-Key": process.env.BKASH_API_KEY!,
      },
    },
  );

  if (res.data.statusCode !== "0000") {
    return response.status(500).json({
      success: false,
      message: "Payment execution failed",
    });
  }

  const order = await createOrderCollection.findOne(
    new ObjectId(res?.data?.merchantInvoiceNumber.split("-")[1]),
  );

  if (!order) {
    return response.status(404).json({
      success: false,
      message: "Order not available.",
    });
  }

  await paymentCollection.updateOne(
    {
      paymentID: res?.data?.paymentID,
    },
    {
      $set: {
        trxID: res?.data?.trxID,
        status: "PAID",
      },
    },
  );

  await createOrderCollection.updateOne(
    {
      _id: new ObjectId(
        res?.data?.merchantInvoiceNumber.split("-")[1],
      ),
    },
    {
      $set: {
        paymentStatus: "PAID",
      },
    },
  );

  return res.data;
};
