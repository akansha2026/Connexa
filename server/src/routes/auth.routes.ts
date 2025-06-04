import { Router } from "express";
import { signup } from "../controllers/auth.controllers";

const authRouter = Router();

// Define your routes
authRouter.post("/signup", signup);

export { authRouter };
