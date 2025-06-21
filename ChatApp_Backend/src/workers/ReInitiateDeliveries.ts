import amqp from 'amqplib'
import { Emitter } from '@socket.io/redis-emitter'
import { ServerToClientEvents } from '../Types/SocketEvents'
import { createClient } from 'redis'
import { DeliveryStatus } from '../entity/DeliveryStatus'
import { EventTypeToEventName } from '../utils/TopicEventConverter'
import {
  mapAttachmentResponse,
  mapEventResponse,
  mapMessageResponse,
  mapReactionResponse,
  mapThreadResponse,
} from '../utils/ResponseMapper'
import { toEventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import { Message } from '../entity/Message'
import { Domain_Events } from '../Types/Enums'
import { Reaction } from '../entity/Reaction'
import { Attachment } from '../entity/Attachment'
import DeliveryService from '../services/Delivery.service'
async function start() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || 'amqp://localhost'
  )
  const channel = await connection.createChannel()
  const queue = 'reinitiate_deliveries'
  await channel.assertQueue(queue, { durable: true })
  await channel.bindQueue(queue, 'event_hub', 'event.retry.*')

  // Define Redis Emitter
  const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  await redisClient.connect()
  const emitter = new Emitter<ServerToClientEvents>(redisClient)

  channel.consume(queue, async (msg) => {
    try {
      if (!msg) return
      const payload = JSON.parse(msg.content.toString())
      if (msg.fields.routingKey.includes('acknowledged')) {
        channel.nack(msg as amqp.Message, false, false)
        return
      }
      if (msg.fields.routingKey === 'event.retry.message') {
        // Handle conversation creation event
        const {
          deliveries,
          userId,
        }: { deliveries: DeliveryStatus[]; userId: string } = payload
        for (const delivery of deliveries) {
          await DeliveryService.incrementAttempts(
            delivery.domainEvent,
            delivery.user
          )
          if (delivery.user.id === userId) {
            const eventType = delivery.domainEvent.eventType
            const eventName = EventTypeToEventName(
              delivery.domainEvent.eventType
            )
            // const parsedEventInfo = toEventInfoDTO(delivery.domainEvent)
            if (eventName == 'message_created') {
              const parsedMessageEvent =
                toEventInfoDTO<Domain_Events.MESSAGE_CREATED>(
                  delivery.domainEvent
                )
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.MESSAGE_CREATED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                message: mapMessageResponse(
                  delivery.domainEvent.payload as Message
                ),
              })
            } else if (eventName == 'message_updated') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.MESSAGE_UPDATED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                message: mapMessageResponse(
                  delivery.domainEvent.payload as Message
                ),
              })
            } else if (eventName == 'message_deleted') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.MESSAGE_DELETED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                message: mapMessageResponse(
                  delivery.domainEvent.payload as Message
                ),
              })
            } else if (eventName == 'bulk_message_deleted') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.BULK_MESSAGE_DELETED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                messages: (delivery.domainEvent.payload as Message[]).map(
                  (message: Message) => mapMessageResponse(message)
                ),
              })
            } else if (eventName == 'reaction_added') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.REACTION_ADDED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                reaction: mapReactionResponse(
                  delivery.domainEvent.payload as Reaction
                ),
              })
            } else if (eventName == 'reaction_removed') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.REACTION_REMOVED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                reaction: mapReactionResponse(
                  delivery.domainEvent.payload as Reaction
                ),
              })
            } else if (eventName == 'attachment_added') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.ATTACHMENT_ADDED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                attachments: (delivery.domainEvent.payload as Attachment[]).map(
                  (attachment) => mapAttachmentResponse(attachment)
                ),
              })
            } else if (eventName == 'attachment_removed') {
              emitter.emit(eventName, {
                event: mapEventResponse<Domain_Events.ATTACHMENT_REMOVED>(
                  delivery.domainEvent
                ),
                thread: mapThreadResponse(delivery.conversation),
                attachments: (delivery.domainEvent.payload as Attachment[]).map(
                  (attachment) => mapAttachmentResponse(attachment)
                ),
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error re-initiating deliveries:', error)
      channel.nack(msg as amqp.Message, false, false)
    }
  })
}

start().catch((err) =>
  console.error('Error starting re-initiate deliveries:', err)
)
