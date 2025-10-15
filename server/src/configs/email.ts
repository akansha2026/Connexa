import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid";
import { SENDGRID_API_KEY } from "./variables";

export const emailClient = nodemailer.createTransport(
  sgTransport({
    apiKey: SENDGRID_API_KEY || ""
  })
);