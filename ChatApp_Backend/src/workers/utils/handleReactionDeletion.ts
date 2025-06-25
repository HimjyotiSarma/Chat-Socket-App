import { Emitter } from '@socket.io/redis-emitter'
import { Message } from '../../entity/Message'
import { Reaction } from '../../entity/Reaction'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import { User } from '../../entity/User'
import EventService from '../../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import ThreadService from '../../services/Thread.service'
import DeliveryService from '../../services/Delivery.service'
import {
  mapEventResponse,
  mapReactionResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'

const handleReactionDeletion = async (
  reaction: Reaction,
  message: Message,
  creator: User,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    const event = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      reaction.id,
      Domain_Events.REACTION_REMOVED,
      reaction
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
    emitter.to(rooms).emit('reaction_removed', {
      event: mapEventResponse<Domain_Events.REACTION_REMOVED>(event),
      thread: mapThreadResponse(message.conversation),
      reaction: mapReactionResponse(reaction),
    })
  } catch (error) {
    console.error(error)
    throw new Error('Error deleting Message Reaction')
  }
}

export default handleReactionDeletion
