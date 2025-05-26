import { TypeORMError } from 'typeorm'

export default function handleTypeOrmError(
  error: unknown,
  context: string
): never {
  if (error instanceof TypeORMError) {
    throw new Error(`${context} (TypeORM): ${error.message}`)
  } else if (error instanceof Error) {
    throw new Error(`${context}: ${error.message}`)
  } else {
    throw new Error(`${context}: ${String(error)}}`)
  }
}
