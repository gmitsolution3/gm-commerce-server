import { Request, Response } from "express";
import { addFraudUserDataService, UserLocationService, VisitorLogCreate } from "../services/visitorLOg.service";

export const getIp = async (req: Request, res: Response) => {
  const forwarded = req.headers["x-forwarded-for"];

  let ip: string | undefined;

  if (typeof forwarded === "string") {
    ip = forwarded.split(",")[0];
  } else if (Array.isArray(forwarded)) {
    ip = forwarded[0];
  } else {
    ip = req.socket.remoteAddress || req.ip;
  }

  if (ip?.includes("::ffff:")) ip = ip.replace("::ffff:", "");

  res.status(200).json({
    success: true,
    message: "found ip",
    data: ip,
  });
};

export const trackTime = async (req: Request, res: Response) => {
  try {

    const { route, timeSpent } = req.body;
    const ip = (req as any).userIP;


    if (!route || typeof timeSpent !== "number") {
      return res.status(400).json({ success: false });
    }

     

    const result = await VisitorLogCreate({
      ip,
      route,
      timeSpent,
      userAgent: req.headers["user-agent"],
      scrollDepth: req.body.scrollDepth,
      mouseMoves: req.body.mouseMoves,
      clicks: req.body.clicks,
      touch: req.body.touch,
      screen: req.body.screen,
    });


    res
      .status(200)
      .json({ success: true, message: "Visitor Log created", data: result });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const trackLocation = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ip = (req as any).userIP;

    const finalPayload = {...data,ip}

    const result = await UserLocationService(finalPayload);

    res.status(200).json({
      success: true,
      message: "find location",
      data: result
    })

  } catch (err: any) {
    res.status(500).json({ success: false });
  }
};

export const updateFraudUser = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ip = (req as any).userIP;
    const finalPayload = {...data,ip}

    const result = await addFraudUserDataService(finalPayload);
    res.status(200).json({
      success: true,
      message: "update fraud user",
      data: result
    })
  } catch (err: any) {
    res.status(500).json({ success: false });
  }
};
