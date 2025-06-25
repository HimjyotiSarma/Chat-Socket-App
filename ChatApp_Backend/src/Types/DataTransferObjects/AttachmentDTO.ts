import { AttachmentTypes } from '../Enums'

export interface CreateAttachmentDTO {
  thread_id: string
  messageContent: Record<string, any>
  replyToMessageId: string | undefined
  attachments: AttachmentInput[]
}

export interface AttachmentInput {
  file_format: AttachmentTypes
  file_type: string
  url: string
  thumbnail_url: string
}
