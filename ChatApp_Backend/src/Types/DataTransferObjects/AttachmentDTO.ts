import { AttachmentTypes } from '../Enums'

export interface CreateAttachmentDTO {
  thread_id: string
  messageContent: Record<string, any>
  attachments: AttachmentInput[]
}

export interface AttachmentInput {
  fileType: AttachmentTypes
  url: string
  thumbnail_url: string
}
