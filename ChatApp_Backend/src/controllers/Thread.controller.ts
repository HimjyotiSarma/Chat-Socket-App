import e from 'express'
import publishEvent from '../publisher/publisher'
import EventService from '../services/Event.service'
import MessageService from '../services/Message.service'
import ThreadService from '../services/Thread.service'
import UserService from '../services/User.service'
import { Domain_Events, Thread_Types } from '../Types/Enums'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadParticipantDetail,
  mapThreadParticipants,
  mapThreadResponse,
} from '../utils/ResponseMapper'
import { EventToTopic } from '../utils/TopicEventConverter'
import SocketController from './utils/Socket.controller'

class ThreadController extends SocketController {
  async register() {
    const { io, socket } = this
    const { userId, username } = socket.data
    if (!userId || !username) {
      return socket.emit('error', 'Invalid token')
    }
    const user = await UserService.find(userId)
    const connectedThreads = await UserService.findThreads(userId)
    if (!connectedThreads) {
      socket.emit('error', 'No threads found for user')
    }
    if (connectedThreads.length >= 1) {
      for (const thread of connectedThreads) {
        socket.join(`thread-${thread.id}`)
        socket.join(`user-${userId}:thread-${thread.id}`)
      }
    }
    socket.on('create_dm_conversation', async () => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }

      const eventTopic = EventToTopic(Domain_Events.DM_CONVERSATION_CREATED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(JSON.stringify({ creator: user }))
      )
    })
    socket.on('create_grp_conversation', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.GROUP_CONVERSATION_CREATED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(JSON.stringify({ creator: user, data: data }))
      )
    })
    socket.on('add_thread_participant', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.PARTICIPANT_ADDED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            participantId: data.user_id,
            creator: user,
          })
        )
      )
    })
    socket.on('add_multiple_participant', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }

      const eventTopic = EventToTopic(Domain_Events.MULTIPLE_PARTICIPANT_ADDED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            userIds: data.user_ids,
            creator: user,
          })
        )
      )
    })

    socket.on('remove_thread_participant', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.PARTICIPANT_REMOVED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            participantIds: data.user_ids,
            creator: user,
          })
        )
      )
    })
    socket.on('conversation_created_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.CONVERSATION_CREATED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })
    socket.on('participant_added_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.PARTICIPANT_ADDED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })
    socket.on('multiple_participants_added_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })
    socket.on('remove_thread_participant', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.PARTICIPANT_REMOVED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            participantIds: data.user_ids,
            creator: user,
          })
        )
      )
    })

    socket.on('participant_removed_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.PARTICIPANT_REMOVED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })

    socket.on('mark_thread_read', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.MARK_THREAD_READ)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            creator: user,
          })
        )
      )
    })

    socket.on('mark_thread_read_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.MARK_THREAD_READ_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })

    socket.on('update_group_conversation', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.GROUP_CONVERSATION_UPDATED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            data: data,
            creator: user,
          })
        )
      )
    })

    socket.on('group_conversation_updated_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.GROUP_CONVERSATION_UPDATED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })

    socket.on('delete_conversation', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(Domain_Events.CONVERSATION_DELETED)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: data.thread_id,
            creator: user,
          })
        )
      )
    })

    socket.on('conversation_deleted_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      const eventTopic = EventToTopic(
        Domain_Events.CONVERSATION_DELETED_ACKNOWLEDGED
      )
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            event: data.event,
            userId: userId,
          })
        )
      )
    })

    socket.on('join_thread_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      socket.join(this.room('thread', data.conversation.id))
    })

    socket.on('leave_thread_acknowledged', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      socket.leave(this.room('thread', data.conversation.id))
    })

    socket.on('open_thread', async (data) => {
      if (!userId || !username) {
        return socket.emit('error', 'Invalid token')
      }
      socket.join(this.room('thread', data.thread_id))
      const threadOffsetDate = await ThreadService.findLastOffsetDate(
        data.thread_id,
        userId
      )

      const pendingMessages = await ThreadService.findMessages(
        data.thread_id,
        100,
        0,
        threadOffsetDate
      )

      const pendingMessagesEvents = await Promise.all(
        pendingMessages.map(async (message) => {
          const event = await EventService.getEventOfMessage(message.id)
          if (!event) return null
          return {
            event: mapEventResponse(event),
            message: mapMessageResponse(message),
          }
        })
      )

      if (!pendingMessagesEvents) {
        socket
          .to(this.room('user', userId))
          .emit('error', 'No pending messages found')
        return
      }
      const filterNonNullMessageEvents = pendingMessagesEvents.filter(
        (messageEvent) => messageEvent !== null
      )

      socket
        .to(this.room('user', userId))
        .emit('pending_messages_of_thread', [...filterNonNullMessageEvents])

      // Get Pending Reactions
      const filteredPendingMessageIds = pendingMessages.map(
        (message) => message.id
      )
      const pendingReactions = await MessageService.getReactionsOfMessages(
        filteredPendingMessageIds
      )
      socket
        .to(this.room('user', userId))
        .emit('pending_reactions_of_thread', pendingReactions)

      // Also fetch all the pending attachments
    })
  }
}
