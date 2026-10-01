import "server-only";
import nodemailer from "nodemailer";
export async function sendResetEmail(to:string,url:string){
  if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASSWORD||!process.env.SMTP_FROM){
    if(process.env.NODE_ENV==="production")throw new Error("Password reset email is not configured.");
    console.log(`Development password reset for ${to}: ${url}`);
    return;
  }
  const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:Number(process.env.SMTP_PORT||587)===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}});
  await transporter.sendMail({from:process.env.SMTP_FROM,to,subject:"Reset your PlayUp password",text:`Use this link to reset your password. It expires in one hour.\n\n${url}`});
}
