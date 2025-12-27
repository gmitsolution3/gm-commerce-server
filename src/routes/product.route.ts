import { Router } from "express";
import {
  addProduct,
  getAllProduct,
  getProductDetails,
} from "../controllers/product.controller";

const router = Router();

router.post("/", addProduct);

router.get("/", getAllProduct);
router.get("/:slug", getProductDetails);

export default router;
