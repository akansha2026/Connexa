import winston from "winston";
import { NODE_ENV } from "./variables";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger