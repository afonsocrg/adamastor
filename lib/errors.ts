import { NextResponse } from 'next/server';

export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends APIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class InternalServerError extends APIError {
  constructor(message: string) {
    super(message, 500);
  }
} 

// Updated helper function to handle APIError instances
export function handleError(error: unknown) {
  if (error instanceof APIError) {
    console.error(`${error.name}: ${error.message}`);
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  // Handle unexpected errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
};
