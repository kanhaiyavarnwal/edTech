import { instance } from "../utils/razorpay.js";
import { CourseProgress } from "../models/CourseProgress.js";
import {Course} from "../models/Course.js"
import {User} from "../models/User.js"
import {mailSender} from "../utils/mailSender.js"
import { courseEnrollmentEmail } from "../mail/templates/courseEnrollmentEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { paymentSuccessEmail } from "../mail/templates/paymentSuccessful.js";

// capture the payment and initiate razorpay
const capturePayment = asyncHandler(async(req , res)=>{
    // get courseid and userid
    //  const { course_id} = req.body;
     const userId = req.user.id;
     const {courses} = req.body;

    //validation
    // if(!course_id){
    //     throw new ApiError(401, "please provide valid course id")
    // }
    if(courses.length === 0){
        throw new ApiError(404,"course not found")
    }

    let total_amount = 0

    for(const course_id of courses){
        let course

        try{
         //find the course by its id
           course = await Course.findById(course_id)
              // If the course is not found, return an error
              if(!course){
        
         throw new ApiError(404, "could not find the course")
    
       }

       // check if the user is already enrolled in the course
       const uid = new mongoose.Types.ObjectId(userId) 
       if(course.studentEnrolled.includes(uid)){
           throw new ApiError(200,"Student is already Enrolledd")
       }

         // Add the price of the course to the total amount
         total_amount += course.price

        }catch(err){
           console.log(err)
           throw new ApiError(500,err.message)
        }
    }

    const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  }


     try{  
      //  initiate the payment using razorpay
      const paymentResponse = await instance.orders.create(options)

      console.log("payment Response ;-> ",paymentResponse)
          
      res.json(
        new ApiResponse(200,paymentResponse,"payment initiated success")
      )
    
     }catch(err){
       console.log(err)
       throw new ApiError(500,"Could not initiated payment")
     }









   
    //validate courseid
    // let course;
    // try{
    //    course = await Course.findById(course_id)
    //    if(!course){
        
    //      throw new ApiError(404, "could not find the course")
    
    //    }
    //     // user already pay for the same course 
    //    const uid = new mongoose.Types.ObjectId(userId)
    //    if(course.studentEnrolled.includes(uid)){
    //     return res
    //     .status(200)
    //     .json(
    //         new ApiResponse(200 , null,"Student is already enrolled")
    //     )
    //    }
    // }
    
     
    
    // catch(err){
    //    console.log("Error in payment conrolers: ",err.message)
    //    throw new ApiError(500,err.message)
    // }
    //order create kro 
    // const amount = course.price;
    // const currency = "INR";
    // const options={
    //     amount: amount * 100,
    //     currency,
    //     reciept: Math.random(Date.now()).toString(),
    //     notes:{
    //      courseId:course_id,
    //      userId
    //     }
    // }
    // try{
    //     //initiate the payment using razorpay
    //     const paymentResponse = await instance.orders.create(options)
    //     console.log("paymentResponse: ",paymentResponse)
    //       // return response
    //     return res
    //     .status(200)
    //     .json(
    //         new ApiResponse(201,{
    //                     courseName:course.courseName,
    //                     courseDescription:course.courseDescription,
    //                     thumbnails:course.thumbnail,
    //                     orderId:paymentResponse.id,
    //                     currency:paymentResponse.currency,
    //                     amount:paymentResponse.amount

    //         },"Payment success")
    //     )
    // }catch(err){
    //     console.log(err)
    //     throw new ApiError(401,"could not initiate order")
    // }
     
  
})

const verifySignature = asyncHandler(async(req , res)=>{
    // mujhe match krni hai server m jo secret hai or raxorpay me ho secret hai 
    // server secret
    // const webhookSecret = "12345678"

    // // razarpay secret
    // const signature = req.header("x-razorpay-signature")

    //   const shasum = crypto.createHmac("sha256", webhookSecret)

    //   // convert it into string
    //   shasum.update(JSON.stringify(req.body));
    //   const digest = shasum.digest("hex")

    //   if(signature === digest){
    //     console.log("payment is authorized")

    //     const {courseId , userId} = req.body.payload.payment.entity.notes

    //     try{
    //         // fullfill action
    //         // find the course and enrolled the student in it
    //         const enrolledCourse = await Course.findOneAndUpdate(
    //                                             {_id:courseId},
    //                                              {$push:{studentEnrolled:userId}},
    //                                              {new:true},
    //         );
    //         if(!enrolledCourse){
    //             return res
    //             .status(500)
    //             .json(
    //                new ApiResponse(501,null,"Course not found") 
    //             )
    //         }
    //         console.log("enrolledCourse : ",enrolledCourse)
    //         //find the student and add the course  in the enrolled course

    //         const enrolledStudent = await User.findOneAndUpdate(
    //                                                    {_id:userId},
    //                                                    {$push:{courses:courseId}},
    //                                                    {new:true},
    //         )
    //         console.log("enrolled in  the student : ",enrolledStudent)
    //         // sending confirmation mail
    //         const emailResponse = await mailSender(
    //                                         enrolledStudent.email,
    //                                         "conratulatons from codehelp",
    //                                         "Conratulation you are onboarded into new courses codehelp course",

    //         )
    //         console.log("emailResponse : ",emailResponse)
    //         return res
    //         .status(200)
    //         .json(
    //             new ApiResponse(201, null,"signature verified and course added")
    //         )
    //     }catch(err){
    //         console.log(err.message)
    //         throw new ApiError(500,err.message)
    //     }
    //   }
    //   else{
    //     return res
    //     .status(400)
    //     .json(
    //         new ApiResponse(401,null,"invalid request")
    //     )
    //   }

    const{rozarpay_order_id , rozarpay_payment_id , rozarpay_signature , courses} = req.body;
    
    const userId = req.user?.id

    if(!rozarpay_order_id || ! rozarpay_payment_id || ! rozarpay_signature || ! courses || ! userId){
        throw new ApiError(401,"Payment failed")
    }

    let body = rozarpay_order_id + "|" + rozarpay_payment_id

    const expectedSignature = crypto
       .createHmac("sha256" , process.env.ROZARPAY_SECRET)
       .update(body.toString())
       .digest("hex")

        if(expectedSignature === rozarpay_signature){
            await enrollStudents(courses,userId,res)

            return res
            .status(200)
            .json(
                new ApiResponse(200,"Payment vwrified")
            )
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,"Payment failed")
        )
})

const sendPaymentSuccessfullPayment = asyncHandler(async(req , res)=>{
    const {orderId , paymentId , amount} = req.body;

    const userId = req.user?.id

    if(!orderId || !paymentId || ! amount || !userId){
        throw new ApiError(400,"provide all the field")
    }

    try {
        const enrolledStudent = await User.findById(userId)
        await mailSender(
            enrolledStudent.email,
        `Payment Recieved`,
        paymentSuccessEmail(
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
            amount / 100 ,
            orderId,
            paymentId
        )
        )
    } catch (error) {
        console.log("error in sending email", error.message)
        throw new ApiError(400, "could not send email")
        
    }
}) 

// enroll the student int he course

const enrollStudent = asyncHandler(async(courses , userId , res)=>{
    if(!userId  || !courses){
        throw new ApiError(400,"please provide userId, courses")

    }
   for(const courseId of courses){
     try{
     // find the course and enrolled the student in it
     const enrolledCourse = await Course.findOneAndUpdate(
        {_id:courseId},
        {$psh:{studentsEnrolled: userId}},
        {new:true}
     )
     if(!enrolledCourse){
        throw new ApiError(500,"course not found")
     }
     console.log("enrolledCourse:-> ",enrolledCourse)

     const courseProgress = await courseProgress.create({
                                courseID:courseId,
                                userID:userId,
                                completedVideo:[],
     })

    // find the student and addd the course
    const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {$push:{courses:courseId,
                courseProgress:courseProgress?._id,
        },
    },{new:true}
    )
    console.log("enrolled student : ",enrolledStudent)

    // send an email notifications to the enrolled student

    const mailResponse = await mailSender(
          enrolledStudent.email,
          `successfully enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrollStudent.firstName} ${enrolledStudent.lastName}`
          )
    )
     console.log("email send successfully-> ",mailResponse)

     }catch(err){
       console.log(err)
       throw new ApiError(400,"err while sending the course enrolled"| err.message)
     }
   }



})

export {capturePayment , verifySignature,sendPaymentSuccessfullPayment,enrollStudent}