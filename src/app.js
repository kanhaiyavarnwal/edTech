import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import fileUpload from "express-fileupload"
const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true, limit:"16KB"}))

app.use(cors({
    origin:"http://localhost:3000",  // frontend url
    credentials:true,
}))
app.use(cookieParser({}))

app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/temp"
    })
)

 import userRoutes from "./routes/userRoutes.js"
 import courseRoutes from "./routes/courseRoute.js"
 import profileRoutes from "../src/routes/profileRoutes.js"
 import paymentRoutes from "../src/routes/paymentRoutes.js"
import contactRoute from "../src/routes/contactRoutes.js"
  app.use("/api/v1/user" , userRoutes)
  app.use("/api/v1/profile" , profileRoutes)
  app.use("/api/v1/course" , courseRoutes)
  app.use("/api/v1/payment",paymentRoutes)
  app.use("/api/v1/contact",contactRoute)

  


export {app}