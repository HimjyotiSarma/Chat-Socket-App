import { Router } from 'express'
import { multi_upload } from '../middlewares/multer.middleware'
import {
  verifyAccessToken,
  verifyRefreshToken,
} from '../middlewares/auth.middleware'
import { uploadAttachments } from '../controllers/Attachments.controller'

const router = Router()

router.route('/upload').post(
  verifyAccessToken,
  multi_upload.fields([
    {
      name: 'attachments',
      maxCount: 10,
    },
  ]),
  uploadAttachments
)

export default router
