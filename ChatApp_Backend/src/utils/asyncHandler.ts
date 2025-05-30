import { Request, Response, NextFunction, RequestHandler } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { JwtUser } from './AuthUtils'

/**
 * Async handler for Express routes to catch errors in async functions.
 * @param requestHandler - The async request handler function.
 * @returns A middleware function that handles the request and catches errors.
 */

interface ExtendedRequest extends Request {
  user?: JwtUser
}
type AsyncHandler = (
  requestHandler: (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) => Promise<any>
) => RequestHandler

const asyncHandler: AsyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}

export default asyncHandler
