import axios from 'axios'
import * as z from 'zod'

const SERVER_ROOT = import.meta.env.VITE_SERVER_ROOT || 'http://localhost:3000'

const FetchUserInputSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(20, { error: 'Password must be at most 20 characters' }),
})
const FetchUserSuccessSchema = z.object({
  statusCode: z.number(),
  data: z.object({
    id: z.uuid(),
    username: z.string(),
    email: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().optional(),
    lastSeenAt: z
      .string()
      .transform((value) => new Date(value))
      .optional(),
    createdAt: z.string().transform((value) => new Date(value)),
  }),
  message: z.string(),
  success: z.literal(true),
})

const CreateUserInputSchema = z.object({
  username: z
    .string()
    .min(3, { error: 'Username must be at least 3 characters' })
    .max(50, { error: 'Username must be at most 50 characters' }),
  email: z.email(),
  password: z
    .string()
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(20, { error: 'Password must be at most 20 characters' }),
  displayName: z
    .string()
    .min(3, { error: 'Display name must be at least 3 characters' })
    .max(100, { error: 'Display name must be at most 100 characters' }),
  avatar: z
    .file()
    .max(10_000_000, { error: 'Avatar must be at most 10MB' })
    .nullable(),
})

const CreateUserOutputSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.email(),
  displayName: z.string(),
  avatarUrl: z.url(),
  lastSeenAt: z.string().transform((value) => new Date(value)),
  createdAt: z.string().transform((value) => new Date(value)),
})

const fetchUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  try {
    const inputResult = FetchUserInputSchema.safeParse({ email, password })
    if (!inputResult.success) {
      return {
        success: false,
        data: null,
        error: inputResult.error,
      }
    }
    const response = await axios.post(`${SERVER_ROOT}/login`, {
      email,
      password,
    })
    const result = FetchUserSuccessSchema.parse(response.data)
    return {
      success: true,
      data: {
        user: result.data,
        token: response.headers['authorization'],
      },
      error: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(z.prettifyError(error))
    }
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data.message ||
          'An error occurred while fetching user data'
      )
    }
    throw new Error(
      error instanceof Error ? error.message : 'An unknown error occurred'
    )
  }
}

const CreateNewUser = async ({
  username,
  email,
  password,
  displayName,
  avatar,
}: z.infer<typeof CreateUserInputSchema>) => {
  try {
    const inputResult = CreateUserInputSchema.safeParse({
      username,
      email,
      password,
      displayName,
      avatar,
    })
    if (!inputResult.success) {
      return {
        success: false,
        data: null,
        error: inputResult.error,
      }
    }
    const response = await axios.post(`${SERVER_ROOT}/register`, {
      username,
      email,
      password,
      displayName,
      avatar,
    })
    const result = CreateUserOutputSchema.parse(response.data)
    return {
      success: true,
      data: result,
      error: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(z.prettifyError(error))
    }
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data.message || 'An error occurred while creating user'
      )
    }
    throw new Error(
      error instanceof Error ? error.message : 'An unknown error occurred'
    )
  }
}

export { fetchUser, CreateNewUser }
