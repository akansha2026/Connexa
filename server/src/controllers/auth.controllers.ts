import { Request, Response } from "express";
import { z, ZodError } from "zod";
import bcrypt from "bcrypt";
import dbClient from "../configs/db";
import { logger } from "../configs/logger";
import { v4 as uuid } from "uuid";
import {
  BAD_REQUEST_CODE,
  CONFLICT_CODE,
  CREATED_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  OK_CODE,
  UNAUTHORIZED_CODE,
} from "../constants/http-status.constants";
import { LoginPayload, RegisterPayload } from "../types/auth.types";
import { formatZodError } from "../utils/zod.utils";
import { sendEmail } from "../utils/email";
import {
  CLIENT_BASE_URL,
  CLIENT_VERIFY_EMAIL_ENDPOINT,
  JWT_SECRET_KEY,
  SMTP_USER,
} from "../configs/variables";
import path from "path";
import jwt from "jsonwebtoken";

export async function signup(req: Request, res: Response) {
  try {
    // We have to Extract the credentials from body
    const credentials: RegisterPayload = req.body;

    // Check if all content came in correct format
    const schema = z.object({
      name: z.string().min(1, {
        message: "Name must be atleat 1 character long",
      }),
      email: z.string().email({
        message: "Email is incorrect",
      }),
      password: z
        .string()
        .min(8, {
          message: "Password must be atleast 8 character long",
        })
        .max(20, {
          message: "Password should not be greater than 20 character long",
        }),
    });

    // Validated credentials
    schema.parse(credentials);

    // Checking if there exist any user with the same email
    const foundUser = await dbClient.user.findFirst({
      where: {
        email: credentials.email,
      },
    });

    if (foundUser) {
      res.status(CONFLICT_CODE).json({
        error: "User with same email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    const id = uuid();

    // For signUp we have to save the data of user in user database
    const savedUser = await dbClient.user.create({
      data: {
        id,
        verified: false,
        ...credentials,
        password: hashedPassword,
      },
      omit: {
        password: true,
      },
    });

    // Sending verification email
    const token = jwt.sign(
      {
        email: credentials.email,
        id: savedUser.id,
      },
      JWT_SECRET_KEY!,
      {
        expiresIn: "1h",
      },
    );
    const verifyEndpoint = CLIENT_VERIFY_EMAIL_ENDPOINT?.replace(
      "{token}",
      token,
    );

    let templatePath = path.join(process.cwd(), "templates", "welcome.ejs");
    await sendEmail(
      SMTP_USER!,
      credentials.email,
      "Welcome to Connexa!",
      templatePath,
      {
        name: credentials.name,
        verifyLink: `${CLIENT_BASE_URL}/${verifyEndpoint}`,
      },
    );

    res.status(CREATED_CODE).json({
      message: "User created & email sent succesfully",
      data: savedUser,
    });
  } catch (error) {
    let message = INTERNAL_SERVER_ERROR_MESSAGE;
    if (error instanceof ZodError) {
      message = formatZodError(error);
    } else if (error instanceof Error) {
      message = error.message;
    }
    logger.error(message);
    res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
  }
}

export async function login(req: Request, res: Response) {
  const credentials: LoginPayload = req.body;
  if (!credentials.email || !credentials.password) {
    res.status(BAD_REQUEST_CODE).json({
      error: "Email and password are required",
    });
    return;
  }

  // We will check in database if the user exists or not
  const foundUser = await dbClient.user.findFirst({
    where: {
      email: credentials.email,
    },
  });

  if (!foundUser) {
    res.status(UNAUTHORIZED_CODE).json({
      error: "Invalid email address",
    });
    return;
  }

  // We will validate the password
  const isPasswordMatched = await bcrypt.compare(
    credentials.password,
    foundUser.password,
  );
  if (!isPasswordMatched) {
    res.status(UNAUTHORIZED_CODE).json({
      error: "Provided password is incorrect",
    });
    return;
  }

  // We will generate tokens
  const payload = {
    id: foundUser.id,
    email: foundUser.email,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET_KEY!, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(payload, JWT_SECRET_KEY!, {
    expiresIn: "1d",
  });

  // Set tokens in cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.status(OK_CODE).json({
    message: "User logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
}
