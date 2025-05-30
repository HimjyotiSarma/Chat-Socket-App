import ApiError from '../utils/ApiError'
import asyncHandler from '../utils/asyncHandler'
import { decode_token } from '../utils/AuthUtils'

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  const accessToken: string | null =
    req.cookies.accessToken || req.header('Authorization') || null

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized')
  }
  const decodedToken = decode_token(accessToken)
  if (!decodedToken || !decodedToken.user) {
    throw new ApiError(401, 'Something went wrong while decoding Token')
  }
  req.user = decodedToken.user
  next()
})

const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken: string | null = req.cookies.refreshToken || null

  if (!refreshToken) {
    throw new ApiError(401, 'Unauthorized')
  }
  const decodedToken = decode_token(refreshToken)
  if (!decodedToken || !decodedToken.user) {
    throw new ApiError(401, 'Something went wrong while decoding Token')
  }
  req.user = decodedToken.user
  next()
})

export { verifyAccessToken, verifyRefreshToken }
