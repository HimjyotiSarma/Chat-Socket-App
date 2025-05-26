class ApiError extends Error {
  statusCode: number
  message: string
  errors: string[]
  data: null
  success: boolean
  stack?: string | undefined
  constructor(
    statusCode: number = 500,
    message: string = 'Something went wrong',
    errors: string[] = [],
    stack: string = ''
  ) {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.success = false
    this.data = null
    this.errors = errors

    if (this.stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
export default ApiError
