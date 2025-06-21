import { Emitter } from '@socket.io/redis-emitter'
import { DomainEvent } from '../../entity/DomainEvent'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import { UpdateMessageDTO } from '../../Types/DataTransferObjects/MessageDTO'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import MessageService from '../../services/Message.service'
import EventService from '../../services/Event.service'
import ThreadService from '../../services/Thread.service'
import DeliveryService from '../../services/Delivery.service'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'
import { User } from '../../entity/User'

const handleMessageUpdate = async (
  updatedMessageDetails: UpdateMessageDTO,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    const updatedMessage = await MessageService.updateMessage(
      updatedMessageDetails.thread_id,
      updatedMessageDetails.message_id,
      updatedMessageDetails.content
    )
    if (!updatedMessage) throw new Error('Message not found')

    const event = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      updatedMessageDetails.message_id,
      Domain_Events.MESSAGE_UPDATED,
      updatedMessage
    )
    const participants = await ThreadService.findUsers(
      updatedMessageDetails.thread_id
    )
    if (!participants) throw new Error('No participants found in the thread')
    const deliveries = await DeliveryService.initDelivery(
      event.id,
      updatedMessage.conversation,
      participants
    )
    if (!deliveries || deliveries.length === 0) {
      throw new Error('No deliveries found')
    }
    await EventService.publishEvent(event.id)

    await Promise.all(
      deliveries.map((delivery) => DeliveryService.markDelivered(delivery.id))
    )

    const rooms = deliveries.map((delivery) => `user-${delivery.user.id}`)

    emitter.to(rooms).emit('message_updated', {
      event: mapEventResponse<Domain_Events.MESSAGE_UPDATED>(event),
      thread: mapThreadResponse(updatedMessage.conversation),
      message: mapMessageResponse(updatedMessage),
    })
  } catch (error) {
    console.error('Error handling message updation:', error)
  }
}
export default handleMessageUpdate
