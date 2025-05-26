import { EntityManager } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import UserService from './User.service'
import { WebsocketSession } from '../entity/WebsocketSession'

class SocketService {
  async find(socketId: string, manager = AppDataSource.manager) {
    try {
      const websocketSession = await manager.findOne(WebsocketSession, {
        where: {
          id: socketId,
        },
      })
      if (!websocketSession) throw new Error('Socket not found')
      return websocketSession
    } catch (error) {
      handleTypeOrmError(error, 'Error finding socket session')
    }
  }
  async connect(
    socketId: string,
    userId: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const user = await UserService.find(userId, manager)
      const connection = new WebsocketSession()
      connection.user = user
      connection.socketId = socketId
      const socketConnection = await manager.save(connection)
      return socketConnection
    } catch (error) {
      handleTypeOrmError(error, 'Error connecting socket')
    }
  }
  async disconnect(
    socketId: string,
    userId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const websocketSession = await this.find(socketId, manager)
      if (websocketSession.user.id != userId) {
        throw new Error('Only Socket creator can disconnect from session')
      }
      if (websocketSession.disconnectedAt) {
        throw new Error('Socket already disconnected')
      }
      websocketSession.disconnectedAt = new Date()
      const disconnectedSocket = await manager.save(websocketSession)
      return disconnectedSocket
    } catch (error) {
      handleTypeOrmError(error, 'Error disconnecting socket')
    }
  }
}

export default new SocketService()
