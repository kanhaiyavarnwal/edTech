import mongoose,{Schema} from "mongoose"
import { otpTemplate } from "../mail/templates/emailVerification.js"
import {mailSender} from "../utils/mailSender.js"
import { ApiError } from "../utils/ApiError.js"

const OTPSchema = new Schema ({

    email:{
    type:String,
    required:true,
  },
  otp:{
    type:String,
    required:true,
  },
  createdAt:{
    type:Date,
    default:Date.now(),
    expires:5*60
  }
})

// a function -> to send email
 async function sendVerificationEmail(email, otp ){
       
     
    try{
   
        const mailResponse = await mailSender(email,"verification Email from studynotion",otpTemplate(otp))
        console.log("1st bug")
        console.log("mailResponse : ",mailResponse)
        console.log("2nd bug")
      

    }catch(err){
       console.log("error while sending email: ",err.message) 
       throw new ApiError(400,err.message)
    }
 }

 OTPSchema.pre("save",async function(){
  console.log("pre save hook",this.email,this.otp)
    await sendVerificationEmail(this.email,this.otp)
  
    
 })   


export const OTP = mongoose.model("OTP",OTPSchema)
