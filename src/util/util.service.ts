import jwt from "jsonwebtoken";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import { clients } from "../plugin/websocket.plugin.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const SECRET_KEY = process.env.JWT_SECRET!;
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

class UtilService {
    static customResponse = <T>(
        success: boolean,
        message: string,
        data?: T | any
    ) => {
        success = success == null ? true : success;

        if (!message) message = "";
        message = message.charAt(0).toUpperCase() + message.slice(1);

        let dataObject;
        if (data) {
            if (Array.isArray(data)) {
                dataObject = { data };
            } else if (data.data) {
                dataObject = { ...data };
            } else {
                dataObject = { data };
            }
        }

        return {
            success: success,
            ...(success && { message: message }),
            ...(data && dataObject),
            ...(!success && { error: message }),
        };
    };

    static async imageUrlToBase64(url: string): Promise<string> {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const mimeType = response.headers["content-type"] || "image/jpeg";
        const base64 = Buffer.from(response.data, "binary").toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }
    static generateUUID(): string {
        return uuidv4();
    }

    static generateOtp = (): string => {
        return crypto.randomInt(100000, 999999).toString();
    };

    static generateToken = (payload: object, noOfHours = 1): string => {
        return jwt.sign(payload, SECRET_KEY, { expiresIn: `${noOfHours}h` });
    };


    static notifyUser(userId: string, payload: object) {
        const client = clients.get(userId);
        if (client) {
            client.send(JSON.stringify(payload));
        } else {
            console.log(`No active WS connection for user ${userId}`);
        }
    }
    static async sendEmail(
        to: string,
        subject: string,
        text: string
    ): Promise<void> {
        try {
            await sgMail.send({
                to,
                from: process.env.EMAIL_FROM!,
                subject,
                text,
            });
        } catch (error: any) {
            console.error("SendGrid email error:", error.response?.body || error);
            throw new Error("Failed to send email");
        }
    }



}

export default UtilService;