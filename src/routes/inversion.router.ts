import type { FastifyInstance } from "fastify";

export const inversionRouter = async (server: FastifyInstance) => {
    server.get('/inversion', async (request, reply) => {
        return { message: 'Hello from inversion router!' };
    });
};