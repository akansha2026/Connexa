import nodemailer from 'nodemailer';
import { transporter } from '../config/email';

export async function sendMail(from: string, to: string, subject: string, body: string){
    const res = await transporter.sendMail({
        from,
        to,
        subject,
        html: `<p>${body}</p>`,
    })

    console.log(res)
}