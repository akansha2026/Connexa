import { Request, Response } from "express";
import { BAD_REQUEST_CODE, INTERNAL_SERVER_ERROR_CODE, INTERNAL_SERVER_ERROR_MESSAGE, OK_CODE } from "../constants/http-status.constants";
import logger from "../configs/logger";
import { AuthTokenPayload } from "../types/auth.types";
import bcrypt from "bcrypt";
import dbClient from "../configs/db";
import { isValidImageUrl } from "../utils/payload.utils";
import { UpdateUserPayload } from "../types/user.types";

export async function updateUser(req: Request, res: Response) {
    try {
        const payload: UpdateUserPayload = req.body

        if (!payload.name && !payload.password && !payload.avatarUrl) {
            res.status(BAD_REQUEST_CODE).json({
                error: "Atleat one of name, password or avatarUrl is required to update user profile."
            })
            return;
        }

        // I also want to validate the avatarUrl is of type string and starts with http or https
        if (payload.avatarUrl && !isValidImageUrl(payload.avatarUrl)) {
            res.status(BAD_REQUEST_CODE).json({
                error: "Avatar URL must be a valid URL"
            });
            return;
        }

        const tokenPayload = req.user as AuthTokenPayload

        const user = await dbClient.user.findFirst({
            where: {
                id: tokenPayload.id
            }
        })

        let password = user?.password;
        let name = user?.name;
        let avatarUrl = user?.avatarUrl

        if (payload.password) password = await bcrypt.hash(payload.password, 10);
        if (payload.name) name = payload.name
        if (payload.avatarUrl) avatarUrl = payload.avatarUrl

        const updatedUser = await dbClient.user.update({
            where: {
                id: tokenPayload.id
            },
            data: {
                name,
                password,
                avatarUrl
            }
        })

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

export async function getAllUsers(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 20; // default page size
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // Fetch total users count
    const totalUsers = await dbClient.user.count();

    // Fetch paginated users
    const users = await dbClient.user.findMany({
      skip: offset,
      take: limit,
      orderBy: { name: 'asc' }, // optional: sort alphabetically
      select: {
        id: true,
        name: true,
        email: true,
        verified: true,
        online: true,
        lastSeen: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(OK_CODE).json({
      message: "Users fetched successfully",
      data: users,
      meta: {
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit),
        currPage: page,
      },
    });
  } catch (error) {
    let message = INTERNAL_SERVER_ERROR_MESSAGE;
    if (error instanceof Error) {
      message = error.message;
    }
    logger.error(message);
    res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
  }
}