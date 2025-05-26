import { CreateAttachmentDTO } from './DataTransferObjects/AttachmentDTO'
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
  CreateThreadDTO,
  ThreadInfoDTO,
  ThreadOffsetInfoDTO,
  ThreadParticipantDetailDTO,
  UpdateThreadMetadataDTO,
} from './DataTransferObjects/ThreadsDTO'

export interface ClientToServerEvents {
  create_message: (data: CreateMessageDTO) => void
  update_message: (data: UpdateMessageDTO) => void
  delete_message: (data: { thread_id: string; message_id: string }) => void
  delete_message_in_bulk: (data: MessageBulkDTO[]) => void
  create_conversation: (data: CreateThreadDTO) => void
  update_conversation: (data: UpdateThreadMetadataDTO) => void
  delete_conversation: (data: { thread_id: string }) => void
  add_thread_participant: (data: { thread_id: string; user_id: string }) => void
  add_multiple_participant: (data: {
    thread_id: string
    user_ids: string[]
  }) => void
  mark_thread_read: (data: { thread_id: string }) => void
  add_reaction: (data: CreateReactionDTO) => void
  remove_reaction: (data: { messageId: string }) => void
  add_attachments: (data: CreateAttachmentDTO) => void
  remove_attachments: (data: { messageId: string }) => void
}

export interface ServerToClientEvents {
  message_created: (data: MessageInfoDTO) => void
  message_updated: (data: MessageInfoDTO) => void
  message_deleted: (data: MessageInfoDTO) => void
  bulk_message_deleted: (data: MessageInfoDTO[]) => void
  conversation_created: (data: ThreadInfoDTO) => void
  conversation_updated: (data: ThreadInfoDTO) => void
  conversation_deleted: (data: ThreadInfoDTO) => void
  participant_added: (data: ThreadParticipantDetailDTO) => void
  multiple_participant_added: (data: ThreadParticipantDetailDTO[]) => void
  mark_thread_read: (data: ThreadOffsetInfoDTO) => void
  reaction_added: (data: SingleReactionResponseDTO) => void
  reaction_removed: (data: SingleReactionResponseDTO) => void
  attachment_added: (data: AttachmentResponseDTO[]) => void
  attachment_removed: (data: AttachmentResponseDTO[]) => void
  error: (message: string) => void
}
export interface InterServerEvents {
  ping: () => void
}
export interface SocketData {
  userId: string
  username?: string
}
