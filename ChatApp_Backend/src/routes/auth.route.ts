import { Router } from 'express'
import { upload } from '../middlewares/multer.middleware'
import {
  verifyAccessToken,
  verifyRefreshToken,
} from '../middlewares/auth.middleware'
import {
  logInUser,
  logoutUser,
  refreshToken,
  registerUser,
  UpdatePassword,
  UpdateUserDetails,
  UpdateAvatar,
} from '../controllers/User.controller'
const router = Router()

router.route('/register').post(upload.single('avatar'), registerUser)
router.route('/login').post(logInUser)
router.route('/logout').get(logoutUser)
router.route('/refresh-token').post(verifyRefreshToken, refreshToken)
router.route('/update-details').patch(verifyAccessToken, UpdateUserDetails)
router.route('/update-password').patch(verifyAccessToken, UpdatePassword)
router
  .route('/update-avatar')
  .patch(verifyAccessToken, upload.single('avatar'), UpdateAvatar)
//  Add remove User route

export default router
