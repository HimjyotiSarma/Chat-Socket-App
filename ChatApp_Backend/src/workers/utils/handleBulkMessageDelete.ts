import { Emitter } from '@socket.io/redis-emitter'
import { Message } from '../../entity/Message'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import EventService from '../../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import ThreadService from '../../services/Thread.service'
import DeliveryService from '../../services/Delivery.service'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'
import MessageService from '../../services/Message.service'
import { User } from '../../entity/User'

const handleBulkMessageDelete = async (
  thread_id: string,
  creator: User,
  messages: Message[],
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    const thread = await ThreadService.find(thread_id)
    // Delete All the Messages
    // (INSTEAD delete this all ins a transaction)
    await Promise.all(
      messages.map(async (message) => {
        // // Delete All the Reactions related to the message
        // await MessageService.deleteAllMessageReactions(message.id)
        // // Delete All the Attachments related to the message
        // await MessageService.deleteAllMessageAttachments(message.id)

        // Delete the Message
        await MessageService.deleteMessage(thread.id, message.id, creator)
      })
    ).catch((error) => {
      emitter.emit('error', `Error Deleting Message: ${error}`)
    })

    // Create a Bulk Delete Event with aggregate Id set to the User Id
    const event = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      messages[0].sender.id,
      Domain_Events.BULK_MESSAGE_DELETED,
      messages
    )
    // Find All the Participants in the Thread
    const participants = await ThreadService.findUsers(thread_id)
    if (!participants) throw new Error('No participants found in the thread')

    // For Each Participant create a new Delivery Event
    const deliveries = await DeliveryService.initDelivery(
      event.id,
      thread,
      participants
    )
    if (!deliveries || deliveries.length === 0) {
      throw new Error('No deliveries created for unpublished event')
    }

    // Publish the Event
    await EventService.publishEvent(event.id)
    // Mark the Delivery status as Delivered
    await Promise.all(
      deliveries.map((delivery) => DeliveryService.markDelivered(delivery.id))
    )
    // Emit the Bulk Message deleted Event to all the Participants
    const rooms = deliveries.map((delivery) => `user-${delivery.user.id}`)
    emitter.to(rooms).emit('bulk_message_deleted', {
      event: mapEventResponse<Domain_Events.BULK_MESSAGE_DELETED>(event),
      thread: mapThreadResponse(thread),
      messages: messages.map((message) => mapMessageResponse(message)),
    })
  } catch (error) {
    console.error(error)
    throw new Error('Error deleting messages in bulk: ' + error)
  }
}

export default handleBulkMessageDelete
