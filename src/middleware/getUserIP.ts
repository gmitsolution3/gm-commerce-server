import { Request, Response, NextFunction } from "express";

export const getUserIP = (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers["x-forwarded-for"];

  let ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.socket.remoteAddress || req.ip;

  if (ip?.includes("::ffff:")) ip = ip.replace("::ffff:", "");

  (req as any).userIP = ip;
  next();
};

