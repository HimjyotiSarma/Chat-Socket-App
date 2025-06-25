import multer from 'multer'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.originalname + '-' + uniqueSuffix)
  },
})

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
})
export const multi_upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg' ||
      file.mimetype == 'image/gif' ||
      file.mimetype == 'image/webp' ||
      file.mimetype == 'application/pdf' ||
      file.mimetype == 'application/msword' ||
      file.mimetype ==
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype == 'application/vnd.ms-excel' ||
      file.mimetype ==
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype == 'application/vnd.ms-powerpoint' ||
      file.mimetype ==
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.mimetype == 'text/plain' ||
      file.mimetype == 'audio/mpeg' ||
      file.mimetype == 'audio/wav' ||
      file.mimetype == 'audio/webm' ||
      file.mimetype == 'audio/ogg' ||
      file.mimetype == 'video/mp4' ||
      file.mimetype == 'video/webm' ||
      file.mimetype == 'video/ogg'
    ) {
      cb(null, true)
    } else {
      cb(null, false)
      const err = new Error('File type ' + file.mimetype + ' is not allowed!')
      err.name = 'ExtensionError'
      return cb(err)
    }
  },
})
