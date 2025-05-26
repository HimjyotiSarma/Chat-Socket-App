// Thread is the anonymous of Conversation
import { Conversation } from '../entity/Conversations'
import { AppDataSource } from '../database/data-source'
import { Thread_Roles, Thread_Types } from '../Types/Enums'
import { User } from '../entity/User'
import UserService from './User.service'
import { EntityManager, TypeORMError } from 'typeorm'
import { Message } from '../entity/Message'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import { ThreadParticipant } from '../entity/ThreadParticipants'
class ThreadService {
  async find(threadId: string, manager = AppDataSource.manager) {
    try {
      const thread = await manager.findOne(Conversation, {
        where: { id: threadId },
        relations: ['createdBy'],
      })
      if (!thread) throw new Error('Thread not found')
      return thread
    } catch (error) {
      handleTypeOrmError(error, 'Error finding thread')
    }
  }

  async create(name: string, type: Thread_Types, createdBy: User) {
    try {
      const thread = new Conversation()
      thread.name = name
      thread.type = type
      thread.createdBy = createdBy

      const savedThread = await AppDataSource.getRepository(Conversation).save(
        thread
      )

      const threadParticipant = new ThreadParticipant()
      threadParticipant.thread = savedThread
      threadParticipant.user = createdBy
      threadParticipant.role = Thread_Roles.ADMIN

      await AppDataSource.getRepository(ThreadParticipant).save(
        threadParticipant
      )

      return savedThread
    } catch (error) {
      handleTypeOrmError(error, 'Error creating thread')
    }
  }

  async findUsers(threadId: string) {
    try {
      const thread = await AppDataSource.getRepository(Conversation).findOne({
        where: { id: threadId },
        relations: ['participants', 'participants.user'],
      })
      if (!thread) throw new Error('Thread not found')
      return thread.participants?.map((tp) => tp.user)
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Users of Thread')
    }
  }

  // Find All Messages

  async findMessages(threadId: string, limit: number = 50, offset: number = 0) {
    try {
      const messages = AppDataSource.createQueryBuilder(Message, 'message')
        .innerJoin('message.thread', 'thread', 'thread.id = :threadId', {
          threadId,
        })
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.reactions', 'reactions')
        .leftJoinAndSelect('reactions.user', 'reactionUser')
        .orderBy('message.createdAt', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany()

      return messages
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Messages of Thread')
    }
  }

  // Add User to thread

  async addUserToThread(threadId: string, userId: string) {
    try {
      const thread = await this.find(threadId)
      if (!thread) throw new Error('Thread not found')
      const userToAdd = await UserService.find(userId)
      if (!userToAdd) throw new Error('User not found')
      const threadParticipant = new ThreadParticipant()
      threadParticipant.thread = thread
      threadParticipant.user = userToAdd
      const savedThreadParticipant = await AppDataSource.getRepository(
        ThreadParticipant
      ).save(threadParticipant)
      return savedThreadParticipant
    } catch (error) {
      handleTypeOrmError(error, 'Error adding User to Thread')
    }
  }

  async bulkAddUserToGrpThread(
    threadId: string,
    userIds: string[],
    manager = AppDataSource.manager
  ) {
    return await manager.transaction(async (transactionalManager) => {
      const thread = await this.find(threadId, transactionalManager)
      const usersToAdd = await Promise.all(
        userIds.map(async (userId) => {
          const user = await UserService.find(userId)
          return user
        })
      )
      const threadParticipantsToAdd = usersToAdd.map((user: User) => {
        const threadParticipant = new ThreadParticipant()
        threadParticipant.thread = thread
        threadParticipant.user = user
        return threadParticipant
      })
      return transactionalManager.save(threadParticipantsToAdd)
    })
  }

  async deleteThreadByCreator(threadId: string, userId: string) {
    try {
      const thread = await this.find(threadId)
      if (!thread) throw new Error('Thread not found')
      const user = await UserService.find(userId)
      if (!user) throw new Error('User not found')
      if (thread.createdBy.id != user.id) {
        throw new Error('Only Admin is allowed to delete Conversation')
      }
      const deletedThread = await AppDataSource.getRepository(
        Conversation
      ).remove(thread)
      return deletedThread
    } catch (error) {
      handleTypeOrmError(error, 'Error removing User from Thread')
    }
  }

  async removeUserFromThread(threadId: string, userId: string) {
    try {
      const thread = await this.find(threadId)
      if (!thread) throw new Error('Thread not found')
      const userToRemove = await UserService.find(userId)
      if (!userToRemove) throw new Error('User not found')
      const threadParticipant = await AppDataSource.getRepository(
        ThreadParticipant
      ).findOne({
        where: {
          thread: { id: threadId },
          user: { id: userId },
        },
      })
      if (!threadParticipant) throw new Error('User not in Thread')
      return await AppDataSource.getRepository(ThreadParticipant).remove(
        threadParticipant
      )
    } catch (error) {
      handleTypeOrmError(error, 'Error removing User from Thread')
    }
  }

  async updateThreadMetadata(
    threadId: string,
    rename?: string,
    avatarUrl?: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const thread = await this.find(threadId, manager)
      rename && (thread.name = rename)
      avatarUrl && (thread.avatarUrl = avatarUrl)
      return await manager.save(thread)
    } catch (error) {
      handleTypeOrmError(error, 'Error Updating Conversation Metadata')
    }
  }

  async isUserInThread(threadId: string, userId: string) {
    try {
      const thread = await this.find(threadId)
      if (!thread) throw new Error('Thread not found')
      const user = await UserService.find(userId)
      if (!user) throw new Error('User not found')
      const participant = await AppDataSource.getRepository(
        ThreadParticipant
      ).findOne({
        where: {
          thread: { id: threadId },
          user: { id: userId },
        },
      })
      return !!participant
    } catch (error) {
      handleTypeOrmError(error, 'Error checking if User is in Thread')
    }
  }
}

export default new ThreadService()
