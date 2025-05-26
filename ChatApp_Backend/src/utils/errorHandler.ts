import { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import ApiError from './ApiError' // Adjust path as needed

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // now TS knows this is the error-handler overload
  const customError =
    err instanceof ApiError
      ? err
      : new ApiError(500, (err as Error).message, [], (err as Error).stack)

  res.status(customError.statusCode).json({
    success: false,
    statusCode: customError.statusCode,
    message: customError.message,
    data: null,
    stack:
      process.env.NODE_ENV === 'development' ? customError.stack : undefined,
    errors: customError.errors,
  })
}

export default errorHandler
