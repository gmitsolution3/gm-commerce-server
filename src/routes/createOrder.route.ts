import { Router } from "express";
import {
  CreateOrder,
  getOrderById,
  orderController,
} from "../controllers/createOrder.controller";

const router = Router();

router.post("/", CreateOrder);

router.get("/all-product", orderController);
router.get("/get-Order/:id", getOrderById);
router.put("/update-order/:id", getOrderById);

export default router;
