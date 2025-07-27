import * as React from 'react'
import * as z from 'zod'
import { useMutation } from '@tanstack/react-query'
import { CreateNewUser, fetchUser } from './utils/fetchs'

const userSchema = z.object({
  id: z.uuid(),
  username: z.string().min(3).max(100),
  email: z.email(),
  displayName: z.string().min(3).max(100),
  avatarUrl: z.url().optional(),
  lastSeenAt: z.date().optional(),
  createdAt: z.date(),
})
const AuthContextType = z.object({
  isAuthenticated: z.boolean().default(false),
  login: z.function({
    input: [z.email(), z.string().min(6).max(20)],
    output: z.void(),
  }),
  logout: z.function({
    input: [],
    output: z.void(),
  }),
  register: z.function({
    input: [z.string(), z.email(), z.string(), z.string(), z.file().nullable()],
    output: z.void(),
  }),
  user: userSchema.optional(),
  token: z.string().optional(),
})
export type AuthContextType = z.infer<typeof AuthContextType>

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const userKey = 'auth.user'
const tokenKey = 'auth.token'

const getStoredUser = () => {
  const user = localStorage.getItem(userKey)
  if (!user) return undefined
  return JSON.parse(user)
}
const setStoredUser = (user: z.infer<typeof userSchema> | undefined) => {
  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user))
  } else {
    localStorage.removeItem(userKey)
  }
}
const getAuthToken = () => {
  return localStorage.getItem(tokenKey) ?? undefined
}
const setAuthToken = (token: string | undefined) => {
  if (token) {
    localStorage.setItem(tokenKey, token)
  } else {
    localStorage.removeItem(tokenKey)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthContextType['user'] | undefined>(
    getStoredUser()
  )
  const [token, setToken] = React.useState<string | undefined>(getAuthToken())

  const loginMutation = useMutation({
    mutationFn: fetchUser,
  })

  const registerUserMutation = useMutation({
    mutationFn: CreateNewUser,
  })

  const isAuthenticated = React.useMemo(() => {
    return !!user && !!token
  }, [user, token])

  const login = React.useCallback(
    async (email: string, password: string) => {
      try {
        const response = await loginMutation.mutateAsync({ email, password })
        if (response.success == true) {
          if (!response.data?.user || !response.data?.token) {
            throw new Error('Login failed: User data or token is missing')
          }
          const userData = response.data.user
          setUser(userData)
          setStoredUser(userData)
          setToken(response.data.token)
          setAuthToken(response.data.token)
        }
        return response
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message)
        }
        throw new Error('An unknown error occurred during login')
      }
    },
    [loginMutation]
  )

  const logout = React.useCallback(() => {
    setUser(undefined)
    setStoredUser(undefined)
    setToken(undefined)
    setAuthToken(undefined)
  }, [])

  const register = React.useCallback(
    async (
      username: string,
      email: string,
      password: string,
      displayName: string,
      avatar: File | null
    ) => {
      try {
        const response = await registerUserMutation.mutateAsync({
          username,
          email,
          password,
          displayName,
          avatar,
        })
        return response
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(error.message)
        }
        throw new Error('An unknown error occurred during registration')
      }
    },
    [registerUserMutation]
  )

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, register, user, token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
