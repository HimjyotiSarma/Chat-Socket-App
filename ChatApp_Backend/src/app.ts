import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { createClient } from 'redis'
import { createAdapter } from '@socket.io/redis-adapter'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { TypedIOServer } from './Types/SocketTypes'
import { attachUserData } from './middlewares/socket/auth.socket.middleware'

// import controllers
import SocketController from './controllers/utils/Socket.controller'
import MessageController from './controllers/Message.controller'
import ThreadController from './controllers/Thread.controller'
import WebSocketController from './controllers/Websocket.controller'

console.log('COOKIE SECRET: ', process.env.COOKIE_SECRET)

const app = express()
const httpServer = createServer(app)
const io: TypedIOServer = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})

// Connect to Redis and set up Socket.IO adapter
;(async () => {
  const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  })
  const subClient = pubClient.duplicate()
  await Promise.all([pubClient.connect(), subClient.connect()])
  io.adapter(createAdapter(pubClient, subClient))
})()

io.use(attachUserData)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(helmet())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(express.static('public'))

app.use((req, res, next) => {
  console.log('Incoming Request Body:', req.body)
  next()
})
app.use((req, res, next) => {
  console.log('Incoming Cookies:', req.cookies)
  console.log('Incoming Signed Cookies:', req.signedCookies)
  next()
})

// Add Middlewares

// Add Socket Connection
const SOCKET_CONTROLLERS: Array<typeof SocketController> = [
  MessageController,
  ThreadController,
]

io.on('connection', async (socket) => {
  // Add web session connection with db sync here
  const websocket = new WebSocketController(
    socket.id,
    socket.data.userId,
    socket.data.username
  )
  await websocket.connect()

  socket.join(`user-${socket.data.userId}`)

  for (const controller of SOCKET_CONTROLLERS) {
    const instance = new controller(io, socket)
    await instance.register()
  }
  socket.on('disconnect', () => {
    websocket.disconnect()
  })
})
// Add Routes
import authRouter from './routes/auth.route'
app.use('/api/v1/auth', authRouter)
import attachmentRouter from './routes/attachments.route'
app.use('/api/v1/attachments', attachmentRouter)

// Handle Errors in Routes
import errorHandler from './utils/errorHandler'

app.use(errorHandler)

export { app as default, httpServer as server }
