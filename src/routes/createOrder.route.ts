import { Router } from "express";
import {
  CreateOrder,
  dashboardAnalyticsController,
  deleteOrderController,
  getOrderById,
  historyController,
  orderController,
  updateOrder,
} from "../controllers/createOrder.controller";
import { getUserIP } from "../middleware/getUserIP";

const router = Router();

router.post("/",getUserIP, CreateOrder);
router.get("/all-product", orderController);
router.get("/dashboard-analytics", dashboardAnalyticsController);
router.get("/get-history/:id", historyController);
router.get("/get-Order/:id", getOrderById);
router.put("/update-order/:id", updateOrder);
router.delete("/delete-order/:id", deleteOrderController);

export default router;
