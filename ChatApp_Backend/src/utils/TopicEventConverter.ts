import { Domain } from 'domain'
import { Domain_Events } from '../Types/Enums'

const EventToTopic = (eventName: Domain_Events) => {
  switch (eventName) {
    case Domain_Events.MESSAGE_CREATED:
      return 'event.message.created'
    case Domain_Events.MESSAGE_UPDATED:
      return 'event.message.updated'
    case Domain_Events.MESSAGE_DELETED:
      return 'event.message.deleted'
    case Domain_Events.MESSAGE_ACKNOWLEDGED:
      return 'event.message.acknowledged'
    case Domain_Events.BULK_MESSAGE_DELETED:
      return 'event.message.bulk.deleted'
    case Domain_Events.DM_CONVERSATION_CREATED:
      return 'event.conversation.created.dm'
    case Domain_Events.GROUP_CONVERSATION_CREATED:
      return 'event.conversation.created.group'
    case Domain_Events.CONVERSATION_CREATED_ACKNOWLEDGED:
      return 'event.conversation.created.acknowledged'
    case Domain_Events.GROUP_CONVERSATION_UPDATED:
      return 'event.conversation.updated.group'
    case Domain_Events.GROUP_CONVERSATION_UPDATED_ACKNOWLEDGED:
      return 'event.conversation.updated.group.acknowledged'
    case Domain_Events.CONVERSATION_DELETED:
      return 'event.conversation.deleted'
    case Domain_Events.CONVERSATION_DELETED_ACKNOWLEDGED:
      return 'event.conversation.deleted.acknowledged'
    case Domain_Events.PARTICIPANT_ADDED:
      return 'event.conversation.participant.added'
    case Domain_Events.PARTICIPANT_REMOVED:
      return 'event.conversation.participant.removed'
    case Domain_Events.MULTIPLE_PARTICIPANT_ADDED:
      return 'event.conversation.participant.multiple.added'
    case Domain_Events.PARTICIPANT_ADDED_ACKNOWLEDGED:
      return 'event.conversation.participant.added.acknowledged'
    case Domain_Events.PARTICIPANT_REMOVED_ACKNOWLEDGED:
      return 'event.conversation.participant.removed.acknowledged'
    case Domain_Events.MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED:
      return 'event.conversation.participant.multiple.added.acknowledged'
    case Domain_Events.MARK_THREAD_READ:
      return 'event.conversation.thread.read'
    case Domain_Events.MARK_THREAD_READ_ACKNOWLEDGED:
      return 'event.conversation.thread.read.acknowledged'
    case Domain_Events.REACTION_ADDED:
      return 'event.message.reaction.added'
    case Domain_Events.REACTION_REMOVED:
      return 'event.message.reaction.removed'
    case Domain_Events.ATTACHMENT_ADDED:
      return 'event.message.attachment.added'
    case Domain_Events.ATTACHMENT_REMOVED:
      return 'event.message.attachment.removed'
    case Domain_Events.USER_PROFILE_UPDATED:
      return 'event.user.profile.updated'
    default:
      return 'event.unknown'
  }
}

const TopicToEvent = (topic: string) => {
  switch (topic) {
    case 'event.message.created':
      return Domain_Events.MESSAGE_CREATED
    case 'event.message.updated':
      return Domain_Events.MESSAGE_UPDATED
    case 'event.message.deleted':
      return Domain_Events.MESSAGE_DELETED
    case 'event.message.bulk.deleted':
      return Domain_Events.BULK_MESSAGE_DELETED
    case 'event.conversation.created.dm':
      return Domain_Events.DM_CONVERSATION_CREATED
    case 'event.conversation.created.group':
      return Domain_Events.GROUP_CONVERSATION_CREATED
    case 'event.conversation.updated.group':
      return Domain_Events.GROUP_CONVERSATION_UPDATED
    case 'event.conversation.deleted':
      return Domain_Events.CONVERSATION_DELETED
    case 'event.conversation.participant.added':
      return Domain_Events.PARTICIPANT_ADDED
    case 'event.conversation.participant.removed':
      return Domain_Events.PARTICIPANT_REMOVED
    case 'event.conversation.participant.multiple.added':
      return Domain_Events.MULTIPLE_PARTICIPANT_ADDED
    case 'event.conversation.thread.read':
      return Domain_Events.MARK_THREAD_READ
    case 'event.message.reaction.added':
      return Domain_Events.REACTION_ADDED
    case 'event.message.reaction.removed':
      return Domain_Events.REACTION_REMOVED
    case 'event.message.attachment.added':
      return Domain_Events.ATTACHMENT_ADDED
    case 'event.message.attachment.removed':
      return Domain_Events.ATTACHMENT_REMOVED
    case 'event.user.profile.updated':
      return Domain_Events.USER_PROFILE_UPDATED
    default:
      return Domain_Events.ERROR
  }
}

const EventTypeToEventName = (eventType: Domain_Events) => {
  if (eventType == Domain_Events.MESSAGE_CREATED) {
    return 'message_created'
  } else if (eventType == Domain_Events.MESSAGE_UPDATED) {
    return 'message_updated'
  } else if (eventType == Domain_Events.MESSAGE_DELETED) {
    return 'message_deleted'
  } else if (eventType == Domain_Events.BULK_MESSAGE_DELETED) {
    return 'bulk_message_deleted'
  } else if (eventType == Domain_Events.DM_CONVERSATION_CREATED) {
    return 'dm_conversation_created'
  } else if (eventType == Domain_Events.GROUP_CONVERSATION_CREATED) {
    return 'group_conversation_created'
  } else if (eventType == Domain_Events.GROUP_CONVERSATION_UPDATED) {
    return 'group_conversation_updated'
  } else if (eventType == Domain_Events.CONVERSATION_DELETED) {
    return 'conversation_deleted'
  } else if (eventType == Domain_Events.PARTICIPANT_ADDED) {
    return 'participant_added'
  } else if (eventType == Domain_Events.PARTICIPANT_REMOVED) {
    return 'participant_removed'
  } else if (eventType == Domain_Events.MULTIPLE_PARTICIPANT_ADDED) {
    return 'multiple_participant_added'
  } else if (eventType == Domain_Events.MARK_THREAD_READ) {
    return 'mark_thread_read'
  } else if (eventType == Domain_Events.REACTION_ADDED) {
    return 'reaction_added'
  } else if (eventType == Domain_Events.REACTION_REMOVED) {
    return 'reaction_removed'
  } else if (eventType == Domain_Events.ATTACHMENT_ADDED) {
    return 'attachment_added'
  } else if (eventType == Domain_Events.ATTACHMENT_REMOVED) {
    return 'attachment_removed'
  } else if (eventType == Domain_Events.USER_PROFILE_UPDATED) {
    return 'user_profile_updated'
  } else {
    return 'error'
  }
}

export { EventToTopic, TopicToEvent, EventTypeToEventName }
