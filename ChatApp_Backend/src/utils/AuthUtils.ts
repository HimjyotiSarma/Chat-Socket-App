import '../config/loadEnv'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

type JwtPayloadType = {
  jti: string
  user: JwtUser
  refresh: boolean
}
interface JwtUser {
  id: string
  username: string
}

const JWT_SECRET = process.env.JWT_SECRET

function create_token(userData: JwtUser, isRefreshToken: boolean = false) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  const payload: JwtPayloadType = {
    jti: randomUUID(),
    user: userData,
    refresh: isRefreshToken,
  }
  const token = jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: isRefreshToken == true ? '30d' : '24h',
  })
  return token
}

function decode_token(token: string): JwtPayloadType {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  const decoded = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
  }) as JwtPayloadType
  return decoded
}

export { create_token, decode_token }
