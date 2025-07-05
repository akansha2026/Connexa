import { Request, Response } from "express";
import { BAD_REQUEST_CODE, INTERNAL_SERVER_ERROR_CODE, INTERNAL_SERVER_ERROR_MESSAGE, OK_CODE } from "../constants/http-status.constants";
import logger from "../configs/logger";
import { AuthTokenPayload } from "../types/auth.types";
import bcrypt from "bcrypt";
import dbClient from "../configs/db";
import { IMAGE_BASEURL_PREFIX } from "../constants/service.constants";

export async function user(req: Request, res: Response){
    try {
        const payload = req.body

        if(!payload.name && !payload.password && !payload.avatarUrl){
            res.status(BAD_REQUEST_CODE).json({
                error: "Atleat one of name, password or avatarUrl is required to update user profile."
            })  
            return;
        }

        // I also want to validate the avatarUrl is of type string and starts with http or https
        if(payload.avatarUrl && (typeof payload.avatarUrl != "string" && (!payload.avatarUrl.startsWith("http") ||!payload.avatarUrl.startsWith("https") || !payload.avatarUrl.startsWith(IMAGE_BASEURL_PREFIX)))){
            res.status(BAD_REQUEST_CODE).json({
                error: "Avatar URL must be a valid URL starting with http or https."
            });
            return;
        }

        const tokenPayload = req.user as AuthTokenPayload
        const hashedPassword = await bcrypt.hash(payload.password, 10);

        const updatedUser = await dbClient.user.update({
            where: {id: tokenPayload.id},
            data: {
                name: payload.name,
                avatarUrl: payload.avatarUrl,
                password: hashedPassword
            },
            omit: {
                password: true,
            },
        });

        res.status(OK_CODE).json({
            message: "User upadted succesfully",
            data: updatedUser
        })

    } catch (error) {
        let message = INTERNAL_SERVER_ERROR_MESSAGE;
        if (error instanceof Error) {
        message = error.message;
        }
        logger.error(message);
        res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
    }
}