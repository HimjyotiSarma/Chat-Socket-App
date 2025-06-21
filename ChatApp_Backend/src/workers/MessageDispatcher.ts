import amqp from 'amqplib'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import {
  CreateMessageDTO,
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
