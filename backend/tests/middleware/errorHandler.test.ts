import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { errorHandler, AppError } from '../../src/middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
    
    mockNext = jest.fn();
  });

  describe('AppError class', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 400, 'VALIDATION_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should default to status 500 if not provided', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe('INTERNAL_ERROR');
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should handle Prisma unique constraint error', () => {
      const error = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] }
      });

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY',
      });
    });

    it('should handle Prisma record not found error', () => {
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0'
      });

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
    });

    it('should pass error to next if headers already sent', () => {
      const error = new Error('Test error');
      mockResponse.headersSent = true;

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
