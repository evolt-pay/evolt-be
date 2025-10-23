import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import investorService from "../investor/investor.service.js";
import { WalletService } from "../wallet/wallet.service.js";

export class WhatsAppController {
    private walletConnect: WalletService;

    constructor(private readonly fastify: FastifyInstance) {
        this.walletConnect = new WalletService(fastify);
    }

    verifyWebhook = async (req: FastifyRequest, reply: FastifyReply) => {
        const q = req.query as Record<string, string>;
        const mode = q["hub.mode"];
        const token = q["hub.verify_token"];
        const challenge = q["hub.challenge"];

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            this.fastify.log.info("✅ WhatsApp webhook verified");
            return reply.code(200).send(challenge);
        }

        this.fastify.log.warn("❌ WhatsApp webhook verification failed");
        return reply.code(403).send({ error: "Forbidden" });
    };

    handleIncoming = async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = req.body as any;
            const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            const from = message?.from;
            const text = message?.text?.body?.trim()?.toLowerCase();

            if (!from || !text) return reply.code(200).send("NO_MESSAGE");

            // 🔗 Step 1️⃣ User says "connect wallet"
            if (text === "connect wallet") {
                const existing = await investorService.findByPhone(from);
                if (existing?.accountId) {
                    await this.sendWhatsAppMessage(from, "✅ Your wallet is already connected.");
                    return reply.code(200).send();
                }

                // Generate challenge + link
                const { connectLink } = await this.walletConnect.initiateWalletConnect(from);

                await this.sendWhatsAppMessage(
                    from,
                    `🔗 Tap below to open your wallet and sign the verification message:\n\n${connectLink}\n\nOnce signed, your wallet will be linked automatically.`
                );

                return reply.code(200).send();
            }

            // ✍️ Step 2️⃣ If user already connected, respond normally
            await this.sendWhatsAppMessage(
                from,
                "👋 Welcome to Evolt. You can type:\n- connect wallet\n- create wallet\n- portfolio\n- help"
            );

            return reply.code(200).send();
        } catch (err: any) {
            this.fastify.log.error("❌ WhatsApp error:", err);
            reply.code(500).send({ error: "Internal Server Error" });
        }
    };

    private async sendWhatsAppMessage(to: string, message: string) {
        await axios.post(
            `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to,
                text: { body: message },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );
    }
}