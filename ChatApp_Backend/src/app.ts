import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io: TypedIOServer = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})

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
app.use(express.static('public'))

// Add Middlewares

// Add Socket Connection

io.on('connection', (socket) => {
  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

app.get('/', (req, res) => {
  res.send('Hello World')
})

// Handle Errors in Routes
import errorHandler from './utils/errorHandler'
import { TypedIOServer } from './Types/SocketTypes'
import { attachUserData } from './middlewares/socket/auth.socket.middleware'
app.use(errorHandler)

export { app as default, httpServer as server }
