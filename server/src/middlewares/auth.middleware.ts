import { NextFunction, Request, Response } from "express";
import logger from "../configs/logger";
import jwt from "jsonwebtoken"
import { INTERNAL_SERVER_ERROR_CODE, INTERNAL_SERVER_ERROR_MESSAGE, UNAUTHORIZED_CODE } from "../constants/http-status.constants";
import { AUTHORIZATION_EXCLUSION_ENDPOINTS, JWT_SECRET_KEY } from "../configs/variables";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const excludedEndpoints = AUTHORIZATION_EXCLUSION_ENDPOINTS?.split(',')
        const endpoint = req.path
        // Also take care of exclusion path list
        if (excludedEndpoints?.includes(endpoint)) {
            next();
            return;
        }
        // Add code here to check if there are cookies present in request or not, if not present throw unauthorized error
        const { accessToken } = req.cookies
        // If present then get the accessToken cookie value, the decode it using JWT and check for expiry ansd verify signature with you JWT secret
        if (!accessToken) {
            res.status(UNAUTHORIZED_CODE).json({
                error: "Missing access token"
            });
            return;
        }

        // Let's decode the access token is it right or wrong
        const payload = jwt.verify(accessToken, JWT_SECRET_KEY!);
        
        // Then attach the email and id to the request
        if (typeof payload === "object" && payload !== null && "email" in payload && "id" in payload) {
            req.user = {
                email: (payload as any).email,
                id: (payload as any).id
            }
        } else {
            res.status(UNAUTHORIZED_CODE).json({
                error: "Invalid token payload"
            });
            return;
        }
        next();
    } catch (error) {
        let message = INTERNAL_SERVER_ERROR_MESSAGE;
        if (error instanceof Error)
            message = error.message
        res.status(INTERNAL_SERVER_ERROR_CODE).json({
            error: message
        })
    }
}