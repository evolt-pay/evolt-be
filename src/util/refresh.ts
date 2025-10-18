import { httpErrors } from "@fastify/sensible";

export const packRefresh = (tokenId: string, raw: string) => `${tokenId}.${raw}`;

export const unpackRefresh = (compound: string) => {
    const i = compound.indexOf(".");
    if (i < 1) throw httpErrors.badRequest("Malformed refresh token");
    return { tokenId: compound.slice(0, i), raw: compound.slice(i + 1) };
};