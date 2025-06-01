import { Request, Response } from "express";
import { z, ZodError } from "zod"
import bcrypt from "bcrypt"
import client from "../configs/db";
import { logger } from "../configs/logger";
import { v4 as uuid } from "uuid"
import { BAD_REQUEST_CODE, CREATED_CODE, INTERNAL_SERVER_ERROR_CODE, INTERNAL_SERVER_ERROR_MESSAGE } from "../constants/http-status.constants";
import { error } from "console";
import { RegisterPayload } from "../types/auth.types";
import { formatZodError } from "../utils/zod.utils";

export async function signup(req: Request, res: Response) {
    try {
        // We have to Extract the credentials from body 
        const credentials: RegisterPayload = req.body;

        // Check if all content came in correct format
        const schema = z.object({
            name: z.string().min(1, {
                message: "Name must be atleat 1 character long"
            }),
            email: z.string().email({
                message: "Email is incorrect"
            }),
            password: z.string().min(8, {
                message: "Password must be atleast 8 character long"
            }).max(20, {
                message: "Password should not be greater than 20 character long"
            })
        })

        // Validated credentials
        schema.parse(credentials)

        // Checking if there exist any user with the same email
        const foundUser = await client.user.findFirst({
            where: {
                email: credentials.email
            }
        })

        if (foundUser) {
            res.status(BAD_REQUEST_CODE).json({
                error: "User with same email already exists"
            })
            return
        }

        const hashedPassword = await bcrypt.hash(credentials.password, 10)
        const id = uuid()

        // For signUp we have to save the data of user in user database
        const savedUser = await client.user.create({
            data: {
                id,
                verified: false,
                ...credentials,
                password: hashedPassword
            },
            omit: {
                password: true
            }
        })

        // Sending verification email


        res.status(CREATED_CODE).json({
            message: "User created successfully",
            data: savedUser
        })

    } catch (error) {
        let message = INTERNAL_SERVER_ERROR_MESSAGE
        if(error instanceof ZodError){
            message = formatZodError(error)
        }
        else if (error instanceof Error) {
            message = error.message
        }
        logger.error(message)
        res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message })
    }
}

export function login(req: Request, res: Response) {

}