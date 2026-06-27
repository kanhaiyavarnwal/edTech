

import nodemailer from "nodemailer"

const mailSender = async(email , title , body)=>{
    try{
   let transporter = nodemailer.createTransport({
    service : "gmail",
    
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
     
   });
     
   let info = await transporter.sendMail({
     from : 'StudyNotion',
     to:`${email}`,
     subject:`${title}`,
     html:`${body}`
   })

   console.log("email info: ",info)
    return info;

    }catch(err){
        console.log(err.message)
    }
}

export{ mailSender}