export interface CreateUserDTO {
  username: string
  email: string
  password: string
  displayName?: string
  avatarUrl?: string
}
export interface CreateUserResponseDTO {
  id: string
  username: string
  email: string
  passwordHash: string
  displayName?: string
  avatarUrl: string
  lastSeenAt: Date | null
  createdAt: Date
}
export interface UpdateUserDTO {
  username?: string
  email?: string
  password?: string
  displayName?: string
  avatarUrl?: string
}
export interface UpdateUserResponseDTO {
  id: string
  username: string
  email: string
  passwordHash: string
  displayName?: string
  avatarUrl: string
  lastSeenAt: Date
  createdAt: Date
}

export interface UserInfoDTO {
  id: string
  username: string
  email: string
  displayName?: string
  avatarUrl: string
  lastSeenAt: Date
  createdAt: Date
}

export interface UserLoginDTO {
  email: string
  password: string
}

export interface UserLoginResponseDTO {
  user: UserInfoDTO
  token: string
}
