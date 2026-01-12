import { Request, Response } from "express";
import { Createuser, findByEmail } from "../services/auth.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const logInController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(500)
        .json({ success: false, message: "Email and password is require" });
    }

    const isExistingUser = await findByEmail(email);

    if (!isExistingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    const isMatch = await bcrypt.compare(password, isExistingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    //   create jwt token

    const token = jwt.sign(
      {
        id: isExistingUser.id,
        name: isExistingUser.name,
        email: isExistingUser.email,
        role: isExistingUser.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "3d" }
    );

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    //   maxAge: 3 * 24 * 60 * 60 * 1000,
    // });

    const cookieDomain =
      process.env.NODE_ENV === "production"
        ? ".gm-commerce.vercel.app"
        : ".low-e-commerce.vercel.app"; 

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
      domain: cookieDomain,
    });

    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: {
        user: {
          id: isExistingUser.id,
          name: isExistingUser.name,
          email: isExistingUser.email,
          phone: isExistingUser.phone,
          role: isExistingUser.role,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const SignUpController = async (req: Request, res: Response) => {
  try {
    const {
      address,
      agreeTerms,
      confirmPassword,
      email,
      firstName,
      lastName,
      password,
      phone,
    } = req.body;

    console.log(
      address,
      agreeTerms,
      confirmPassword,
      email,
      firstName,
      lastName,
      password,
      phone
    );

    if (
      !address ||
      !agreeTerms ||
      !email ||
      !firstName ||
      !lastName ||
      !phone
    ) {
      return res.status(500).json({
        success: false,
        message: "All Field is required",
      });
    }

    console.log("after checking input field");

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password not match",
      });
    }

    console.log("before is existing");

    const isExistingUser = await findByEmail(email);

    console.log("after is existing");

    if (isExistingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already exist",
      });
    }

    console.log({ isExistingUser: isExistingUser });

    const hashedPassword = await bcrypt.hash(confirmPassword, 12);

    console.log({ hashedPassword: hashedPassword });

    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      address: address,
      phone: phone,
      password: hashedPassword,
      agreeTerms: agreeTerms,
      createdAt: new Date().toLocaleString(),
      updatedAt: "",
      role: "customer",
    };

    console.log(payload);

    const result = await Createuser(payload);

    if (!result) {
      res
        .status(403)
        .json({ success: false, message: "User not created successfully" });
    }

    return res.status(201).json({
      success: true,
      message: "User Created Successfully",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, error: err });
  }
};

export const getMeController = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not Authenticated",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === "string" || decoded === null) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    const user = await findByEmail(decoded.email);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const sendingPayload = {
      id: user?._id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      address: user?.address,
      phone: user?.phone,
      role: user?.role,
      createdAt: user?.createdAt,
    };


    console.log(sendingPayload)



    res.status(200).json({
      success: true,
      message: "User founded",
      data: sendingPayload,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, error: err });
  }
};



export const logOutController = (req:Request, res:Response)=>{
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}
