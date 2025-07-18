import { DomainEvent } from '../../entity/DomainEvent'
import { Message } from '../../entity/Message'
import DeliveryService from '../../services/Delivery.service'
import EventService from '../../services/Event.service'
import ThreadService from '../../services/Thread.service'
import { EventInfoDTO } from '../../Types/DataTransferObjects/EventsDTO'
import { MessageInfoDTO } from '../../Types/DataTransferObjects/MessageDTO'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import { ServerToClientEvents } from '../../Types/SocketEvents'

import { Emitter } from '@socket.io/redis-emitter'
import { createClient } from 'redis'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'
import {
  EventTypeToEventName,
  TopicToEvent,
} from '../../utils/TopicEventConverter'

const handleInitialMessageCreation = async (
  event: DomainEvent,
  message: Message,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    if (!event || !message) {
      throw new Error('Event or message data is missing')
    }
    if (event.aggregateId !== message.id) {
      throw new Error('Event aggregate ID does not match message ID')
    }
    if (event.aggregateType !== Event_Aggregate_Type.MESSAGE) {
      throw new Error('Event aggregate type is not MESSAGE')
    }
    const participants = await ThreadService.findUsers(message.conversation.id)
    if (!participants) {
      throw new Error('No participants found in the thread')
    }
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
      deliveries.map((d) => DeliveryService.markDelivered(d.id))
    )
    const rooms = deliveries.map((d) => `user-${d.user.id}`)

    emitter.to(rooms).emit('message_created', {
      event: mapEventResponse<Domain_Events.MESSAGE_CREATED>(event),
      thread: mapThreadResponse(message.conversation),
      message: mapMessageResponse(message),
    })
  } catch (error) {
    console.error('Error handling unpublished message event:', error)
  }
}

export default handleInitialMessageCreation
