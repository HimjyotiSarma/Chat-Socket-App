import amqp from 'amqplib'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import {
  CreateMessageDTO,
  MessageInfoDTO,
} from '../Types/DataTransferObjects/MessageDTO'
import { TypedIOServer, TypedSocket } from '../Types/SocketTypes'
import handleInitialMessageCreation from './utils/handleMessageCreation'
import MessageService from '../services/Message.service'
import { User } from '../entity/User'
import EventService from '../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'

async function start() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || 'amqp://localhost'
  )
  const channel = await connection.createChannel()
  const queue = 'message_dispatcher'
  await channel.assertQueue(queue)
  await channel.bindQueue(queue, 'event_bus', 'event.message.*')

  channel.consume(queue, async (msg) => {
    try {
      if (!msg) return
      //Instead of using Event and message, Take the raw payload and Process it directly here
      const payload = JSON.parse(msg.content.toString())
      if (msg.fields.routingKey.includes('acknowledged')) {
        return
      }
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
        await handleInitialMessageCreation(messageEvent, newMessage)
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
