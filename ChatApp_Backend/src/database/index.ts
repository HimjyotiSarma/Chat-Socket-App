// To Generate Migration:
// npm typeorm migration:generate src/database/migrations/create-users-migration
// To Run Migration:
// npm typeorm migration:run
// To Revert Migration:
// npm typeorm migration:revert
// To Drop Entire migration:
// npm typeorm schema:drop

import { AppDataSource } from './data-source'

const connectDB = async () => {
  try {
    await AppDataSource.initialize()
    console.log('Database Connected Successfully')
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
    throw new Error('Database Connection Failed')
  }
}
export default connectDB
