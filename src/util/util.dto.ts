import { FastifyRequest } from 'fastify';

export interface IdDto {
    id: string;
}

export enum RouteMethods {
    POST = 'POST',
    GET = 'GET',
    DELETE = 'DELETE',
    PUT = 'PUT',
    PATCH = 'PATCH',
}
