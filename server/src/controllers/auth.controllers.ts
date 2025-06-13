import { Request, Response } from "express";
import { z, ZodError } from "zod";
import bcrypt from "bcrypt";
import dbClient from "../configs/db";
import logger from "../configs/logger";
import {
  BAD_REQUEST_CODE,
  CONFLICT_CODE,
  CREATED_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  INTERNAL_SERVER_ERROR_MESSAGE,
  OK_CODE,
  UNAUTHORIZED_CODE,
} from "../constants/http-status.constants";
import { LoginPayload, RegisterPayload, ResetPasswordPayload } from "../types/auth.types";
import { formatZodError } from "../utils/zod.utils";
import { sendEmail } from "../utils/email";
import {
  CLIENT_BASE_URL,
  CLIENT_PASSWORD_RESET_ENDPOINT,
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

    // For signUp we have to save the data of user in user database
    const savedUser = await dbClient.user.create({
      data: {
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
        verifyLink: `${CLIENT_BASE_URL}${verifyEndpoint}`,
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
  try {
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
  } catch (error) {
    let message = INTERNAL_SERVER_ERROR_MESSAGE;
    if (error instanceof Error) {
      message = error.message;
    }
    logger.error(message);
    res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    // Delete all cookies from browser
    // Set tokens in cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    })

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 day
    })

    res.status(OK_CODE).json({
      message: "User logged out successfully",
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

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Please provide your registered email",
      });
      return;
    }

    // We will check in database if the user exists or not
    const foundUser = await dbClient.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!foundUser) {
      res.status(UNAUTHORIZED_CODE).json({
        error: "Invalid email address",
      });
      return;
    }

    const token = jwt.sign({ email: email }, JWT_SECRET_KEY!, {
      expiresIn: "10m"
    })

    const verifyEmailEndpoint = CLIENT_PASSWORD_RESET_ENDPOINT?.replace(
      "{token}",
      token,
    );

    let templatePath = path.join(process.cwd(), "templates", "reset-password.ejs");
    await sendEmail(
      SMTP_USER!,
      email,
      "Password Reset",
      templatePath,
      {
        name: foundUser.name,
        resetLink: `${CLIENT_BASE_URL}${verifyEmailEndpoint}`,
      },
    );

    res.status(OK_CODE).json({
      message: "Reset link sent successfully"
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

export async function resetPassword(req: Request, res: Response) {
  try {
    const payload: ResetPasswordPayload = req.body
    if (!payload.password || !payload.token) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Password and token are required",
      });
      return;
    }

    // Validate the token
    const tokenPayload = jwt.verify(payload.token, JWT_SECRET_KEY!);

    let email: string | undefined;
    if (typeof tokenPayload === "object" && tokenPayload !== null && "email" in tokenPayload) {
      email = (tokenPayload as jwt.JwtPayload).email as string;
    }

    if (!email) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Invalid or expired token",
      });
      return;
    }

    // Hash the password again
    const hashedPassword = await bcrypt.hash(payload.password, 10);

    await dbClient.user.update({
      data: {
        password: hashedPassword
      },
      where: {
        email: email
      }
    })


    res.status(OK_CODE).json({
      message: "Password updated succesfully"
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

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Token is required"
      })
    }

    const tokenPayload = jwt.verify(token, JWT_SECRET_KEY!)

    let email: string | undefined;
    if (typeof tokenPayload === "object" && tokenPayload !== null && "email" in tokenPayload) {
      email = (tokenPayload as jwt.JwtPayload).email as string;
    }

    if (!email) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Invalid or expired token",
      });
      return;
    }

    // Update tyhe user status
    const FoundUser = dbClient.user.update({
      data:{
        verified:true
      },
      where:{
        email: email
      }
    })
    res.status(OK_CODE).json({
      message: "Email verified succesfully"
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

export async function getProfile(req: Request, res: Response) {
  try {
    const id = req.user?.id

    const foundUser = await dbClient.user.findFirst({
      where: {
        id: id
      },
      omit: {
        password: true
      }
    })

    if (!foundUser) {
      res.status(UNAUTHORIZED_CODE).json({
        error: "Invalid email address or user id",
      });
      return;
    }

    res.status(OK_CODE).json({
      message: "Successfully fetched profile",
      data: foundUser
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