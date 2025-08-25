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
      const existingConversation = await dbClient.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId: payload.participants[0] } } },
            { participants: { some: { userId: payload.participants[1] } } },
          ],
          participants: {
            none: {
              userId: {
                notIn: payload.participants,
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

    const createdConversation = await dbClient.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          isGroup: payload.isGroup,
          name: payload.name,
          avatarUrl: payload.avatarUrl || null,
          ownerId: loggedInUserId!,
        },
      });

      await tx.participant.createMany({
        data: payload.participants.map((participantId) => ({
          userId: participantId,
          conversationId: conversation.id,
        })),
      });

      if (payload.isGroup && payload.admins) {
        await tx.conversationAdmin.createMany({
          data: payload.admins.map((adminId) => ({
            userId: adminId,
            conversationId: conversation.id,
          })),
        });
      }

      return conversation;
    });

    const conversationWithDetails = await dbClient.conversation.findUnique({
      where: { id: createdConversation.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: !payload.isGroup,
              },
            },
          },
        },
        admins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(CREATED_CODE).json({
      message: "Conversation created successfully",
      data: conversationWithDetails,
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

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // Fetch conversations for the user
    const conversations = await dbClient.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: offset,
      take: limit,
    });

    const totalConversations = await dbClient.conversation.count({
      where: {
        participants: {
          some: { userId: userId },
        },
      },
    });

    const conversationIds = conversations.map((conv) => conv.id);

    // Fetch all participants for these conversations
    const participants = await dbClient.participant.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      where: {
        conversationId: { in: conversationIds },
      },
    });

    // Fetch last message for each conversation
    const lastMessages = new Map<string, any>();
    for (const id of conversationIds) {
      const message = await dbClient.message.findMany({
        where: { conversationId: id },
        orderBy: [{ createdAt: "desc" }],
        take: 1,
      });
      lastMessages.set(id, message?.[0] || null);
    }

    // Map participants & last message to conversation
    const updatedConversations = conversations.map((conversation) => {
      let participantList = participants
        .filter((p) => p.conversationId === conversation.id)
        .map((p) => {
          const base = { id: p.user.id, name: p.user.name, avatarUrl: '' };
          // Include avatar only for non-group
          if (!conversation.isGroup) base.avatarUrl = p.user.avatarUrl as string;
          return base;
        });

      return {
        ...conversation,
        lastMessage: lastMessages.get(conversation.id) || null,
        participants: participantList,
      };
    });

    res.status(200).json({
      message: "Conversations fetched successfully",
      data: updatedConversations,
      meta: {
        total: totalConversations,
        pages: Math.ceil(totalConversations / limit),
        currPage: page,
      },
    });
  } catch (error) {
    let message = INTERNAL_SERVER_ERROR_MESSAGE;
    if (error instanceof Error) message = error.message;
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
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const offset = (page - 1) * limit;

    // Fetch messages (oldest first for chat UI)
    const messages = await dbClient.message.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      where: { conversationId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalMessages = await dbClient.message.count({
      where: { conversationId },
    });

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
      meta: {
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        currPage: page
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : INTERNAL_SERVER_ERROR_MESSAGE;
    logger.error(message);

    res
      .status(INTERNAL_SERVER_ERROR_CODE)
      .json({ error: message });
  }
}