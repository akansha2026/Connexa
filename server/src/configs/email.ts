import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "./variables";

export const emailClient = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT!, 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER!,
    pass: SMTP_PASS || "",
  },
});
