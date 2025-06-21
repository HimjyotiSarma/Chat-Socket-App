import { Emitter } from '@socket.io/redis-emitter'
import { Message } from '../../entity/Message'
import { User } from '../../entity/User'
import EventService from '../../services/Event.service'
import MessageService from '../../services/Message.service'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import DeliveryService from '../../services/Delivery.service'
import ThreadService from '../../services/Thread.service'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'

const handleMessageDelete = async (
  message: Message,
  creator: User,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    // Emit the message deleted event to the creator
    const event = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      message.id,
      Domain_Events.MESSAGE_DELETED,
      message
    )
    const participants = await ThreadService.findUsers(message.conversation.id)
    if (!participants) throw new Error('No participants found in the thread')
    const deliveries = await DeliveryService.initDelivery(
      event.id,
      message.conversation,
      participants
    )
    if (!deliveries || deliveries.length === 0) {
      throw new Error('No deliveries created for unpublished event')
    }
    await EventService.publishEvent(event.id)

    await Promise.all(
      deliveries.map((delivery) => DeliveryService.markDelivered(delivery.id))
    )

    const rooms = deliveries.map((delivery) => `user-${delivery.user.id}`)

    emitter.to(rooms).emit('message_deleted', {
      event: mapEventResponse<Domain_Events.MESSAGE_DELETED>(event),
      thread: mapThreadResponse(message.conversation),
      message: mapMessageResponse(message),
    })
    // Delete All Reactions related to the message
    await MessageService.deleteAllMessageReactions(message.id)
    // Delete All Attachments related to the message
    await MessageService.deleteAllMessageAttachments(message.id)
    // Delete All Events related to the message
    await EventService.deleteAllMessageEvents(message.id)
    // Delete the message
    await MessageService.deleteMessage(
      message.conversation.id,
      message.id,
      creator
    )
  } catch (error) {
    console.error(error)
  }
}

export default handleMessageDelete
