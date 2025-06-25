import { User } from '../entity/User'
import UserService from '../services/User.service'
import { UpdateUserDTO } from '../Types/DataTransferObjects/UsersDTO'
import ApiError from '../utils/ApiError'
import ApiResponse from '../utils/ApiResponse'
import asyncHandler from '../utils/asyncHandler'
import {
  create_token,
  decode_refresh_token,
  decode_token,
} from '../utils/AuthUtils'
import { comparePassword, createPasswordHash } from '../utils/bcrypt'
import { uploadToCloudinary } from '../utils/cloudinary'

const cookieOptions = {
  httpOnly: true,
  secure: true, // Use secure cookies in production
  signed: true, // Use signed cookies for security
  maxAge: 10 * 24 * 60 * 60 * 1000, // 10 day in milliseconds
}
const validatePassword = (password: string) => {
  let passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

const generateAccessAndRefreshTokens = (userId: string, username: string) => {
  try {
    const accessToken = create_token({ id: userId, username: username })
    const refreshToken = create_token({ id: userId, username: username }, true)
    return { accessToken, refreshToken }
  } catch (error: Error | any) {
    throw new ApiError(
      500,
      'Error generating tokens',
      error.message || 'Internal Server Error'
    )
  }
}
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body
  const localAvatarUrl: string | null = req.file ? req.file.path : null
  if (!username || !email || !password || !displayName) {
    res.status(400).json({ message: 'All fields are required' })
    return
  }
  if (!validatePassword(password)) {
    throw new ApiError(
      400,
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
  }
  const existingUser: boolean = await UserService.existUser(email)
  if (existingUser) {
    res.status(400).json({ message: 'User already exists' })
    return
  }
  let avatarUrl: string | null = null
  if (localAvatarUrl) {
    const cloudinaryResponse: { secure_url: string } = await uploadToCloudinary(
      localAvatarUrl
    )
    avatarUrl = cloudinaryResponse.secure_url
  }
  let user: User | null = null

  if (avatarUrl != null) {
    user = await UserService.create(
      username,
      email,
      password,
      displayName,
      avatarUrl
    )
  } else {
    user = await UserService.create(username, email, password, displayName)
  }
  if (!user) {
    throw new ApiError(500, 'User creation failed')
  }
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  }

  res
    .status(201)
    .json(new ApiResponse(201, userResponse, 'User created successfully'))
})

const logInUser = asyncHandler(async (req, res) => {
  console.log(req.body)
  console.log('Email: ', req.body.email, ' Passoword: ', req.body.password)
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' })
    return
  }
  const user = await UserService.findByEmail(email)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  const isPasswordValid = await comparePassword(password, user.passwordHash)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password')
  }
  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
    user.id,
    user.username
  )
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  }
  res.setHeader('Authorization', `Bearer ${accessToken}`)
  res
    .status(200)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, userResponse, 'User logged in successfully'))
})

const logoutUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, null, 'User logged out successfully'))
})

const refreshToken = asyncHandler(async (req, res) => {
  // console.log('Incoming Refresh Token : ', req.cookies?.refreshToken)
  // console.log(
  //   'Incoming Signed Refresh Token : ',
  //   req.signedCookies?.refreshToken
  // )
  // const incomingRefreshToken = req.signedCookies?.refreshToken
  // if (!incomingRefreshToken) {
  //   throw new ApiError(401, 'Refresh token is required')
  // }
  // const decodedToken = decode_refresh_token(incomingRefreshToken)
  // if (!decodedToken || !decodedToken.refresh || !decodedToken.user) {
  //   throw new ApiError(401, 'Invalid refresh token')
  // }
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized')
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
    req.user.id,
    req.user.username
  )
  res.setHeader('Authorization', `Bearer ${accessToken}`)
  res
    .status(200)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(new ApiResponse(200, null, 'Tokens refreshed successfully'))
})

const UpdateUserDetails = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized')
  }
  const updatedDetails: UpdateUserDTO = req.body
  const updatedDetailsKeys = Object.keys(updatedDetails)
  updatedDetailsKeys.forEach((key) => {
    if (key == 'avatar') {
      throw new ApiError(
        400,
        'Avatar update not allowed. Use Update Avatar service'
      )
    }
  })
  if (Object.entries(updatedDetails).length == 0) {
    throw new ApiError(400, 'Invalid Update Details')
  }
  const updatedUser = await UserService.updateUserDetails(
    req.user.id,
    updatedDetails
  )
  if (!updatedUser) {
    throw new ApiError(500, 'User update failed')
  }
  const userResponse = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    displayName: updatedUser.displayName,
    avatarUrl: updatedUser.avatarUrl,
    lastSeenAt: updatedUser.lastSeenAt,
    createdAt: updatedUser.createdAt,
  }
  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, 'User updated successfully'))
})

const UpdatePassword = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized')
  }
  const { oldPassword, newPassword, confirmPassword } = req.body
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, 'All fields are required')
  }
  if (newPassword != confirmPassword) {
    throw new ApiError(400, 'Passwords do not match')
  }
  if (!validatePassword(newPassword)) {
    throw new ApiError(
      400,
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
  }
  const updatedUser = await UserService.updateUserPassword(
    req.user.id,
    oldPassword,
    newPassword
  )
  const updatedUserResponse = {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    displayName: updatedUser.displayName,
    avatarUrl: updatedUser.avatarUrl,
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedUserResponse, 'Password updated successfully')
    )
})

const UpdateAvatar = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized')
  }
  const localAvatarUrl: string | null = req.file ? req.file.path : null
  if (!localAvatarUrl) {
    throw new ApiError(400, 'Avatar is required')
  }
  const cloudinaryResponse = await uploadToCloudinary(localAvatarUrl)
  const updatedUser = await UserService.updateUserDetails(req.user.id, {
    avatarUrl: cloudinaryResponse.secure_url,
  })
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl: updatedUser.avatarUrl },
        'Avatar updated'
      )
    )
})

export {
  registerUser,
  logInUser,
  logoutUser,
  refreshToken,
  UpdateUserDetails,
  UpdateAvatar,
  UpdatePassword,
}
