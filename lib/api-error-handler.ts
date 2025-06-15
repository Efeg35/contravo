import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

// Error types for proper categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR', 
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

// Structured error response interface
export interface ApiErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// Success response interface
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// Custom error class for business logic errors
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main error handler function
export function handleApiError(
  error: unknown,
  context: string = 'API',
  requestId: string = generateRequestId()
): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString();
  
  // Handle custom ApiError
  if (error instanceof ApiError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        requestId
      }
    };
    
    // Log with proper severity
    console.error(`[${context}] ${error.type}:`, {
      requestId,
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp
    });
    
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let errorType = ErrorType.DATABASE;
    let message = 'Veritabanı işlemi başarısız oldu';
    let statusCode = 500;
    
    switch (error.code) {
      case 'P2002':
        errorType = ErrorType.VALIDATION;
        message = 'Bu kayıt zaten mevcut. Benzersiz bir değer giriniz.';
        statusCode = 409;
        break;
      case 'P2025':
        errorType = ErrorType.NOT_FOUND;
        message = 'İstenen kayıt bulunamadı';
        statusCode = 404;
        break;
      case 'P2003':
        errorType = ErrorType.VALIDATION;
        message = 'İlişkili kayıt bulunamadı. Lütfen geçerli bir referans kullanın.';
        statusCode = 400;
        break;
      case 'P2021':
        errorType = ErrorType.DATABASE;
        message = 'Veritabanı tablosu bulunamadı';
        statusCode = 500;
        break;
    }
    
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        type: errorType,
        message,
        code: `PRISMA_${error.code}`,
        details: process.env.NODE_ENV === 'development' ? error.meta : undefined,
        timestamp,
        requestId
      }
    };
    
    console.error(`[${context}] Prisma Error:`, {
      requestId,
      code: error.code,
      message: error.message,
      meta: error.meta,
      timestamp
    });
    
    return NextResponse.json(errorResponse, { status: statusCode });
  }

  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION,
        message: 'Gönderilen veri formatı hatalı',
        code: 'VALIDATION_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp,
        requestId
      }
    };
    
    console.error(`[${context}] Validation Error:`, {
      requestId,
      message: error.message,
      timestamp
    });
    
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';
  
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      type: ErrorType.INTERNAL,
      message: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyiniz.',
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp,
      requestId
    }
  };
  
  // Log full error details
  console.error(`[${context}] Internal Error:`, {
    requestId,
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp
  });
  
  return NextResponse.json(errorResponse, { status: 500 });
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta']
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString()
    }
  };
  
  return NextResponse.json(response);
}

// Pre-defined error creators for common scenarios
export const commonErrors = {
  unauthorized: () => new ApiError(
    ErrorType.AUTHORIZATION,
    'Bu işlem için yetkiniz bulunmamaktadır',
    'UNAUTHORIZED',
    401
  ),
  
  forbidden: (resource: string = 'kaynak') => new ApiError(
    ErrorType.AUTHORIZATION,
    `${resource} erişimi reddedildi`,
    'FORBIDDEN',
    403
  ),
  
  notFound: (resource: string = 'Kayıt') => new ApiError(
    ErrorType.NOT_FOUND,
    `${resource} bulunamadı`,
    'NOT_FOUND',
    404
  ),
  
  validationFailed: (field: string, reason: string) => new ApiError(
    ErrorType.VALIDATION,
    `${field} alanı geçersiz: ${reason}`,
    'VALIDATION_FAILED',
    400
  ),
  
  rateLimitExceeded: () => new ApiError(
    ErrorType.RATE_LIMIT,
    'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyiniz.',
    'RATE_LIMIT_EXCEEDED',
    429
  ),
  
  businessLogicError: (message: string, code: string = 'BUSINESS_LOGIC_ERROR') => new ApiError(
    ErrorType.BUSINESS_LOGIC,
    message,
    code,
    400
  )
};

// Async wrapper for API handlers to automatically catch errors
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context: string = 'API'
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
} 