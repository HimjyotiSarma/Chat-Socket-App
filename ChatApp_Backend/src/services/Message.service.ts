import { error } from 'console'
import { AppDataSource } from '../database/data-source'
import { Conversation } from '../entity/Conversations'
import { Message } from '../entity/Message'
import { ThreadOffset } from '../entity/ThreadOffset'
import handleTypeOrmError from '../utils/handleTypeOrmError'
import ThreadService from './Thread.service'
import UserService from './User.service'
import { EntityManager } from 'typeorm'
import { User } from '../entity/User'
import { Reaction } from '../entity/Reaction'
import { AttachmentTypes } from '../Types/Enums'
import { Attachment } from '../entity/Attachment'
import {
  AttachmentInput,
  CreateAttachmentDTO,
} from '../Types/DataTransferObjects/AttachmentDTO'
import { get } from 'http'

class MessageService {
  async find(messageId: string, manager = AppDataSource.manager) {
    try {
      const message = await manager.findOne(Message, {
        where: { id: messageId },
        relations: [
          'conversation',
          'sender',
          'attachments',
          'reactions',
          'reactions.user',
        ],
      })
      if (!message) throw new Error('Message not found')
      return message
    } catch (error) {
      handleTypeOrmError(error, 'Error finding message')
    }
  }

  async findByThread(
    threadId: string,
    limit: number = 50,
    offset: number = 0,
    manager: EntityManager = AppDataSource.manager
  ) {
    try {
      const thread = await ThreadService.find(threadId, manager)
      const messages = await manager
        .createQueryBuilder(Message, 'message')
        .leftJoinAndSelect('message.conversation', 'conversation')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.reactions', 'reactions')
        .leftJoinAndSelect('reactions.user', 'user')
        .where('conversation.id = :threadId', { threadId })
        .orderBy('message.createdAt', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany()
      return messages
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Messages of Thread')
    }
  }
  async findMessages(
    keyword: string,
    userId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const user = await UserService.find(userId)
      if (!user) throw new Error('User not found')

      const messages = await manager
        .createQueryBuilder(Message, 'message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.reactions', 'reactions')
        .where('sender.id = :userId', { userId })
        .andWhere(`message.content->>'value' ILIKE :keyword`, {
          keyword: `%${keyword}%`,
        })
        .getMany()

      return messages
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Messages of User')
    }
  }
  async createNewMessage(
    threadId: string,
    senderId: string,
    content: Record<string, any>,
    reply_to_message_id: string | undefined = undefined,
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const thread = await ThreadService.find(threadId, transactionalManager)
        const sender = await UserService.find(senderId, transactionalManager)
        const replyToMessage = reply_to_message_id
          ? await this.find(reply_to_message_id, transactionalManager)
          : null

        // Create New Message
        const message = new Message()
        message.conversation = thread
        message.sender = sender
        message.content = content
        if (replyToMessage) {
          message.repliedToMessage = replyToMessage
        }
        const savedMessage = await transactionalManager.save(message)

        //   Update the senders Thread Offset
        await this.updateThreadOffset(
          threadId,
          senderId,
          savedMessage,
          transactionalManager
        )
        thread.updatedAt = new Date()
        await transactionalManager.save(thread)
        return savedMessage
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error creating Message')
      })
  }

  async updateThreadOffset(
    threadId: string,
    userId: string,
    lastReadMsg: Message,
    manager = AppDataSource.manager
  ) {
    try {
      const thread = await ThreadService.find(threadId, manager)
      const user = await UserService.find(userId, manager)

      let threadOffset = await manager.findOne(ThreadOffset, {
        where: {
          thread: { id: threadId },
          user: { id: userId },
        },
      })
      if (!threadOffset) {
        threadOffset = new ThreadOffset()
        threadOffset.thread = thread
        threadOffset.user = user
      }
      threadOffset.lastReadMsg = lastReadMsg
      threadOffset.lastOffsetAt = new Date()
      const savedThreadOffset = await manager.save(threadOffset)
      return savedThreadOffset
    } catch (error) {
      handleTypeOrmError(error, 'Error updating Thread Offset')
    }
  }

  async updateMessage(
    threadId: string,
    messageId: string,
    content: Record<string, any>,
    manager: EntityManager = AppDataSource.manager
  ) {
    // Do it in Transaction and update the thread updatedAt
    return await manager
      .transaction(async (transactionalManager) => {
        const message = await this.find(messageId, transactionalManager)
        const thread = await ThreadService.find(
          message.conversation.id,
          transactionalManager
        )
        message.content = { ...message.content, ...content }
        await this.updateThreadOffset(
          threadId,
          message.sender.id,
          message,
          transactionalManager
        )
        const updatedMessage = await transactionalManager.save(message)
        thread.updatedAt = new Date()
        await transactionalManager.save(thread)
        return updatedMessage
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error updating Message')
      })
  }

  async deleteMessage(
    threadId: string,
    messageId: string,
    user: User,
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const message = await this.find(messageId, transactionalManager)
        const thread = await ThreadService.find(threadId, transactionalManager)
        if (message.sender.id != user.id)
          throw new Error('Only sender can delete message')
        const deletedMessage = await transactionalManager.remove(message)
        thread.updatedAt = new Date()
        await transactionalManager.save(thread)
        return deletedMessage
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error deleting Message')
      })
  }

  async checkReactionAvailability(
    messageId: string,
    userId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const reactions = await manager.find(Reaction, {
        where: {
          message: {
            id: messageId,
          },
          user: {
            id: userId,
          },
        },
      })
      if (reactions) {
        return true
      }
      return false
    } catch (error) {
      handleTypeOrmError(error, 'Error checking if Reaction is available')
    }
  }

  async getMessageReactions(
    messageId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const reactions = await manager.find(Reaction, {
        where: {
          message: {
            id: messageId,
          },
        },
        order: {
          reactedAt: 'DESC',
        },
      })
      return reactions
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Message Reactions')
    }
  }

  async createMessageReaction(
    messageId: string,
    userId: string,
    emojiHex: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const isReactionAvailable = await this.checkReactionAvailability(
          messageId,
          userId,
          transactionalManager
        )
        if (isReactionAvailable) {
          throw new Error('Reaction already exists')
        }
        const message = await this.find(messageId, transactionalManager)
        const user = await UserService.find(userId, transactionalManager)
        const reaction = new Reaction()
        reaction.user = user
        reaction.message = message
        reaction.emojiHex = emojiHex
        const savedMessage = await transactionalManager.save(reaction)
        return savedMessage
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error creating Message Reaction')
      })
  }

  async deleteMessageReaction(
    messageId: string,
    userId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const reaction = await manager.findOne(Reaction, {
        where: {
          message: {
            id: messageId,
          },
          user: {
            id: userId,
          },
        },
      })
      if (!reaction) throw new Error('Reaction not found')
      return await manager.remove(reaction)
    } catch (error) {
      handleTypeOrmError(error, 'Error deleting Message Reaction')
    }
  }

  async deleteAllMessageReactions(
    messageId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const reactions = await manager.find(Reaction, {
        where: {
          message: {
            id: messageId,
          },
        },
      })
      return await manager.remove(reactions)
    } catch (error) {
      handleTypeOrmError(error, 'Error deleting Message Reactions')
    }
  }

  async deleteAllMessageAttachments(
    messageId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const attachments = await manager.find(Attachment, {
        where: {
          message: {
            id: messageId,
          },
        },
      })
      return await manager.remove(attachments)
    } catch (error) {
      handleTypeOrmError(error, 'Error deleting Message Attachments')
    }
  }

  async markThreadRead(
    threadId: string,
    userId: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const lastThreadMessage = await transactionalManager
          .createQueryBuilder(Message, 'message')
          .where('message.conversation.id = :threadId', { threadId })
          .orderBy('message.createdAt', 'DESC')
          .limit(1)
          .getOne()
        if (!lastThreadMessage)
          throw new Error('Thread is Empty or Error while parsing')
        const threadOffset = await this.updateThreadOffset(
          threadId,
          userId,
          lastThreadMessage,
          transactionalManager
        )
        return threadOffset
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error marking Thread as Read')
      })
  }

  async getUnreadCount(
    threadId: string,
    userId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const threadOffset = await manager.findOne(ThreadOffset, {
        where: {
          thread: {
            id: threadId,
          },
          user: {
            id: userId,
          },
        },
        relations: ['lastReadMsg'],
      })
      const lastMsgReadAt = threadOffset?.lastReadMsg?.createdAt || new Date(0)

      const unreadMsgCount = await manager
        .createQueryBuilder(Message, 'message')
        .innerJoin('message.conversation', 'conversation')
        .where('conversation.id = :threadId', { threadId })
        .andWhere('message.createdAt > :lastMsgReadAt', { lastMsgReadAt })
        .getCount()
      return unreadMsgCount
    } catch (error) {
      handleTypeOrmError(error, 'Error getting unread count of Thread')
    }
  }

  async bulkMessageDelete(
    threadId: string,
    userId: string,
    messageIds: string[],
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const thread = await ThreadService.find(threadId, transactionalManager)
        const user = await UserService.find(userId, transactionalManager)
        const messages = await Promise.all(
          messageIds.map(async (messageId: string) => {
            const message = await this.find(messageId, transactionalManager)
            if (message.sender.id != userId) {
              throw new Error('Only sender can delete message')
            }
            return message
          })
        )

        const deletedMessages = await transactionalManager.remove(messages)
        thread.updatedAt = new Date()
        await transactionalManager.save(thread)
        return deletedMessages
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error deleting Messages')
      })
  }

  async getReactions(messageId: string, manager = AppDataSource.manager) {
    try {
      const reactionsCount = await manager
        .createQueryBuilder(Reaction, 'reaction')
        .select('reaction.emojiHex', 'emojiHex')
        .addSelect('COUNT(reaction.id)', 'count')
        .where('reaction.message.id = :messageId', { messageId })
        .groupBy('reaction.emojiHex')
        .getRawMany<{ emojiHex: string; count: string }>()

      return reactionsCount.map(({ emojiHex, count }) => {
        return {
          emojiHex,
          count: parseInt(count),
        }
      })
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Message Reactions')
    }
  }

  async getReactionsOfMessages(
    messageIds: string[],
    manager = AppDataSource.manager
  ) {
    try {
      const reactions = await Promise.all(
        messageIds.map(async (messageId: string) => {
          const messageReactions = await this.getReactions(messageId, manager)
          return {
            messageId,
            reactions: messageReactions,
          }
        })
      )
      return reactions
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Message Reactions')
    }
  }

  async addAttachments(
    thread_id: string,
    user_id: string,
    messageContent: Record<string, any>,
    attachmentsInput: AttachmentInput[],
    manager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const thread = await ThreadService.find(thread_id, transactionalManager)
        const user = await UserService.find(user_id, transactionalManager)
        const newMessage = await this.createNewMessage(
          thread.id,
          user.id,
          messageContent,
          undefined,
          transactionalManager
        )
        const attachmentsToAdd = attachmentsInput.map((attachmentDetails) => {
          const { url, thumbnail_url, fileType } = attachmentDetails
          const attachment = new Attachment()
          attachment.fileType = fileType
          attachment.message = newMessage
          attachment.user = user
          attachment.url = url
          attachment.thumbnail_url = thumbnail_url
          return attachment
        })
        const savedAttachments = await transactionalManager.save(
          attachmentsToAdd
        )
        return { message: newMessage, attachments: savedAttachments }
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error Adding New Attachments')
      })
  }

  async getMessageAttachments(
    messageId: string,
    manager = AppDataSource.manager
  ) {
    try {
      const attachments = await manager.find(Attachment, {
        where: {
          message: {
            id: messageId,
          },
        },
        relations: ['user', 'message'],
        order: {
          createdAt: 'DESC',
        },
      })
      return attachments
    } catch (error) {
      handleTypeOrmError(error, 'Error finding Attachments')
    }
  }

  async deleteAttachments(
    messageId: string,
    userId: string,
    manager: EntityManager = AppDataSource.manager
  ) {
    return await manager
      .transaction(async (transactionalManager) => {
        const attachments = await transactionalManager.find(Attachment, {
          where: {
            message: {
              id: messageId,
            },
            user: {
              id: userId,
            },
          },
          relations: ['user', 'message'],
        })
        if (!attachments.length) {
          throw new Error(
            'No attachments found for the messageNo attachments found for the given message and user.'
          )
        }
        const unauthorized = attachments.find((att) => att.user.id != userId)
        if (unauthorized) {
          throw new Error('Only the creator can delete their attachments')
        }

        return await transactionalManager.remove(attachments)
      })
      .catch((error) => {
        handleTypeOrmError(error, 'Error deleting Attachment')
      })
  }
  // Get Latest Message
  async findLatestMessage(threadId: string, manager = AppDataSource.manager) {
    try {
      const message = await manager
        .createQueryBuilder(Message, 'message')
        .leftJoinAndSelect('message.conversation', 'conversation')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.attachments', 'attachments')
        .leftJoinAndSelect('message.reactions', 'reactions')
        .where('conversation.id = :threadId', { threadId })
        .orderBy('message.createdAt', 'DESC')
        .limit(1)
        .getOne()
      if (!message) throw new Error('Message not found')
      if (message?.reactions?.length) {
        const reactions = await this.getMessageReactions(message.id, manager)
        return reactions[0]
      }
      if (message?.attachments?.length) {
        const attachments = await this.getMessageAttachments(
          message.id,
          manager
        )
        return attachments[0]
      }
      return message
    } catch (error) {
      handleTypeOrmError(error, 'Error finding latest message')
    }
  }
  // Pin Message if Required
}

export default new MessageService()
