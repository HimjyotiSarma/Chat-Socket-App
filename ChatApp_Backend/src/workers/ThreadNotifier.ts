import amqp from 'amqplib'
import ThreadService from '../services/Thread.service'
import UserService from '../services/User.service'
import { createClient } from 'redis'
import { ServerToClientEvents } from '../Types/SocketEvents'
import { Emitter } from '@socket.io/redis-emitter'
import { User } from '../entity/User'
import {
  mapEventResponse,
  mapThreadParticipantDetail,
  mapThreadParticipants,
  mapThreadResponse,
} from '../utils/ResponseMapper'
import {
  CreateGrpThreadDTO,
  ThreadInfoDTO,
  UpdateThreadMetadataDTO,
} from '../Types/DataTransferObjects/ThreadsDTO'
import EventService from '../services/Event.service'
import { Domain_Events, Event_Aggregate_Type } from '../Types/Enums'
import DeliveryService from '../services/Delivery.service'
import MessageService from '../services/Message.service'
import { EventInfoDTO } from '../Types/DataTransferObjects/EventsDTO'
async function start() {
  const connection = await amqp.connect(
    process.env.RABBITMQ_URL || 'amqp://localhost'
  )
  const channel = await connection.createChannel()
  const queue = 'thread_notifier'
  await channel.assertQueue(queue, { durable: true })
  await channel.bindQueue(queue, 'event_hub', 'event.conversation.*')

  // Define Emitter
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
        channel.nack(msg, false, false)
        return
      }
      if (msg.fields.routingKey === 'event.conversation.created.dm') {
        // Handle conversation creation event
        const { creator }: { creator: User } = payload
        const newThread = await ThreadService.createDMThread(creator)
        if (!newThread) {
          emitter.emit('error', 'Failed to create conversation')
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          newThread.id,
          Domain_Events.DM_CONVERSATION_CREATED,
          newThread
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create conversation event')
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          newThread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit('error', 'Failed to create conversation event delivery')
          return
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )

        // Send a notification to the user

        emitter.to(`user-${creator.id}`).emit('conversation_dm_created', {
          event:
            mapEventResponse<Domain_Events.DM_CONVERSATION_CREATED>(
              threadEvent
            ),
          conversation: mapThreadResponse(newThread),
        })
        // Join Thread
        emitter.to(`user-${creator.id}`).emit('join_thread', {
          conversation: mapThreadResponse(newThread),
        })
        channel.ack(msg)
      } else if (msg.fields.routingKey === 'event.conversation.created.grp') {
        // Handle message sent event
        const { creator, data }: { creator: User; data: CreateGrpThreadDTO } =
          payload
        const newThread = await ThreadService.createGrpThread(
          data.name,
          creator,
          data.avatarUrl && data.avatarUrl.length > 0
            ? data.avatarUrl
            : 'https://banner2.cleanpng.com/20180601/byi/avojk8dpf.webp'
        )
        if (!newThread) {
          emitter.emit('error', 'Failed to create group conversation')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          newThread.id,
          Domain_Events.GROUP_CONVERSATION_CREATED,
          newThread
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create group conversation event')
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          newThread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create group conversation event delivery'
          )
          return
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        // Send a notification to the user
        emitter.to(`user-${creator.id}`).emit('conversation_group_created', {
          event:
            mapEventResponse<Domain_Events.GROUP_CONVERSATION_CREATED>(
              threadEvent
            ),
          conversation: mapThreadResponse(newThread),
        })
        // Join Thread
        emitter.to(`user-${creator.id}`).emit('join_thread', {
          conversation: mapThreadResponse(newThread),
        })
      } else if (
        msg.fields.routingKey == 'event.conversation.participant.added'
      ) {
        const {
          threadId,
          participantId,
          creator,
        }: { threadId: string; participantId: string; creator: User } = payload
        const thread = await ThreadService.find(threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const adminList = await ThreadService.findAdmins(threadId)
        if (!adminList) {
          emitter.emit(
            'error',
            'No admins found in the thread to add participant'
          )
          return
        }
        if (!adminList.some((admin) => admin.user.id === creator.id)) {
          emitter.emit('error', 'Only Admin is allowed to add participant')
          return
        }

        const threadParticipant = await ThreadService.addUserToThread(
          threadId,
          participantId
        )
        if (!threadParticipant) {
          emitter.emit('error', 'Failed to add participant')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          threadId,
          Domain_Events.PARTICIPANT_ADDED,
          threadParticipant
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create participant added event')
          return
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [threadParticipant.user]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create participant added event delivery'
          )
          return
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        emitter
          .to(`user-${creator.id}`)
          .emit('added_participant_to_conversation_notification', {
            event:
              mapEventResponse<Domain_Events.PARTICIPANT_ADDED>(threadEvent),
            participant: mapThreadParticipants(threadParticipant),
          })
        emitter.to(`thread-${threadId}`).emit('participant_added', {
          participant: mapThreadParticipants(threadParticipant),
        })
        // Send Join Thread Notification to the new User
        emitter.to(`user-${participantId}`).emit('join_thread', {
          conversation: mapThreadResponse(thread),
        })
      } else if (
        msg.fields.routingKey == 'event.conversation.participant.multiple.added'
      ) {
        const {
          threadId,
          userIds,
          creator,
        }: { threadId: string; userIds: string[]; creator: User } = payload
        const thread = await ThreadService.find(threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const adminList = await ThreadService.findAdmins(threadId)
        if (!adminList) {
          emitter.emit(
            'error',
            'No admins found in the thread to add participant'
          )
          return
        }
        if (!adminList.some((admin) => admin.user.id === creator.id)) {
          emitter.emit('error', 'Only Admin is allowed to add participant')
          return
        }
        const threadParticipants = await ThreadService.bulkAddUserToGrpThread(
          threadId,
          userIds
        )
        if (!threadParticipants) {
          emitter.emit('error', 'Failed to add participants')
          return
        }

        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          threadId,
          Domain_Events.MULTIPLE_PARTICIPANT_ADDED,
          threadParticipants
        )
        if (!threadEvent) {
          emitter.emit(
            'error',
            'Failed to create multiple participant added event'
          )
          return
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create multiple participant added event delivery'
          )
          return
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        emitter
          .to(`user-${creator.id}`)
          .emit('multiple_participant_added_notification', {
            event:
              mapEventResponse<Domain_Events.MULTIPLE_PARTICIPANT_ADDED>(
                threadEvent
              ),
            participants: threadParticipants.map((tp) =>
              mapThreadParticipants(tp)
            ),
          })
        emitter.to(`thread-${threadId}`).emit('multiple_participant_added', {
          participants: threadParticipants.map((tp) =>
            mapThreadParticipants(tp)
          ),
        })
        // Send Join Thread Notification to the new Users
        threadParticipants.forEach((tp) => {
          emitter.to(`user-${tp.user.id}`).emit('join_thread', {
            conversation: mapThreadResponse(thread),
          })
        })
      } else if (
        msg.fields.routingKey == 'event.conversation.participant.removed'
      ) {
        const {
          threadId,
          participantIds,
          creator,
        }: { threadId: string; participantIds: string[]; creator: User } =
          payload
        const thread = await ThreadService.find(threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const adminList = await ThreadService.findAdmins(threadId)
        if (!adminList) {
          emitter.emit(
            'error',
            'No admins found in the thread to remove participant'
          )
          return
        }
        if (!adminList.some((admin) => admin.user.id === creator.id)) {
          emitter.emit('error', 'Only Admin is allowed to remove participant')
          return
        }
        const threadParticipants = await ThreadService.bulkRemoveUserFromThread(
          threadId,
          participantIds
        )
        if (!threadParticipants) {
          emitter.emit('error', 'Failed to remove participants')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          threadId,
          Domain_Events.PARTICIPANT_REMOVED,
          threadParticipants
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create participant removed event')
          return
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create participant removed event delivery'
          )
          return
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        emitter
          .to(`user-${creator.id}`)
          .emit('removed_participant_from_conversation_notification', {
            event:
              mapEventResponse<Domain_Events.PARTICIPANT_REMOVED>(threadEvent),
            participants: threadParticipants.map((tp) =>
              mapThreadParticipants(tp)
            ),
          })
        emitter.to(`thread-${threadId}`).emit('participant_removed', {
          participants: threadParticipants.map((tp) =>
            mapThreadParticipants(tp)
          ),
        })
        // Leave The Removed Users from the thread
        threadParticipants.forEach((tp) => {
          emitter.to(`user-${tp.user.id}`).emit('leave_thread', {
            conversation: mapThreadResponse(thread),
          })
        })
      } else if (msg.fields.routingKey == 'event.conversation.thread.read') {
        const { threadId, creator }: { threadId: string; creator: User } =
          payload

        const thread = await ThreadService.find(threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          threadId,
          Domain_Events.MARK_THREAD_READ,
          thread
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create mark thread read event')
        }

        const threadRead = await MessageService.markThreadRead(
          threadId,
          creator.id
        )
        if (!threadRead) {
          emitter.emit('error', 'Failed to mark thread as read')
          return
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create mark thread read event delivery'
          )
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        emitter
          .to(`user-${creator.id}`)
          .emit('marked_thread_read_notification', {
            event:
              mapEventResponse<Domain_Events.MARK_THREAD_READ>(threadEvent),
            conversation: mapThreadResponse(thread),
          })
      } else if (msg.fields.routingKey == 'event.conversation.updated.group') {
        const {
          data,
          creator,
        }: { data: UpdateThreadMetadataDTO; creator: User } = payload
        const thread = await ThreadService.find(data.threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          data.threadId,
          Domain_Events.GROUP_CONVERSATION_UPDATED,
          data
        )
        if (!threadEvent) {
          emitter.emit(
            'error',
            'Failed to create group conversation updated event'
          )
        }

        const updatedThread = await ThreadService.updateThreadMetadata(
          thread.id,
          data.rename,
          data.avatarUrl
        )
        if (!updatedThread) {
          emitter.emit('error', 'Failed to update thread metadata')
          return
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create group conversation updated event delivery'
          )
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )

        emitter
          .to(`user-${creator.id}`)
          .emit('group_conversation_updated_notification', {
            event:
              mapEventResponse<Domain_Events.GROUP_CONVERSATION_UPDATED>(
                threadEvent
              ),
            conversation: mapThreadResponse(updatedThread),
          })

        emitter
          .to(`thread-${data.threadId}`)
          .emit('group_conversation_updated', {
            conversation: mapThreadResponse(updatedThread),
          })
      } else if (msg.fields.routingKey == 'event.conversation.deleted') {
        const { threadId, creator }: { threadId: string; creator: User } =
          payload
        const thread = await ThreadService.find(threadId)
        if (!thread) {
          emitter.emit('error', 'Thread not found')
          return
        }
        const threadEvent = await EventService.create(
          Event_Aggregate_Type.CONVERSATION,
          threadId,
          Domain_Events.CONVERSATION_DELETED,
          thread
        )
        if (!threadEvent) {
          emitter.emit('error', 'Failed to create conversation deleted event')
        }
        const deliveries = await DeliveryService.initDelivery(
          threadEvent.id,
          thread,
          [creator]
        )
        if (!deliveries || deliveries.length === 0) {
          emitter.emit(
            'error',
            'Failed to create conversation deleted event delivery'
          )
        }
        await EventService.publishEvent(threadEvent.id)
        await Promise.all(
          deliveries.map((delivery) =>
            DeliveryService.markDelivered(delivery.id)
          )
        )
        emitter
          .to(`user-${creator.id}`)
          .emit('conversation_deleted_notification', {
            event:
              mapEventResponse<Domain_Events.CONVERSATION_DELETED>(threadEvent),
            conversation: mapThreadResponse(thread),
          })

        emitter.to(`thread-${threadId}`).emit('conversation_deleted', {
          conversation: mapThreadResponse(thread),
        })
      }
      channel.ack(msg)
    } catch (error) {
      console.error('Error in thread notifier:', error)
      channel.nack(msg as amqp.Message, false, false)
    }
  })
}

start().catch((err) => console.error('Error starting thread notifier:', err))
