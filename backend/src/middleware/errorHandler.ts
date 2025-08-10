import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError | any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (res.headersSent) {
    return _next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.issues.map((issue: ZodIssue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.errorCode
    });
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY'
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        message: 'Record not found',
        code: 'NOT_FOUND'
      });
    }
  }

  return res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};