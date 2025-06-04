import { emailClient } from "../configs/email";
import { logger } from "../configs/logger";
import ejs from "ejs"

export async function sendEmail(from: string, to: string, subject: string, templatePath: string, data: any) {
    const html: string = await ejs.renderFile(templatePath, data)
    try {
        emailClient.sendMail({
            from,
            to,
            subject,
            html
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        logger.error(message)

        throw error
    }
}