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
import { ThreadOffset } from '../entity/ThreadOffset'
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

  async createDMThread(createdBy: User) {
    try {
      const thread = new Conversation()
      thread.type = Thread_Types.DM
      thread.createdBy = createdBy

      const savedThread = await AppDataSource.getRepository(Conversation).save(
        thread
      )

      const threadParticipant = new ThreadParticipant()
      threadParticipant.thread = savedThread
      threadParticipant.user = createdBy
      threadParticipant.role = Thread_Roles.MEMBER

      await AppDataSource.getRepository(ThreadParticipant).save(
        threadParticipant
      )

      return savedThread
    } catch (error) {
      handleTypeOrmError(error, 'Error creating thread')
    }
  }

  async createGrpThread(
    name: string,
    createdBy: User,
    avatarUrl: string = 'https://banner2.cleanpng.com/20180601/byi/avojk8dpf.webp',
    manager = AppDataSource.manager
  ) {
    try {
      const thread = new Conversation()
      thread.name = name
      thread.avatarUrl = avatarUrl
      thread.type = Thread_Types.GROUP
      thread.createdBy = createdBy

      const savedThread = await manager.save(thread)

      const threadParticipant = new ThreadParticipant()
      threadParticipant.thread = savedThread
      threadParticipant.user = createdBy
      threadParticipant.role = Thread_Roles.ADMIN

      await manager.save(threadParticipant)

      return savedThread
    } catch (error) {
      handleTypeOrmError(error, 'Error creating Group Thread')
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

  async findMessages(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
    offsetDate: Date = new Date('2000-01-01')
  ) {
    try {
      const messages = AppDataSource.createQueryBuilder(Message, 'message')
        .innerJoin('message.thread', 'thread', 'thread.id = :threadId', {
          threadId,
        })
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.reactions', 'reactions')
        .leftJoinAndSelect('reactions.user', 'reactionUser')
        .where('message.createdAt > :offsetDate', { offsetDate })
        .orderBy('message.createdAt', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany()

      return messages
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Messages of Thread')
    }
  }

  // Find Last Offset Date of Thread
  async findLastOffsetDate(
    threadId: string,
    userId: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const thread = await this.find(threadId, manager)
      const threadOffset = await manager.findOne(ThreadOffset, {
        where: { thread: { id: threadId }, user: { id: userId } },
      })
      if (!threadOffset) {
        return new Date('2000-01-01')
      }
      return threadOffset.lastOffsetAt
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Last Offset Date of Thread')
    }
  }

  async addUserToThread(threadId: string, participantId: string) {
    try {
      const thread = await this.find(threadId)
      if (!thread) throw new Error('Thread not found')
      const userToAdd = await UserService.find(participantId)
      if (!userToAdd) throw new Error('User not found')
      const isUserInThread = await this.isUserInThread(threadId, participantId)
      if (isUserInThread) {
        throw new Error('User already in Thread')
      }
      if (thread.type === Thread_Types.DM) {
        const participants = await this.findUsers(thread.id)
        if (participants && participants.length >= 2) {
          throw new Error('DM Thread already has 2 participants')
        }
      }
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

  async findAdmins(
    threadId: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const thread = await manager.findOne(Conversation, {
        where: { id: threadId },
        relations: ['participants', 'participants.user'],
      })
      if (!thread) throw new Error('Thread not found')
      return thread.participants?.filter((tp) => tp.role === Thread_Roles.ADMIN)
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Admins of Thread')
    }
  }

  // Add new Admin to a Group Thread

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

  async bulkRemoveUserFromThread(
    threadId: string,
    userIds: string[],
    manager = AppDataSource.manager
  ) {
    return await manager.transaction(async (transactionalManager) => {
      const thread = await this.find(threadId, transactionalManager)
      const usersToRemove = await Promise.all(
        userIds.map(async (userId) => {
          const user = await UserService.find(userId)
          return user
        })
      )
      const threadParticipantsToRemove = await Promise.all(
        usersToRemove.map(async (user: User) => {
          const threadParticipant = await transactionalManager.findOne(
            ThreadParticipant,
            {
              where: {
                user: user,
                thread: thread,
              },
            }
          )
          return threadParticipant
        })
      )
      if (!threadParticipantsToRemove) {
        throw new Error('Participants not found')
      }
      const filterUndefinedParticipants = threadParticipantsToRemove.filter(
        (tp) => tp !== null
      )
      return transactionalManager.remove(filterUndefinedParticipants)
    })
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
