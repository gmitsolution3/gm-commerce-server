import express from "express";
import productRoute from "./routes/product.route";
import categoryRoute from "./routes/category.route";
import productByCategoryRoute from "./routes/productByCategory.route";
import orderRouter from "./routes/createOrder.route";
import facebookRoute from "./routes/facebook.route";
import bannerRoute from "./routes/banner.route";
import socialRoute from "./routes/social.route";
import authRouter from "./routes/auth.route";
import marqueeRoute from "./routes/marquee.route";
import courierRoute from "./routes/courier.route";
import ipRouter from "./routes/getIp.route"
import otpRouter from "./routes/otp.route"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://gm-commerce.vercel.app",
      "http://localhost:3000",
      "https://www.crabfashionbd.com",
      "https://crab-client.vercel.app",
      "https://e-commerce-01-brown.vercel.app",
      "http://naturax.org",
      "https://naturax.org",
      "https://naturax-client.vercel.app",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());

app.use("/api/products", productRoute);

app.use("/get-product-by-category", productByCategoryRoute);

app.use("/create-category", categoryRoute);

app.use("/create-order", orderRouter);

app.use("/facebook-setting", facebookRoute);
app.use("/banner", bannerRoute);

app.use("/social", socialRoute);

app.use("/marquee", marqueeRoute);

app.use("/courier", courierRoute);

// auth route
app.use("/api/v1/auth", authRouter);

app.use("/api", ipRouter);

app.use("/api/otp", otpRouter);


app.get("/", (req, res) => {
  res.send("server is running");
});

export default app;
