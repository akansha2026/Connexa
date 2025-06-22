import { Request, Response } from "express";
import {
  BAD_REQUEST_CODE,
  CREATED_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  INTERNAL_SERVER_ERROR_MESSAGE,
} from "../constants/http-status.constants";
import logger from "../configs/logger";
import dbClient from "../configs/db";
import { CreateConversationPayload } from "../types/conversation.types";
import { ConversationConstants } from "../constants/conversation.constants";

export async function createConversation(req: Request, res: Response) {
  logger.debug("Entered createConnversation controller")
  try {
    const loggedInUserId = req.user?.id;
    const payload: CreateConversationPayload = req.body;

    // validations
    if (payload.isGroup && !payload.name) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Group name is mandatory",
      });
      return;
    }

    if (!payload.participants || payload.participants.length < 2) {
      res.status(BAD_REQUEST_CODE).json({
        error: "At least 2 participants are required to create a conversation",
      });
      return;
    }

    if (payload.participants.length > ConversationConstants.MAX_PARTICIPANTS) {
      res.status(BAD_REQUEST_CODE).json({
        error: `A conversation can have a maximum of ${ConversationConstants.MAX_PARTICIPANTS} participants`,
      });
      return;
    }

    if (payload.isGroup && (!payload.admins || payload.admins.length < 1)) {
      res.status(BAD_REQUEST_CODE).json({
        error: "At least 1 admin is required for a group conversation",
      });
      return;
    }

    // Check if the participants exist in the database
    const participants = await dbClient.user.findMany({
      where: {
        id: {
          in: payload.participants,
        },
      },
      select: {
        id: true, // Select only the id field
      },
    });

    if (participants.length !== payload.participants.length) {
      res.status(BAD_REQUEST_CODE).json({
        error: "One or more participants do not exist",
      });
      return;
    }

    if (payload.isGroup && payload.admins) {
      const admins = await dbClient.user.findMany({
        where: {
          id: {
            in: payload.admins,
          },
        },
        select: {
          id: true,
        },
      });

      if (admins.length !== payload.admins.length) {
        res.status(BAD_REQUEST_CODE).json({
          error: "One or more admins do not exist",
        });
        return;
      }
    }

    //  ensure the logged-in user is part of the participants 
    if (!payload.participants.includes(loggedInUserId!)) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Logged-in user must be a participant in the conversation",
      });
      return;
    }

    // Admin check for group conversations
    if (payload.isGroup && payload.admins && !payload.admins.includes(loggedInUserId!)) {
      res.status(BAD_REQUEST_CODE).json({
        error: "Logged-in user must be an admin in the group conversation",
      });
      return;
    }

    // One to One chat handling
    if (!payload.isGroup && (payload.participants.length > 2 || payload.participants.length < 2)) {
      res.status(BAD_REQUEST_CODE).json({
        error: "One-to-one conversations can only have 2 participants",
      });
      return;
    }

    if (!payload.isGroup) {
      // Check if a one-to-one conversation already exists between the participants
      const existingConversation = await dbClient.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: payload.participants,
              },
            },
          },
        },
      });

      if (existingConversation) {
        res.status(BAD_REQUEST_CODE).json({
          error: "A one-to-one conversation already exists between these participants",
        });
        return;
      }
    }

    const createdConversation = await dbClient.conversation.create({
      data: {
        isGroup: payload.isGroup,
        name: payload.name
      },
    });

    // Add participants to the conversation
    await dbClient.participant.createMany({
      data: payload.participants.map((participantId) => ({
        userId: participantId,
        conversationId: createdConversation.id,
      })),
    });

    // Add admins to the conversation if it's a group chat
    if (payload.isGroup && payload.admins) {
      await dbClient.conversationAdmin.createMany({
        data: payload.admins.map((adminId) => ({
          userId: adminId,
          conversationId: createdConversation.id,
        })),
      });
    }

    res.status(CREATED_CODE).json({
      message: "Conversation created successfully",
      data: createdConversation,
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

export async function getConversationsByUserId(req: Request, res: Response) {
  logger.debug("Entered getConversationsByUserId controller");
  try {
    const userId = req.user?.id;

    const limit = ConversationConstants.CONVERSATION_PAGE_SIZE;

    // Handle pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const conversations = await dbClient.conversation.findMany({
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
        admins: {
          select: {
            userId: true,
          },
        },
      },
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    // Finding total conversations
    const totalConversations = await dbClient.conversation.count({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
    });

    // Find the last message corresponding to each conversation
    const conversationIds = conversations.map((conv) => conv.id);
    const lastMessages = await dbClient.message.findMany({
      where: {
        conversationId: {
          in: conversationIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    // Map last messages to conversations
    const conversationsWithLastMessage = conversations.map((conversation) => {
      const lastMessage = lastMessages.find((msg) => msg.conversationId === conversation.id);
      return {
        ...conversation,
        lastMessage: lastMessage || null, // Include last message or null if not found
      };
    });

    res.status(200).json({
      message: "Conversations fetched successfully",
      data: conversationsWithLastMessage,
      meta: {
        total: totalConversations,
        page: Math.ceil(totalConversations / limit),
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

export async function getConversationMessages(req: Request, res: Response) {
  logger.debug("Entered getConversationMessages controller");
  try {
    const conversationId = req.params.id;
    const limit = ConversationConstants.MESSAGE_PAGE_SIZE;

    // Handle pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const totalMessages = await dbClient.message.count({
      where: {
        conversationId: conversationId,
      },
    });

    const messages = await dbClient.message.findMany({
      where: {
        conversationId: conversationId,
      },
      skip: offset,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
      ]
    });

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
      meta: {
        total: totalMessages,
        page: Math.ceil(totalMessages / limit),
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