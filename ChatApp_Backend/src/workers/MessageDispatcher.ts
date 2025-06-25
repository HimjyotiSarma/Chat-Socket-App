import amqp from 'amqplib'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import {
  CreateMessageDTO,
  CreateReactionDTO,
  MessageBulkDTO,
  MessageInfoDTO,
  UpdateMessageDTO,
} from '../Types/DataTransferObjects/MessageDTO'
import { TypedIOServer, TypedSocket } from '../Types/SocketTypes'
import handleInitialMessageCreation from './utils/handleMessageCreation'
import MessageService from '../services/Message.service'
import { User } from '../entity/User'
import EventService from '../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import { createClient } from 'redis'
import { Emitter } from '@socket.io/redis-emitter'
import { ServerToClientEvents } from '../Types/SocketEvents'
import handleMessageUpdate from './utils/handleMessageUpdation'
import handleMessageDelete from './utils/handleMessageDelete'
import handleBulkMessageDelete from './utils/handleBulkMessageDelete'
import ThreadService from '../services/Thread.service'
import handleReactionCreation from './utils/handleReactionCreation'
import handleReactionDeletion from './utils/handleReactionDeletion'
import { CreateAttachmentDTO } from '../Types/DataTransferObjects/AttachmentDTO'
import handleAttachmentCreation from './utils/handleAttachmentCreation'

async function start() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || 'amqp://localhost'
  )
  const channel = await connection.createChannel()
  const queue = 'message_dispatcher'
  await channel.assertQueue(queue)
  await channel.bindQueue(queue, 'event_hub', 'event.message.*')

  channel.consume(queue, async (msg) => {
    try {
      if (!msg) return
      //Instead of using Event and message, Take the raw payload and Process it directly here
      const payload = JSON.parse(msg.content.toString())
      if (msg.fields.routingKey.includes('acknowledged')) {
        return
      }
      // Define the Redis Emitter
      const redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      })
      await redisClient.connect()
      const emitter = new Emitter<ServerToClientEvents>(redisClient)
      if (msg.fields.routingKey == 'event.message.created') {
        const { data, creator }: { data: CreateMessageDTO; creator: User } =
          payload
        const newMessage = await MessageService.createNewMessage(
          data.thread_id,
          creator.id,
          data.content,
          data.reply_to_msg_id
        )
        const messageEvent = await EventService.create(
          Event_Aggregate_Type.MESSAGE,
          newMessage.id,
          Domain_Events.MESSAGE_CREATED,
          newMessage
        )
        await handleInitialMessageCreation(messageEvent, newMessage, emitter)
      } else if (msg.fields.routingKey == 'event.message.updated') {
        const { data, creator }: { data: UpdateMessageDTO; creator: User } =
          payload
        const oldMessage = await MessageService.find(data.message_id)
        if (!oldMessage) {
          emitter.emit('error', 'Message not found')
        }
        if (oldMessage.sender.id != creator.id) {
          emitter.emit('error', 'Only sender can update message')
        }
        await handleMessageUpdate(data, emitter)
      } else if (msg.fields.routingKey == 'event.message.deleted') {
        const {
          data,
          creator,
        }: { data: { thread_id: string; message_id: string }; creator: User } =
          payload
        const message = await MessageService.find(data.message_id)
        if (!message) {
          emitter.emit('error', 'Message not found')
        }
        if (message.sender.id != creator.id) {
          emitter.emit('error', 'Only sender can delete message')
        }
        await handleMessageDelete(message, creator, emitter)
      } else if (msg.fields.routingKey == 'event.message.bulk.deleted') {
        const { data, creator }: { data: MessageBulkDTO; creator: User } =
          payload
        const messages = await Promise.all(
          data.messageIds.map((id) => MessageService.find(id))
        )
        const filteredMessages = []
        for (const message of messages) {
          if (!message) {
            emitter.emit('error', 'Message not found')
            continue
          }
          if (message.sender.id != creator.id) {
            emitter.emit('error', 'Only sender can delete message')
            continue
          }
          if (message.conversation.id != data.thread_id) {
            emitter.emit(
              'error',
              `Message ${message.id} does not belong to the thread`
            )
            continue
          }
          filteredMessages.push(message)
        }
        await handleBulkMessageDelete(
          data.thread_id,
          creator,
          filteredMessages,
          emitter
        )
      } else if (msg.fields.routingKey == 'event.message.reaction.added') {
        const { data, creator }: { data: CreateReactionDTO; creator: User } =
          payload
        const message = await MessageService.find(data.message_id)
        if (!message) {
          emitter.emit('error', 'Message not found')
          return
        }
        if (
          !ThreadService.isUserInThread(message.conversation.id, creator.id)
        ) {
          emitter.emit('error', 'User is not in the thread')
          return
        }
        await handleReactionCreation(message, data.emojiHex, creator, emitter)
      } else if (msg.fields.routingKey == 'event.message.reaction.removed') {
        const {
          data,
          creator,
        }: { data: { messageId: string }; creator: User } = payload
        const message = await MessageService.find(data.messageId)
        if (!message) {
          emitter.emit('error', 'Message not found')
          return
        }
        const reaction = await MessageService.getReactionOfUser(
          message.id,
          creator.id
        )
        if (!reaction) {
          emitter.emit('error', 'Reaction not found')
          return
        }
        await handleReactionDeletion(reaction, message, creator, emitter)
      } else if (msg.fields.routingKey == 'event.message.attachment.added') {
        const { data, creator }: { data: CreateAttachmentDTO; creator: User } =
          payload
        if (!ThreadService.isUserInThread(data.thread_id, creator.id)) {
          emitter.emit('error', 'User is not in the thread')
          return
        }
        await handleAttachmentCreation(data, creator, emitter)
      }
      channel.ack(msg)
    } catch (err: unknown) {
      console.error('Error in message dispatcher:', err)
      channel.nack(msg as amqp.Message, false, false) // Reject the message without requeueing
    }
  })
}

start().catch((err) => {
  console.error('Error starting message dispatcher:', err)
})
