import asyncHandler from '../utils/asyncHandler'
import ApiError from '../utils/ApiError'
import ApiResponse from '../utils/ApiResponse'
import { uploadToCloudinary } from '../utils/cloudinary'

const uploadAttachments = asyncHandler(async (req, res) => {
  if (!req.files) {
    throw new ApiError(400, 'Attachments are required')
  }
  const filesMap = req.files as Record<string, Express.Multer.File[]>
  const localAttachments = filesMap?.attachments

  if (!localAttachments || localAttachments.length == 0) {
    throw new ApiError(400, 'Attachments are required')
  }

  const localAttachmentsPaths = localAttachments.map((file) => file.path)
  const attachmentDetails = await Promise.all(
    localAttachmentsPaths.map((localAttachmentPath) =>
      uploadToCloudinary(localAttachmentPath).then((response) => ({
        url: response.secure_url,
        resource_type: response.resource_type,
        format: response.format,
        created_at: response.created_at,
      }))
    )
  )

  res.status(200).json(
    new ApiResponse(
      200,
      {
        attachments: attachmentDetails,
      },
      'Attachments uploaded successfully'
    )
  )
})

export { uploadAttachments }
