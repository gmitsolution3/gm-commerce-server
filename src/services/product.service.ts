import { client } from "../config/db";
import { Product } from "../models/product.model";

const productCollection = client
  .db("loweCommerce")
  .collection<Product>("products");

export async function createProduct(product: Product) {
  const result = await productCollection.insertOne(product);
  return result;
}


export async function getAllProductService() {
  const query = { isDraft: false, featured: false, isDelete: false };

  const result = await productCollection
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return result;
}

export async function getProduct(slug: string) {
  return await productCollection.findOne({ slug });
}