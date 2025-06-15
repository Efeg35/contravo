import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    companyId?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      companyId?: string
    }
    tokenIssuedAt?: number
    tokenExpiresAt?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    companyId?: string
    iat?: number
    exp?: number
  }
} 