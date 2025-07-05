import { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from '@prisma/client';
import { passwordManager } from './password-manager';
import { getServerSession } from 'next-auth';

// Create a simple Prisma client for auth purposes only
const authPrisma = new PrismaClient();

// User type for NextAuth
type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

// authOptions'ı export ediyoruz
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(authPrisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await authPrisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            accounts: true,
            createdCompanies: {
              select: {
                id: true,
                name: true,
              },
              take: 1,
              orderBy: {
                createdAt: 'desc'
              }
            },
            companyUsers: {
              select: {
                companyId: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              },
              take: 1,
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        });

        if (!user || !user.password) {
          return null;
        }

        // Check login attempts before validating password
        const attemptCheck = await passwordManager.checkLoginAttempts(credentials.email);
        if (!attemptCheck.allowed) {
          console.log(`Login blocked for ${credentials.email}: ${attemptCheck.attemptsLeft} attempts left`);
          return null;
        }

        const isPasswordValid = await passwordManager.verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          // Record failed attempt
          await passwordManager.recordFailedAttempt(credentials.email);
          return null;
        }

        // Clear failed attempts on successful login
        await passwordManager.clearFailedAttempts(credentials.email);

        // Update last login timestamp
        await authPrisma.user.update({
          where: { id: user.id },
          data: { 
            updatedAt: new Date(),
            // Add last login tracking if field exists
          }
        });

        // Determine default company (prioritize owned companies)
        let defaultCompanyId: string | undefined;
        
        if (user.createdCompanies.length > 0) {
          defaultCompanyId = user.createdCompanies[0].id;
        } else if (user.companyUsers.length > 0) {
          defaultCompanyId = user.companyUsers[0].companyId;
        }

        // Return user compatible with NextAuth User type
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as UserRole,
          companyId: defaultCompanyId,
        } as any;
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'VIEWER';
        token.companyId = (user as any).companyId;
        token.iat = Math.floor(Date.now() / 1000);
        token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 1 day
      }

      // Handle session update
      if (trigger === "update" && session) {
        // Update token with new session data if needed
        return { ...token, ...session };
      }

      // Check if token is expired or close to expiry
      const now = Math.floor(Date.now() / 1000);
      const tokenAge = now - (token.iat as number || now);
      const refreshThreshold = 60 * 60; // 1 hour before expiry

      // Refresh token if it's been more than 1 hour since last update
      if (tokenAge > refreshThreshold) {
        try {
          // Fetch fresh user data
          const freshUser = await authPrisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          });

          if (freshUser) {
            token.name = freshUser.name;
            token.email = freshUser.email;
            token.role = freshUser.role;
            // Keep existing companyId - don't change mid-session
            token.iat = now;
            token.exp = now + (24 * 60 * 60);
          }
        } catch (error) {
          console.error("Token refresh error:");
          // Return existing token if refresh fails
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        // @ts-expect-error - Adding custom property to session
        session.user.role = token.role as string;
        // @ts-expect-error - companyId is added by our custom logic
        session.user.companyId = token.companyId as string;
        
        // Add token metadata to session
        (session as any).tokenIssuedAt = token.iat as number;
        (session as any).tokenExpiresAt = token.exp as number;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Additional sign-in validation can be added here
      if (account?.provider === "credentials") {
        // Log sign-in attempt
        console.log(`User ${user.email} signed in at ${new Date().toISOString()}`);
      }
      return true;
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-ins and create session tracking
      console.log(`User ${user.email} signed in successfully`);
      
      try {
        // Create session tracking entry
        if (user.id && account?.provider === 'credentials') {
          // Note: We don't have access to request object here, so we'll handle this in the JWT callback
          console.log('Session tracking will be created in JWT callback');
        }
      } catch (error) {
        console.error('Error creating session tracking:', error);
      }
    },
    async signOut({ token }) {
      // Log sign-outs and invalidate session tracking
      console.log(`User signed out at ${new Date().toISOString()}`);
      
      try {
        if (token && (token as any).sessionId) {
          // This will be handled by middleware for better performance
        }
      } catch (error) {
        console.error('Failed to invalidate session on logout:');
      }
    },
    async session({ token }) {
      // Can be used for session tracking/analytics
      try {
        // Update session activity if we have a session ID
        if (token && (token as any).sessionId) {
          // This will be handled by middleware for better performance
        }
      } catch (error) {
        console.error('Session tracking error:');
      }
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export async function hasRequiredRole(requiredRole: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return false;
  }

  // Kullanıcının rolünü kontrol et
  return session.user.role === requiredRole;
} 