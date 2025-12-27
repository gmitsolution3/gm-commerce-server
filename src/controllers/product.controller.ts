import { Request, Response } from "express";
import {
  createProduct,
  getAllProductService,
  getProduct,
} from "../services/product.service";

export const addProduct = async (req: Request, res: Response) => {
  const productData = req.body;

  try {
    if (!productData) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const result = await createProduct(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

export const getAllProduct = async (req: Request, res: Response) => {
  try {
    const products = await getAllProductService();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductDetails = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "search parameter is missing. Try with search parameter",
      });
      return
    }

    const product= await getProduct(slug as string);

     if (!product) {
       return res.status(404).json({
         success: false,
         message: "Product not found",
       });
     }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
