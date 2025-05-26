import './src/config/loadEnv'
import { createPasswordHash } from './src/utils/bcrypt'
// import path from 'path'
// console.log('NODE_ENV : ', process.env.NODE_ENV)
// console.log('ORIGIN DETAIL : ', process.env.CORS_ORIGIN)
// console.log('PORT : ', process.env.PORT)
import app, { server } from './src/app'
import connectDB from './src/database'

server.listen(process.env.PORT, async () => {
  try {
    await connectDB()

    console.log(`Server is running on port ${process.env.PORT}`)
  } catch (error) {
    console.log(error)
  }
})
