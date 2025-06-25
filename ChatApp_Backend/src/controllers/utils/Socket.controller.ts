import { TypedIOServer, TypedSocket } from '../../Types/SocketTypes'

type RoomTypes = 'thread' | 'user'

class SocketController {
  io: TypedIOServer
  socket: TypedSocket
  constructor(io: TypedIOServer, socket: TypedSocket) {
    this.io = io
    this.socket = socket
  }

  async register() {
    throw new Error('register() not initialized')
  }

  room(roomType: RoomTypes, roomName: string) {
    return `${roomType}-${roomName}`
  }
}

export default SocketController
