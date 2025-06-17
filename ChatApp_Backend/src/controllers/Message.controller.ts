import { DomainEvent } from '../entity/DomainEvent'
import publishEvent from '../publisher/publisher'
import DeliveryService from '../services/Delivery.service'
import EventService from '../services/Event.service'
import MessageService from '../services/Message.service'
import ThreadService from '../services/Thread.service'
import UserService from '../services/User.service'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
import { MessageInfoDTO } from '../Types/DataTransferObjects/MessageDTO'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import { mapEventResponse, mapMessageResponse } from '../utils/ResponseMapper'
import {
  EventToTopic,
  EventTypeToEventName,
} from '../utils/TopicEventConverter'
import SocketController from './utils/Socket.controller'

class MessageController extends SocketController {
  async register() {
    const { io, socket } = this
    const { userId, username } = socket.data
    if (!userId || !username) {
      return socket.emit('error', 'Invalid token')
    }
    // TODO :-> Make sure that the User is coming as Object and Not the UserID
    const user = await UserService.find(userId)
    socket.join(this.room('user', socket.data.userId))

    socket.on('create_message', async (data) => {
      if (!socket.data.userId || !socket.data.username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.MESSAGE_CREATED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(JSON.stringify({ data: data, creator: user }))
      )
    })

    socket.on('message_acknowledged', async (data) => {
      if (!socket.data.userId || !socket.data.username) {
        return socket.emit('error', 'Invalid token')
      }
      if (socket.data.userId !== data.message.sender.id) {
        return socket.emit('error', 'Invalid token')
      }
      if (data.event.aggregateType !== Event_Aggregate_Type.MESSAGE) {
        return socket.emit('error', 'Invalid event type')
      }
      const eventTopic = EventToTopic(Domain_Events.MESSAGE_ACKNOWLEDGED)
      await publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({ event: data.event, userId: socket.data.userId })
        )
      )
    })
  }
  async retryPendingDeliveriesForUser(
    userId: string,
    threadLimit: number = 100
  ) {
    try {
      const { io, socket } = this
      // Check in Thread Participants where the user is part of
      const userThreadOffsets = await UserService.findThreadOffsets(userId)
      if (!userThreadOffsets) {
        console.log('No threads found for user')
        return
      }
      for (const threadOffset of userThreadOffsets) {
        const offsetAtDate = threadOffset.lastOffsetAt
        // Fetch All messages for a thread
        const messages = await ThreadService.findMessages(
          threadOffset.threadId,
          threadLimit,
          0,
          offsetAtDate
        )
        if (!messages.length) {
          console.log('No messages found for thread')
          return
        }
        // Get Event for each Message
        let messageEvents: { event: EventInfoDTO; message: MessageInfoDTO }[] =
          []
        for (let message of messages) {
          const event = await EventService.getEventOfMessage(
            message.id,
            Domain_Events.MESSAGE_CREATED
          )
          if (!event) {
            console.log('No event found for message with id : ', message.id)
            continue
          }
          messageEvents.push({
            event: mapEventResponse(event),
            message: mapMessageResponse(message),
          })
        }
        // Thread Room
        const personalThreadRoom = `user-${userId}:thread-${threadOffset.threadId}`
        // Join personal thread room from Thread Controller
        // Emit the messages to the user
        io.timeout(5000)
          .to(personalThreadRoom)
          .emit('bulk_message_created', messageEvents)
      }
    } catch (error) {
      console.log('Error in retryPendingDeliveriesForUser : ', error)
    }
  }

  // async handleInitialMessageDelivery(
  //   event: EventInfoDTO,
  //   message: MessageInfoDTO
  // ) {
  //   try {
  //     if (event.aggregateId !== message.id) {
  //       throw new Error('Event aggregate ID does not match message ID')
  //     }
  //     if (event.aggregateType !== Event_Aggregate_Type.MESSAGE) {
  //       throw new Error('Event aggregate type is not MESSAGE')
  //     }
  //     const participants = await ThreadService.findUsers(message.thread.id)
  //     if (!participants) {
  //       throw new Error('No participants found in the thread')
  //     }
  //     const deliveries = await DeliveryService.initDelivery(
  //       event.id,
  //       participants
  //     )
  //     if (!deliveries || deliveries.length === 0) {
  //       throw new Error('No deliveries created for unpublished event')
  //     }
  //     await EventService.publishEvent(event.id)
  //     const eventName =
  //       event.eventType == Domain_Events.MESSAGE_CREATED
  //         ? 'message_created'
  //         : event.eventType == Domain_Events.MESSAGE_UPDATED
  //         ? 'message_updated'
  //         : 'message_deleted'

  //     Promise.all(deliveries.map((d) => DeliveryService.markDelivered(d.id)))
  //     const rooms = deliveries.map((delivery) =>
  //       this.room('user', delivery.user.id)
  //     )
  //     this.io.to(rooms).emit(
  //       eventName,
  //       {
  //         event: event,
  //         message: message,
  //       },
  //       async (err, responses: { event_id: bigint; user_id: string }[]) => {
  //         if (err) {
  //           console.warn('Some users failed to acknowledge : ', err)
  //         }
  //         for (const response of responses) {
  //           const event = await EventService.find(response.event_id)
  //           await DeliveryService.acknowledge(event, response.user_id)
  //         }
  //       }
  //     )
  //   } catch (error) {
  //     console.error('Error handling unpublished message event:', error)
  //   }
  // }
}

export default MessageController
