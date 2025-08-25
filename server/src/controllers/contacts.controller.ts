import { Request, Response } from "express";
import {
    OK_CODE,
    CREATED_CODE,
    BAD_REQUEST_CODE,
    NOT_FOUND_CODE,
    INTERNAL_SERVER_ERROR_CODE,
    INTERNAL_SERVER_ERROR_MESSAGE,
} from "../constants/http-status.constants"
import dbClient from "../configs/db";
import logger from "../configs/logger";

// --- Add a new contact ---
export async function addContact(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const { contactId, nickname } = req.body;

        if (!userId || !contactId) {
            res.status(BAD_REQUEST_CODE).json({ error: "Missing userId or contactId" });
            return
        }

        if (userId === contactId) {
            res.status(BAD_REQUEST_CODE).json({ error: "Cannot add yourself as contact" });
            return
        }

        // Check if contact already exists
        const existing = await dbClient.contact.findUnique({
            where: { ownerId_contactId: { ownerId: userId, contactId } },
        });

        if (existing) {
            res.status(BAD_REQUEST_CODE).json({ error: "Contact already exists" });
            return
        }

        const contact = await dbClient.contact.create({
            data: {
                ownerId: userId,
                contactId,
                nickname: nickname || null,
            },
        });

        res.status(CREATED_CODE).json({
            message: "Contact added successfully",
            data: contact,
        });
    } catch (error) {
        let message = INTERNAL_SERVER_ERROR_MESSAGE;
        if (error instanceof Error) message = error.message;
        logger.error(message);
        res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
    }
}

// --- Get contacts for current user (with pagination) ---
export async function getContacts(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(BAD_REQUEST_CODE).json({ error: "Missing userId" });
            return
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const page = parseInt(req.query.page as string) || 1;
        const offset = (page - 1) * limit;

        // total contacts
        const total = await dbClient.contact.count({
            where: { ownerId: userId },
        });

        const contacts = await dbClient.contact.findMany({
            where: { ownerId: userId },
            skip: offset,
            take: limit,
            include: {
                contact: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(OK_CODE).json({
            message: "Contacts fetched successfully",
            data: contacts.map(c => ({
                id: c.contact.id,
                name: c.contact.name,
                email: c.contact.email,
                avatarUrl: c.contact.avatarUrl,
                nickname: c.nickname,
                blocked: c.blocked,
                createdAt: c.createdAt,
            })),
            meta: {
                total,
                pages: Math.ceil(total / limit),
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

// --- Delete a contact ---
export async function deleteContact(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        const contactId = req.params.contactId;

        if (!userId || !contactId) {
            res.status(BAD_REQUEST_CODE).json({ error: "Missing userId or contactId" });
            return
        }

        const existing = await dbClient.contact.findUnique({
            where: { ownerId_contactId: { ownerId: userId, contactId } },
        });

        if (!existing) {
            res.status(NOT_FOUND_CODE).json({ error: "Contact not found" });
            return
        }

        await dbClient.contact.delete({
            where: { ownerId_contactId: { ownerId: userId, contactId } },
        });

        res.status(OK_CODE).json({
            message: "Contact deleted successfully",
        });
    } catch (error) {
        let message = INTERNAL_SERVER_ERROR_MESSAGE;
        if (error instanceof Error) message = error.message;
        logger.error(message);
        res.status(INTERNAL_SERVER_ERROR_CODE).json({ error: message });
    }
}