import { Emitter } from '@socket.io/redis-emitter'
import { User } from '../../entity/User'
import { CreateAttachmentDTO } from '../../Types/DataTransferObjects/AttachmentDTO'
import { ServerToClientEvents } from '../../Types/SocketEvents'
import MessageService from '../../services/Message.service'
import EventService from '../../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../../Types/Enums'
import ThreadService from '../../services/Thread.service'
import DeliveryService from '../../services/Delivery.service'
import {
  mapAttachmentResponse,
  mapEventResponse,
  mapMessageResponse,
  mapThreadResponse,
} from '../../utils/ResponseMapper'

const handleAttachmentCreation = async (
  data: CreateAttachmentDTO,
  creator: User,
  emitter: Emitter<ServerToClientEvents>
) => {
  try {
    const thread = await ThreadService.find(data.thread_id)
    if (!thread) {
      emitter.emit('error', 'Thread not found')
      return
    }
    const participants = await ThreadService.findUsers(thread.id)
    if (!participants) {
      emitter.emit('error', 'Participants not found')
      return
    }

    const attachmentDetails = await MessageService.addAttachments(
      thread.id,
      creator.id,
      data.messageContent,
      data.attachments,
      data.replyToMessageId
    )

    const attachmentEvent = await EventService.create(
      Event_Aggregate_Type.MESSAGE,
      attachmentDetails.message.id,
      Domain_Events.ATTACHMENT_ADDED,
      attachmentDetails
    )
    if (!attachmentEvent) {
      emitter.emit('error', 'Error in attachment Event creation')
      return
    }
    await EventService.publishEvent(attachmentEvent.id)
    const deliveries = await DeliveryService.initDelivery(
      attachmentEvent.id,
      thread,
      participants
    )
    if (!deliveries) {
      emitter.emit('error', 'Error in delivery creation')
      return
    }
    await Promise.all(
      deliveries.map((delivery) => DeliveryService.markDelivered(delivery.id))
    )
    const rooms = deliveries.map((delivery) => `user-${delivery.user.id}`)
    emitter.to(rooms).emit('attachment_added', {
      event: mapEventResponse<Domain_Events.ATTACHMENT_ADDED>(attachmentEvent),
      thread: mapThreadResponse(thread),
      message: mapMessageResponse(attachmentDetails.message),
      attachments: attachmentDetails.attachments.map((attachment) =>
        mapAttachmentResponse(attachment)
      ),
    })
  } catch (error) {
    console.error('Error in attachment creation:', error)
    if (error instanceof Error) {
      emitter.emit('error', `Error in attachment creation : ${error.message}`)
      return
    }
    emitter.emit('error', 'Error in attachment creation')
  }
}

export default handleAttachmentCreation
