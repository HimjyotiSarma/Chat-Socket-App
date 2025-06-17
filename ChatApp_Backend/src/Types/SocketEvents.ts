import { CreateAttachmentDTO } from './DataTransferObjects/AttachmentDTO'
import { EventInfoDTO } from './DataTransferObjects/EventsDTO'
import {
  AttachmentResponseDTO,
  CreateMessageDTO,
  CreateReactionDTO,
  MessageBulkDTO,
  MessageInfoDTO,
  SingleReactionResponseDTO,
  UpdateMessageDTO,
} from './DataTransferObjects/MessageDTO'
import {
  CreateGrpThreadDTO,
  ThreadInfoDTO,
  ThreadOffsetInfoDTO,
  ThreadParticipantDetailDTO,
  ThreadParticipantGeneralInfoDTO,
  UpdateThreadMetadataDTO,
} from './DataTransferObjects/ThreadsDTO'
import { UserInfoDTO } from './DataTransferObjects/UsersDTO'

export interface ClientToServerEvents {
  create_message: (data: CreateMessageDTO) => void
  message_acknowledged: (data: {
    event: EventInfoDTO
    message: MessageInfoDTO
  }) => void
  conversation_created_acknowledged: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  participant_added_acknowledged: (data: {
    event: EventInfoDTO
    participant: ThreadParticipantDetailDTO
  }) => void
  participant_removed_acknowledged: (data: {
    event: EventInfoDTO
    participant: ThreadParticipantDetailDTO
  }) => void
  multiple_participants_added_acknowledged: (data: {
    event: EventInfoDTO
    participants: ThreadParticipantDetailDTO[]
  }) => void
  update_message: (data: UpdateMessageDTO) => void
  updated_message_acknowledged: (data: {
    event: EventInfoDTO
    message: MessageInfoDTO
  }) => void
  delete_message: (data: { thread_id: string; message_id: string }) => void
  deleted_message_acknowledged: (data: {
    event: EventInfoDTO
    message: MessageInfoDTO
  }) => void
  delete_message_in_bulk: (data: MessageBulkDTO[]) => void
  create_dm_conversation: () => void
  create_grp_conversation: (data: CreateGrpThreadDTO) => void
  update_group_conversation: (data: UpdateThreadMetadataDTO) => void
  group_conversation_updated_acknowledged: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  delete_conversation: (data: { thread_id: string }) => void
  conversation_deleted_acknowledged: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  // The USER ID'S here are the added new Participants user ids and not the one who is adding
  add_thread_participant: (data: { thread_id: string; user_id: string }) => void
  add_multiple_participant: (data: {
    thread_id: string
    user_ids: string[]
  }) => void
  remove_thread_participant: (data: {
    thread_id: string
    user_ids: string[]
  }) => void
  removed_participant_acknowledged: (data: {
    event: EventInfoDTO
    participant: ThreadParticipantDetailDTO
  }) => void
  open_thread: (data: { thread_id: string }) => void
  mark_thread_read: (data: { thread_id: string }) => void
  mark_thread_read_acknowledged: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  add_reaction: (data: CreateReactionDTO) => void
  remove_reaction: (data: { messageId: string }) => void
  add_attachments: (data: CreateAttachmentDTO) => void
  remove_attachments: (data: { messageId: string }) => void
  join_thread_acknowledged: (data: { conversation: ThreadInfoDTO }) => void
  leave_thread_acknowledged: (data: { conversation: ThreadInfoDTO }) => void
}

export interface ServerToClientEvents {
  message_created: (data: {
    event: EventInfoDTO
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void
  bulk_message_created: (data: {
    event: EventInfoDTO
    thread: ThreadInfoDTO
    messages: MessageInfoDTO[]
  }) => void
  message_updated: (data: {
    event: EventInfoDTO
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void

  message_deleted: (data: {
    event: EventInfoDTO
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void
  bulk_message_deleted: (data: {
    event: EventInfoDTO
    thread: ThreadInfoDTO
    messages: MessageInfoDTO[]
  }) => void
  conversation_dm_created: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  conversation_group_created: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  group_conversation_updated: (data: { conversation: ThreadInfoDTO }) => void
  group_conversation_updated_notification: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  group_conversation_updated_acknowledged: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  conversation_deleted: (data: { conversation: ThreadInfoDTO }) => void
  conversation_deleted_notification: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  participant_added: (data: {
    participant: ThreadParticipantGeneralInfoDTO
  }) => void
  added_to_conversation_notification: (data: {
    event: EventInfoDTO
    participant: ThreadParticipantDetailDTO
  }) => void
  multiple_participant_added: (data: {
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  multiple_participant_added_notification: (data: {
    event: EventInfoDTO
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  // This will be sent to all the Thread Participants in a Thread
  participant_removed: (data: {
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  // Send the Notification to the One who have send the removed participant request
  removed_from_conversation_notification: (data: {
    event: EventInfoDTO
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  marked_thread_read_notification: (data: {
    event: EventInfoDTO
    conversation: ThreadInfoDTO
  }) => void
  reaction_added: (data: SingleReactionResponseDTO) => void
  reaction_removed: (data: SingleReactionResponseDTO) => void
  attachment_added: (data: AttachmentResponseDTO[]) => void
  attachment_removed: (data: AttachmentResponseDTO[]) => void
  join_thread: (data: { conversation: ThreadInfoDTO }) => void
  leave_thread: (data: { conversation: ThreadInfoDTO }) => void
  pending_messages_of_thread: (
    data: {
      event: EventInfoDTO
      message: MessageInfoDTO
    }[]
  ) => void
  pending_reactions_of_thread: (
    data: {
      messageId: string
      reactions: {
        emojiHex: string
        count: number
      }[]
    }[]
  ) => void
  error: (message: string) => void
}
export interface InterServerEvents {
  ping: () => void
}
export interface SocketData {
  userId: string
  username?: string
}
