import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Interface for authenticated request
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string
    email: string
    role: 'ADVISOR' | 'VIEWER'
    name: string
  }
}

// Check if user exists and is active
export async function verifyUserExists(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, role: true, name: true, active: true }
    })

    if (!user) {
      return reply.code(401).send({ error: 'User not found' })
    }

    if (!user.active) {
      return reply.code(401).send({ error: 'User account is inactive' })
    }

    // Update request with fresh user data
    request.user = user
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to verify user' })
  }
}

// Role-based authorization helpers
export const requireRole = (roles: ('ADVISOR' | 'VIEWER')[]) => {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Insufficient permissions',
        required: roles,
        current: request.user.role
      })
    }
  }
}

// Specific role checkers
export const requireAdvisor = requireRole(['ADVISOR'])
export const requireAdvisorOrViewer = requireRole(['ADVISOR', 'VIEWER'])

// Check if user can access client data
export async function canAccessClient(
  request: AuthenticatedRequest, 
  reply: FastifyReply,
  clientId: string
) {
  // ADVISORs can access any client
  if (request.user.role === 'ADVISOR') {
    return true
  }

  // VIEWERs can only access clients they're assigned to
  if (request.user.role === 'VIEWER') {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        advisorId: request.user.id
      }
    })

    if (!client) {
      reply.code(403).send({
        error: 'Access denied to this client data',
        reason: 'Not assigned to this client'
      })
      return false
    }
  }

  return true
}
