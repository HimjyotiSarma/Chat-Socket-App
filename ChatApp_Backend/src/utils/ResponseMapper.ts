import { Message } from '../entity/Message'
import { ThreadParticipant } from '../entity/ThreadParticipants'
import { User } from '../entity/User'
import {
  AttachmentResponseDTO,
  MessageInfoDTO,
  ReactionResponseGeneralDTO,
} from '../Types/DataTransferObjects/MessageDTO'
import {
  ThreadInfoDTO,
  ThreadParticipantDetailDTO,
  ThreadParticipantGeneralInfoDTO,
} from '../Types/DataTransferObjects/ThreadsDTO'
import { Conversation } from '../entity/Conversations'
import { UserInfoDTO } from '../Types/DataTransferObjects/UsersDTO'
import { Attachment } from '../entity/Attachment'
import { Reaction } from '../entity/Reaction'
import { DomainEvent } from '../entity/DomainEvent'
import {
  DomainEventPayloadMap,
  EventInfoDTO,
} from '../Types/DataTransferObjects/EventsDTO'

const mapUserResponse = (user: User): UserInfoDTO => {
  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    lastSeenAt: user.lastSeenAt ?? null,
    created_at: user.createdAt,
  }
  return userResponse
}

const mapAttachmentResponse = (
  attachment: Attachment
): AttachmentResponseDTO => {
  const attachmentResponse = {
    id: attachment.id,
    message_id: attachment.message.id,
    file_format: attachment.fileFormat,
    file_type: attachment.fileType,
    url: attachment.url,
    thumbnail_url: attachment.thumbnail_url,
    created_at: attachment.createdAt,
  }
  return attachmentResponse
}
const mapThreadResponse = (thread: Conversation): ThreadInfoDTO => {
  const threadResponse = {
    id: thread.id,
    name: thread.name,
    type: thread.type,
    avatarUrl: thread.avatarUrl,
    created_by: mapUserResponse(thread.createdBy),
  }
  return threadResponse
}

const mapThreadParticipants = (
  participant: ThreadParticipant
): ThreadParticipantGeneralInfoDTO => {
  const participantResponse = {
    thread_id: participant.threadId,
    user_id: participant.userId,
    username: participant.user.username,
    role: participant.role,
  }
  return participantResponse
}

const mapThreadParticipantDetail = (
  participant: ThreadParticipant
): ThreadParticipantDetailDTO => {
  const participantResponse = {
    thread: mapThreadResponse(participant.thread),
    user: mapUserResponse(participant.user),
    role: participant.role,
  }
  return participantResponse
}

const mapReactionResponse = (
  reaction: Reaction
): ReactionResponseGeneralDTO => {
  const reactionResponse = {
    id: reaction.id,
    message_id: reaction.message.id,
    user_id: reaction.user.id,
    emojiHex: reaction.emojiHex,
    reacted_at: reaction.reactedAt ?? null,
  }
  return reactionResponse
}
const mapMessageResponse = (message: Message): MessageInfoDTO => {
  const messageResponse = {
    id: message.id,
    thread: mapThreadResponse(message.conversation),
    sender: mapUserResponse(message.sender),
    content: message.content,
    attachments: message.attachments
      ? message.attachments?.map((attachment) =>
          mapAttachmentResponse(attachment)
        )
      : null,
    reactions: message.reactions
      ? message.reactions.map((reaction) => mapReactionResponse(reaction))
      : null,
    created_at: message.createdAt,
    edited_at: message.editedAt,
  }
  return messageResponse
}

function mapEventResponse<T extends keyof DomainEventPayloadMap>(
  domainEvent: DomainEvent
): EventInfoDTO<T> {
  return {
    id: domainEvent.id,
    aggregateType: domainEvent.aggregateType,
    aggregateId: domainEvent.aggregateId,
    eventType: domainEvent.eventType as T,
    payload: domainEvent.payload as DomainEventPayloadMap[T],
    createdAt: domainEvent.createdAt,
  }
}

export {
  mapUserResponse,
  mapAttachmentResponse,
  mapThreadResponse,
  mapThreadParticipants,
  mapReactionResponse,
  mapMessageResponse,
  mapEventResponse,
  mapThreadParticipantDetail,
}
