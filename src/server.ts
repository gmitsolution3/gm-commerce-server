import "dotenv/config";
import app from "./app";
import { client, connectDB } from "./config/db";


const otpCollection = client.db("loweCommerce").collection("OTPStore");

const port = Number(process.env.PORT) || 5000;

async function StartServer() {
  await connectDB();

   await otpCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });


  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

StartServer();
