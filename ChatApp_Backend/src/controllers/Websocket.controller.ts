import SocketService from '../services/Socket.service'
import SocketController from './utils/Socket.controller'

class WebSocketController {
  socketId: string
  userId: string
  username: string
  constructor(socketId: string, userId: string, username: string) {
    this.socketId = socketId
    this.userId = userId
    this.username = username
  }
  async connect() {
    const websocket_session = await SocketService.connect(
      this.socketId,
      this.userId
    )
    if (!websocket_session) {
      throw new Error('Error creating websocket session')
    }
    console.info('Websocket session created')
    return websocket_session
  }

  async disconnect() {
    const websocket_session = await SocketService.disconnect(
      this.socketId,
      this.userId
    )
    if (!websocket_session) {
      throw new Error('Error disconnecting websocket session')
    }
    console.info('Websocket session disconnected')
    return websocket_session
  }
}
export default WebSocketController
