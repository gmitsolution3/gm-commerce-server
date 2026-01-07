
import "dotenv/config";
import app from "./app"
import { connectDB } from "./config/db"


const port = Number(process.env.PORT) || 5000

async function StartServer() {
  await connectDB();

  app.listen(port);

  app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
  })
}

StartServer();