import { CreateAttachmentDTO } from './DataTransferObjects/AttachmentDTO'
import { EventInfoDTO } from './DataTransferObjects/EventsDTO'
import {
  AttachmentResponseDTO,
  CreateMessageDTO,
  CreateReactionDTO,
  MessageBulkDTO,
  MessageInfoDTO,
  ReactionResponseGeneralDTO,
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
import { Domain_Events } from './Enums'

export interface ClientToServerEvents {
  create_message: (data: CreateMessageDTO) => void
  create_message_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_ACKNOWLEDGED>
    message: MessageInfoDTO
  }) => void
  conversation_created_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.CONVERSATION_CREATED_ACKNOWLEDGED>
    conversation: ThreadInfoDTO
  }) => void
  participant_added_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_ADDED_ACKNOWLEDGED>
    participant: ThreadParticipantDetailDTO
  }) => void
  participant_removed_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_REMOVED_ACKNOWLEDGED>
    participant: ThreadParticipantDetailDTO
  }) => void
  multiple_participants_added_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED>
    participants: ThreadParticipantDetailDTO[]
  }) => void
  update_message: (data: UpdateMessageDTO) => void
  updated_message_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_ACKNOWLEDGED>
    message: MessageInfoDTO
  }) => void
  delete_message: (data: { thread_id: string; message_id: string }) => void
  deleted_message_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_ACKNOWLEDGED>
    message: MessageInfoDTO
  }) => void
  bulk_message_delete: (data: MessageBulkDTO[]) => void
  bulk_message_deleted_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.BULK_MESSAGE_DELETED_ACKNOWLEDGED>
    messages: MessageInfoDTO[]
  }) => void
  create_dm_conversation: () => void
  create_grp_conversation: (data: CreateGrpThreadDTO) => void
  update_group_conversation: (data: UpdateThreadMetadataDTO) => void
  group_conversation_updated_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.GROUP_CONVERSATION_UPDATED_ACKNOWLEDGED>
    conversation: ThreadInfoDTO
  }) => void
  delete_conversation: (data: { thread_id: string }) => void
  conversation_deleted_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.CONVERSATION_DELETED_ACKNOWLEDGED>
    conversation: ThreadInfoDTO
  }) => void
  // The USER ID'S here are the added new Participants user ids and not the one who is adding
  add_thread_participant: (data: { thread_id: string; user_id: string }) => void
  add_thread_participant_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_ADDED_ACKNOWLEDGED>
    participant: ThreadParticipantGeneralInfoDTO
  }) => void
  add_multiple_participant: (data: {
    thread_id: string
    user_ids: string[]
  }) => void
  add_multiple_participant_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MULTIPLE_PARTICIPANT_ADDED_ACKNOWLEDGED>
    participants: ThreadParticipantDetailDTO[]
  }) => void
  remove_thread_participant: (data: {
    thread_id: string
    user_ids: string[]
  }) => void
  removed_participant_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_REMOVED_ACKNOWLEDGED>
    participant: ThreadParticipantDetailDTO
  }) => void
  open_thread: (data: { thread_id: string }) => void
  close_thread: (data: { thread_id: string }) => void
  mark_thread_read: (data: { thread_id: string }) => void
  mark_thread_read_acknowledged: (data: {
    event: EventInfoDTO<Domain_Events.MARK_THREAD_READ_ACKNOWLEDGED>
    conversation: ThreadInfoDTO
  }) => void
  add_reaction: (data: CreateReactionDTO) => void
  remove_reaction: (data: { messageId: string }) => void
  add_attachments: (data: CreateAttachmentDTO) => void
  remove_attachments: (data: { messageId: string }) => void
  join_thread_acknowledged: (data: { conversation: ThreadInfoDTO }) => void
  leave_thread_acknowledged: (data: { conversation: ThreadInfoDTO }) => void
  pending_msg_count_per_thread: () => void
}

export interface ServerToClientEvents {
  message_created: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_CREATED>
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void

  message_updated: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_UPDATED>
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void

  message_deleted: (data: {
    event: EventInfoDTO<Domain_Events.MESSAGE_DELETED>
    thread: ThreadInfoDTO
    message: MessageInfoDTO
  }) => void
  bulk_message_deleted: (data: {
    event: EventInfoDTO<Domain_Events.BULK_MESSAGE_DELETED>
    thread: ThreadInfoDTO
    messages: MessageInfoDTO[]
  }) => void
  conversation_dm_created: (data: {
    event: EventInfoDTO<Domain_Events.DM_CONVERSATION_CREATED>
    conversation: ThreadInfoDTO
  }) => void
  conversation_group_created: (data: {
    event: EventInfoDTO<Domain_Events.GROUP_CONVERSATION_CREATED>
    conversation: ThreadInfoDTO
  }) => void
  group_conversation_updated: (data: { conversation: ThreadInfoDTO }) => void
  group_conversation_updated_notification: (data: {
    event: EventInfoDTO<Domain_Events.GROUP_CONVERSATION_UPDATED>
    conversation: ThreadInfoDTO
  }) => void
  conversation_deleted: (data: { conversation: ThreadInfoDTO }) => void
  conversation_deleted_notification: (data: {
    event: EventInfoDTO<Domain_Events.CONVERSATION_DELETED>
    conversation: ThreadInfoDTO
  }) => void
  participant_added: (data: {
    participant: ThreadParticipantGeneralInfoDTO
  }) => void
  added_participant_to_conversation_notification: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_ADDED>
    participant: ThreadParticipantGeneralInfoDTO
  }) => void
  multiple_participant_added: (data: {
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  multiple_participant_added_notification: (data: {
    event: EventInfoDTO<Domain_Events.MULTIPLE_PARTICIPANT_ADDED>
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  // This will be sent to all the Thread Participants in a Thread
  participant_removed: (data: {
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  // Send the Notification to the One who have send the removed participant request
  removed_participant_from_conversation_notification: (data: {
    event: EventInfoDTO<Domain_Events.PARTICIPANT_REMOVED>
    participants: ThreadParticipantGeneralInfoDTO[]
  }) => void
  marked_thread_read_notification: (data: {
    event: EventInfoDTO<Domain_Events.MARK_THREAD_READ>
    conversation: ThreadInfoDTO
  }) => void
  reaction_added: (data: {
    event: EventInfoDTO<Domain_Events.REACTION_ADDED>
    thread: ThreadInfoDTO
    reaction: ReactionResponseGeneralDTO
  }) => void
  reaction_removed: (data: {
    event: EventInfoDTO<Domain_Events.REACTION_REMOVED>
    thread: ThreadInfoDTO
    reaction: ReactionResponseGeneralDTO
  }) => void
  attachment_added: (data: {
    event: EventInfoDTO<Domain_Events.ATTACHMENT_ADDED>
    thread: ThreadInfoDTO
    attachments: AttachmentResponseDTO[]
  }) => void
  attachment_removed: (data: {
    event: EventInfoDTO<Domain_Events.ATTACHMENT_REMOVED>
    thread: ThreadInfoDTO
    attachments: AttachmentResponseDTO[]
  }) => void
  join_thread: (data: { conversation: ThreadInfoDTO }) => void
  leave_thread: (data: { conversation: ThreadInfoDTO }) => void
  error: (message: string) => void
}
export interface InterServerEvents {
  ping: () => void
}
export interface SocketData {
  userId: string
  username?: string
}
