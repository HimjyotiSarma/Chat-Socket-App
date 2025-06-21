import { Domain_Events, Event_Aggregate_Type } from '../Enums'
import { MessageInfoDTO } from './MessageDTO'
import { ThreadInfoDTO } from './ThreadsDTO'
import { UserInfoDTO } from './UsersDTO'
import { ThreadParticipantDetailDTO } from './ThreadsDTO'
import { Message } from '../../entity/Message'
import { Conversation } from '../../entity/Conversations'
import { ThreadParticipant } from '../../entity/ThreadParticipants'
import { Reaction } from '../../entity/Reaction'
import { Attachment } from '../../entity/Attachment'
import { DomainEvent } from '../../entity/DomainEvent'

export type DomainEventPayloadMap = {
  // Message-related
  [Domain_Events.MESSAGE_CREATED]: Message
  [Domain_Events.MESSAGE_UPDATED]: Message
  [Domain_Events.MESSAGE_DELETED]: Message
  [Domain_Events.MESSAGE_ACKNOWLEDGED]: Message
  [Domain_Events.BULK_MESSAGE_DELETED]: Message[]
  [Domain_Events.BULK_MESSAGE_DELETED_ACKNOWLEDGED]: Message[]
  [Domain_Events.REACTION_ADDED]: Reaction
  [Domain_Events.REACTION_REMOVED]: Reaction
  [Domain_Events.ATTACHMENT_ADDED]: Attachment[]
  [Domain_Events.ATTACHMENT_REMOVED]: Attachment[]

  // Thread-related
  [Domain_Events.DM_CONVERSATION_CREATED]: Conversation
  [Domain_Events.GROUP_CONVERSATION_CREATED]: Conversation
  [Domain_Events.CONVERSATION_CREATED_ACKNOWLEDGED]: Conversation
  [Domain_Events.GROUP_CONVERSATION_UPDATED]: Conversation
  [Domain_Events.GROUP_CONVERSATION_UPDATED_ACKNOWLEDGED]: Conversation
  [Domain_Events.CONVERSATION_DELETED]: Conversation
  [Domain_Events.CONVERSATION_DELETED_ACKNOWLEDGED]: Conversation
  [Domain_Events.PARTICIPANT_ADDED]: ThreadParticipant
  [Domain_Events.PARTICIPANT_ADDED_ACKNOWLEDGED]: ThreadParticipant
  [Domain_Events.PARTICIPANT_REMOVED]: ThreadParticipant[]
  [Domain_Events.PARTICIPANT_REMOVED_ACKNOWLEDGED]: ThreadParticipant[]
  [Domain_Events.MULTIPLE_PARTICIPANT_ADDED]: ThreadParticipant[]
  [Domain_Events.MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED]: ThreadParticipant[]
  [Domain_Events.MARK_THREAD_READ]: Conversation
  [Domain_Events.MARK_THREAD_READ_ACKNOWLEDGED]: Conversation

  // User-related
  [Domain_Events.USER_PROFILE_UPDATED]: UserInfoDTO
}

export type TypedDomainEvent<K extends keyof DomainEventPayloadMap> = {
  id: bigint
  aggregateId: string
  aggregateType: Event_Aggregate_Type
  eventType: K
  payload: DomainEventPayloadMap[K]
  published: boolean
  publishedAt?: Date
  createdAt: Date
}

export function toEventInfoDTO<T extends keyof DomainEventPayloadMap>(
  domainEvent: DomainEvent
): EventInfoDTO<T> {
  return {
    id: domainEvent.id,
    eventType: domainEvent.eventType as T,
    aggregateId: domainEvent.aggregateId,
    aggregateType: domainEvent.aggregateType,
    payload: domainEvent.payload as DomainEventPayloadMap[T],
    publishedAt: domainEvent.publishedAt,
    createdAt: domainEvent.createdAt,
  }
}

export interface EventInfoDTO<T extends keyof DomainEventPayloadMap> {
  id: bigint
  eventType: T
  aggregateId: string
  aggregateType: string
  payload: DomainEventPayloadMap[T]
  publishedAt?: Date
  createdAt: Date
}
