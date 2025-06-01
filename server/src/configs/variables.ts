import dotenv from "dotenv";

// Load env variables
dotenv.config();

export const {
    PORT,
    NODE_ENV
} = process.env