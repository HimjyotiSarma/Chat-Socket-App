import { TypeORMError } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { User } from '../entity/User'
import { createPasswordHash } from '../utils/bcrypt'
import { Conversation } from '../entity/Conversations'
import handleTypeOrmError from '../utils/handleTypeOrmError'
class UserService {
  async find(index: string, manager = AppDataSource.manager) {
    // Find One User
    try {
      const user = await manager.findOne(User, {
        where: { id: index },
        relations: ['conversations'],
      })
      if (!user) throw new Error('User not found')
      return user
    } catch (error) {
      handleTypeOrmError(error, 'Error finding User')
    }
  }
  // Create User
  async create(
    username: string,
    email: string,
    password: string,
    displayName?: string,
    avatarUrl?: string
  ) {
    try {
      if (!displayName) {
        displayName = username
      }
      const passwordHash = await createPasswordHash(password)
      const user = new User()
      user.username = username
      user.email = email
      user.displayName = displayName
      user.passwordHash = passwordHash
      if (avatarUrl) {
        user.avatarUrl = avatarUrl
      }
      const savedUser = await AppDataSource.getRepository(User).save(user)
      return savedUser
    } catch (error) {
      handleTypeOrmError(error, 'Error creating user')
    }
  }

  async findThreads(userId: string, limit: number = 20, offset: number = 0) {
    try {
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
        relations: ['threads', 'threads.thread'],
        order: {
          updatedAt: 'DESC',
        },
      })

      const threads = await AppDataSource.createQueryBuilder(
        Conversation,
        'thread'
      )
        .innerJoin(
          'thread.participants',
          'filterTp',
          'filterTp.user_id = :userId',
          { userId }
        )
        .leftJoinAndSelect('thread.participants', 'tp')
        .leftJoinAndSelect('tp.user', 'participantUser')
        .leftJoinAndSelect('thread.createdBy', 'creator')
        .orderBy('thread.updated_at', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany()

      return threads
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Threads')
    }
  }
}

export default new UserService()
