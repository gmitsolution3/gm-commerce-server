import express from "express";
import productRoute from "./routes/product.route";
import categoryRoute from "./routes/category.route";
import productByCategoryRoute from "./routes/productByCategory.route";
import orderRouter from "./routes/createOrder.route";
import facebookRoute from "./routes/facebook.route";
import bannerRoute from "./routes/banner.route";
import socialRoute from "./routes/social.route";
import authRouter from "./routes/auth.route";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["https://gm-commerce.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());

app.use("/api/products", productRoute);

app.use("/get-product-by-category", productByCategoryRoute);

app.use("/create-category", categoryRoute);

app.use("/create-order", orderRouter);

app.use("/facebook-setting", facebookRoute);
app.use("/banner", bannerRoute);

app.use("/social", socialRoute);

// auth route
app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send("server is running");
});

export default app;
