import { FastifyInstance, FastifyPluginOptions } from "fastify";

export const clients: Map<string, any> = new Map();

export async function websocketPlugin(
    app: FastifyInstance,
    opts: FastifyPluginOptions
) {
    app.get("/ws", { websocket: true }, (socket, req) => {
        const userId = (req.query as any).userId as string;

        if (userId) {
            clients.set(userId, socket);
            app.log.info(`✅ User ${userId} connected to WebSocket`);
        }

        socket.on("close", () => {
            if (userId) {
                clients.delete(userId);
                app.log.info(`❌ User ${userId} disconnected`);
            }
        });
    });
}