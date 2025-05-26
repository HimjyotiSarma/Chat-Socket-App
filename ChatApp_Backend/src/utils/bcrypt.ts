import bcrypt from 'bcryptjs'

async function createPasswordHash(password: string) {
  try {
    const hash = await bcrypt.hash(password, 10)
    return hash
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Error Creating Password hash: ' + error.message)
    } else {
      throw new Error('Something went wrong when hashing password')
    }
  }
}

async function comparePassword(password: string, hash: string) {
  try {
    const match = await bcrypt.compare(password, hash)
    return match
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Error comparing password: ' + error.message)
    } else {
      throw new Error('Something went wrong when comparing password')
    }
  }
}

export { createPasswordHash, comparePassword }
