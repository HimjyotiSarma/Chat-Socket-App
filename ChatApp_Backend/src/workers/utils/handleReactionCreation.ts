import { Emitter } from '@socket.io/redis-emitter'
import { Message } from '../../entity/Message'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import MessageService from '../../services/Message.service'
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

const handleReactionCreation = async (
  message: Message,
  emojiHex: string,
  creator: User,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    const reaction = await MessageService.createMessageReaction(
      message.id,
      creator.id,
      emojiHex
    )
    const reactionEvent = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      reaction.id,
      Domain_Events.REACTION_ADDED,
      reaction
    )
    const participants = await ThreadService.findUsers(message.conversation.id)
    if (!participants) throw new Error('No participants found in the thread')

    const deliveries = await DeliveryService.initDelivery(
      reactionEvent.id,
      message.conversation,
      participants
    )
    if (!deliveries || deliveries.length === 0) {
      throw new Error('No deliveries created for unpublished event')
    }

    await EventService.publishEvent(reactionEvent.id)

    await Promise.all(
      deliveries.map((delivery) => DeliveryService.markDelivered(delivery.id))
    )

    const rooms = deliveries.map((delivery) => `user-${delivery.user.id}`)
    emitter.to(rooms).emit('reaction_added', {
      event: mapEventResponse<Domain_Events.REACTION_ADDED>(reactionEvent),
      thread: mapThreadResponse(message.conversation),
      reaction: mapReactionResponse(reaction),
    })
  } catch (error) {}
}

export default handleReactionCreation
