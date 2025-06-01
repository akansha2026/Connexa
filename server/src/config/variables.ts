import dotenv from "dotenv";
dotenv.config();

export const {
    PORT = "3000",
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS
} = process.env;