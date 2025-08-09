import { FastifyRequest, FastifyReply, DoneFuncWithErr } from 'fastify';

export const authenticate = (request: FastifyRequest, reply: FastifyReply, done: DoneFuncWithErr) => {
  // a real application would have a more robust authentication
  done();
};