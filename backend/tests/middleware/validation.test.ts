import { Request, Response, NextFunction } from 'express';
import { validateBody, validateQuery, validateParams } from '../../src/middleware/validation';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('validateBody', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number().min(0),
    });

    it('should pass validation with valid data', () => {
      mockRequest.body = { name: 'John', age: 25 };
      const middleware = validateBody(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 with invalid data', () => {
      mockRequest.body = { name: 'John', age: -5 };
      const middleware = validateBody(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Array),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    const testSchema = z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
    });

    it('should pass validation with valid query params', () => {
      mockRequest.query = { page: '2', limit: '20' };
      const middleware = validateQuery(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({ page: 2, limit: 20 });
    });

    it('should return 400 with invalid query params', () => {
      mockRequest.query = { page: '0', limit: '200' };
      const middleware = validateQuery(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    const testSchema = z.object({
      id: z.string().cuid(),
    });

    it('should pass validation with valid params', () => {
      mockRequest.params = { id: 'clxyz123456789abcdefghijk' };
      const middleware = validateParams(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 with invalid params', () => {
      mockRequest.params = { id: 'invalid-uuid' };
      const middleware = validateParams(testSchema);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
