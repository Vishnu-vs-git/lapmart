const dotenv = require('dotenv');
dotenv.config();  // Make sure to load environment variables from your .env file

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS   
   }
});
const sendOTP=async (email,otp)=>{
   const mailOpions={
      from:process.env.EMAIL_USER,
      to:email,
      subject:'your OTP code',
      text   :'your OTP code is ${otp} it is valid for 2 minutes.please do not share it with anyone'
   };
   
   try{
      await transporter.sendMail(mailOpions);
      console.log('otp sent to:',email)
   }catch(error){
      console.error('error sending otp: ',error);
      throw new Error('error in Sending otp')
   }

}

//module.exports=sendOTP;
