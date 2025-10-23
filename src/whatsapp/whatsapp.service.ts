import axios, { AxiosInstance } from "axios";

const META_API_URL = "https://graph.facebook.com/v22.0";

export class WhatsAppService {
    private readonly axiosInstance: AxiosInstance;

    constructor(axiosInstance?: AxiosInstance) {
        this.axiosInstance =
            axiosInstance ||
            axios.create({
                baseURL: META_API_URL,
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });
    }


    async sendText(to: string, text: string): Promise<void> {
        console.log(process.env.WHATSAPP_TOKEN, 'WHATSAPP_TOKEN')
        try {
            await this.axiosInstance.post(
                `/${process.env.WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to,
                    type: "text",
                    text: { body: text },
                }
            );
        } catch (error) {
            this.handleError(error);
        }
    }


    async sendMessage(data: Record<string, unknown>): Promise<void> {
        console.log(process.env.WHATSAPP_TOKEN, 'WHATSAPP_TOKEN')
        try {
            await this.axiosInstance.post(
                `/${process.env.WHATSAPP_PHONE_ID}/messages`,
                data
            );
        } catch (error) {
            this.handleError(error);
        }
    }


    formatList(
        title: string,
        options: { id: string; title: string; description?: string }[],
        to: string,
        footerText = "Powered by Evolt"
    ) {
        return {
            messaging_product: "whatsapp",
            to,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: title },
                body: { text: "Choose an option:" },
                footer: { text: footerText },
                action: {
                    button: "Select",
                    sections: [
                        {
                            title: "Options",
                            rows: options,
                        },
                    ],
                },
            },
        };
    }


    private handleError(error: unknown): void {
        if (axios.isAxiosError(error)) {
            console.error(
                "❌ WhatsApp API Error:",
                error.response?.data || error.message
            );
        } else {
            console.error("❌ Unexpected Error:", error);
        }
        throw new Error("Failed to send WhatsApp message");
    }
}