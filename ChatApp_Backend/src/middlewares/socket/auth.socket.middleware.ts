import { TypedSocket } from '../../Types/SocketTypes'
import { decode_token } from '../../utils/AuthUtils'

export function attachUserData(socket: TypedSocket, next: (err?: any) => void) {
  const token = socket.handshake.auth?.token
  if (!token) {
    return next(new Error('Authentication token is missing'))
  }
  const decoded_token = decode_token(token)

  if (!decoded_token.user) {
    return next(new Error('Invalid token'))
  }

  socket.data.userId = decoded_token.user.id
  socket.data.username = decoded_token.user.username

  next()
}
