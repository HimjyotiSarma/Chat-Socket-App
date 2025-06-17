import { EntityManager, TypeORMError } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { User } from '../entity/User'
import { comparePassword, createPasswordHash } from '../utils/bcrypt'
import { Conversation } from '../entity/Conversations'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import { UpdateUserDTO } from '../Types/DataTransferObjects/UsersDTO'
class UserService {
  async existUser(email: string, manager = AppDataSource.manager) {
    try {
      const user = await manager.findOne(User, {
        where: {
          email: email,
        },
      })
      if (!user) {
        return false
      }
      return true
    } catch (error) {
      handleTypeOrmError(error, 'Error Checking User Availability')
    }
  }
  async findByEmail(
    email: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    // Find One User by Email
    try {
      const user = await manager.findOne(User, {
        where: { email: email },
        relations: ['conversations'],
      })
      return user
    } catch (error) {
      handleTypeOrmError(error, 'Error finding User by Email')
    }
  }
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

  async findThreadOffsets(userId: string) {
    try {
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
        relations: [
          'threadOffsets',
          'threadOffsets.thread',
          'threadOffsets.user',
        ],
      })
      const threadOffsets = user?.threadOffsets
      return threadOffsets
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Thread Offsets')
    }
  }
  async findThreads(userId: string) {
    try {
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
        relations: ['threads', 'threads.thread'],
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
        .getMany()

      return threads
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Threads')
    }
  }

  async updateUserDetails(
    userId: string,
    userDetails: UpdateUserDTO,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const user = await this.find(userId, manager)
      userDetails.avatarUrl && (user.avatarUrl = userDetails.avatarUrl)
      userDetails.displayName && (user.displayName = userDetails.displayName)
      userDetails.email && (user.email = userDetails.email)
      userDetails.username && (user.username = userDetails.username)
      return manager.save(user)
    } catch (error) {
      handleTypeOrmError(error, 'Error Updating User Details')
    }
  }

  async updateUserPassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const user = await this.find(userId, manager)
      const isPasswordValid = comparePassword(oldPassword, user.passwordHash)
      if (!isPasswordValid) {
        throw new Error('Invalid Password')
      }
      const newPasswordHash = await createPasswordHash(newPassword)
      user.passwordHash = newPasswordHash
      const savedUser = await manager.save(user)
      return savedUser
    } catch (error) {
      handleTypeOrmError(error, 'Error Updating User Password')
    }
  }
}

export default new UserService()
