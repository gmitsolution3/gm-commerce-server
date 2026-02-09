import crypto from "crypto";

export function generateSecureOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";

  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i]! % 10];
  }

  return otp;
}
