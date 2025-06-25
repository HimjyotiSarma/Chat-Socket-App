import e from 'express'
import publishEvent from '../publisher/publisher'
import EventService from '../services/Event.service'
import MessageService from '../services/Message.service'
import ThreadService from '../services/Thread.service'
import UserService from '../services/User.service'
import {
  Domain_Events,
  Event_Aggregate_Type,
  Thread_Types,
} from '../Types/Enums'
import {
  mapEventResponse,
  mapMessageResponse,
  mapThreadParticipantDetail,
  mapThreadParticipants,
  mapThreadResponse,
} from '../utils/ResponseMapper'
import { EventToTopic } from '../utils/TopicEventConverter'
import SocketController from './utils/Socket.controller'
import DeliveryService from '../services/Delivery.service'
import { DeliveryStatus } from '../entity/DeliveryStatus'
import { User } from '../entity/User'

class ThreadController extends SocketController {
  async register() {
    const { io, socket } = this
    const { userId, username } = socket.data
    if (!userId || !username) {
      socket.emit('error', 'Invalid token')
      return
    }
    const user = await UserService.find(userId)
    const connectedThreads = await UserService.findThreads(userId)
    if (!connectedThreads) {
      socket.emit('error', 'No threads found for user')
      return
    }
    if (connectedThreads.length >= 1) {
      for (const thread of connectedThreads) {
        socket.join(`thread-${thread.id}`)
        socket.join(`user-${userId}:thread-${thread.id}`)
      }
    }
    socket.on('create_dm_conversation', async () => {
      if (!userId || !username) {
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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

    socket.on('add_thread_participant_acknowledged', async (data) => {
      if (!userId || !username) {
        socket.emit('error', 'Invalid token')
        return
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

    socket.on('remove_thread_participant', async (data) => {
      if (!userId || !username) {
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
      }
      await this.markThreadRead(data.thread_id, user)
    })

    socket.on('mark_thread_read_acknowledged', async (data) => {
      if (!userId || !username) {
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
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
        socket.emit('error', 'Invalid token')
        return
      }
      socket.join(this.room('thread', data.conversation.id))
    })

    socket.on('leave_thread_acknowledged', async (data) => {
      if (!userId || !username) {
        socket.emit('error', 'Invalid token')
        return
      }
      socket.leave(this.room('thread', data.conversation.id))
    })

    socket.on('open_thread', async (data) => {
      try {
        if (!userId || !username) {
          socket.emit('error', 'Invalid token')
          return
        }
        const thread = await ThreadService.find(data.thread_id)
        // Fetch all Unacknowledged Message Events
        const unAckMessageDeliveries =
          await DeliveryService.getUnAcknowledgedDeliveriesForUser(user, thread)

        if (!unAckMessageDeliveries || unAckMessageDeliveries.length === 0) {
          socket.emit(
            'error',
            'No Unacknowledged Messages found in the conversation'
          )
          return
        }
        // Retry Unacknowledged Message Deliveries
        await this.retryUnAckMsgDeliveriesForUser(unAckMessageDeliveries)
        // Mark the Thread as Read
        await this.markThreadRead(data.thread_id, user)
      } catch (error) {
        socket.emit('error', 'Error opening thread: ' + error)
        console.error(error)
      }
    })

    socket.on('close_thread', async (data) => {
      try {
        if (!userId || !username) {
          socket.emit('error', 'Invalid token')
          return
        }
        // Mark the Thread as Read
        await this.markThreadRead(data.thread_id, user)
      } catch (error) {
        socket.emit('error', 'Error closing thread: ' + error)
        console.error(error)
      }
    })
  }

  async retryUnAckMsgDeliveriesForUser(deliveries: DeliveryStatus[]) {
    try {
      const eventTopic = 'event.retry.message'

      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            deliveries: deliveries,
            userId: this.socket.data.userId,
          })
        )
      )
    } catch (error) {
      if (error instanceof Error) {
        this.socket.emit('error', error.message)
      } else {
        this.socket.emit('error', 'Error retrying delivery')
      }
    }
  }

  async markThreadRead(threadId: string, user: User) {
    try {
      const eventTopic = EventToTopic(Domain_Events.MARK_THREAD_READ)
      publishEvent(
        'event_hub',
        eventTopic,
        Buffer.from(
          JSON.stringify({
            threadId: threadId,
            user: user,
          })
        )
      )
    } catch (error) {
      if (error instanceof Error) {
        this.socket.emit('error', error.message)
      } else {
        this.socket.emit('error', 'Error retrying delivery')
      }
    }
  }
}
export default ThreadController
