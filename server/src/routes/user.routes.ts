import { Router } from "express";
import { user } from "../controllers/user.controllers";

const userRouter = Router();

userRouter.patch("/", user)

export { userRouter }