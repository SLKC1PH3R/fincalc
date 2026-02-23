import { NextAuthOptions } from 'next-auth'
import crypto from 'crypto'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Placeholder used for OAuth users when password column is NOT NULL in DB
// They never log in via password so this value is never checked
const OAUTH_PASSWORD_PLACEHOLDER = '$2a$10$OAUTH.USER.NO.PASSWORD.PLACEHOLDER.HASH.UNUSED'

function robustAdapter() {
  const base = PrismaAdapter(prisma) as any

  return {
    ...base,

    createUser: async (data: any) => {
      // Try each approach from safest to most compatible with legacy DB schema
      const attempts = [
        // 1. Normal (schema up to date)
        () => prisma.user.create({ data }),
        // 2. Without image (column may not exist)
        () => { const { image, ...d } = data; return prisma.user.create({ data: d }) },
        // 3. Without image + null password (if column is nullable)
        () => { const { image, ...d } = data; return prisma.user.create({ data: { ...d, password: null } }) },
        // 4. Without image + placeholder password (if column is NOT NULL — legacy schema)
        () => { const { image, ...d } = data; return prisma.user.create({ data: { ...d, password: OAUTH_PASSWORD_PLACEHOLDER } }) },
        // 5. Raw SQL insert — absolute last resort
        () => prisma.$executeRaw`
          INSERT INTO "User" (id, email, name, "emailVerified", "createdAt", "updatedAt")
          VALUES (
            ${data.id ?? crypto.randomUUID()},
            ${data.email},
            ${data.name ?? null},
            ${data.emailVerified ?? null},
            NOW(), NOW()
          )
          ON CONFLICT (email) DO NOTHING
        `.then(() => prisma.user.findUnique({ where: { email: data.email } })),
      ]

      for (const attempt of attempts) {
        try {
          const result = await attempt()
          if (result) return result
        } catch (_e) {
          // continue to next attempt
        }
      }

      throw new Error('Impossible de créer le compte utilisateur. Vérifiez le schéma de la base de données.')
    },

    updateUser: async (data: any) => {
      const { id, image, ...rest } = data
      try {
        return await prisma.user.update({ where: { id }, data: { ...rest, image: image ?? undefined } })
      } catch (_e: any) {
        return await prisma.user.update({ where: { id }, data: rest })
      }
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: robustAdapter() as any,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.password) return null
        // Reject OAuth placeholder password
        if (user.password === OAUTH_PASSWORD_PLACEHOLDER) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 1. Autoriser automatiquement tous les comptes Google @gmail.com
      if (account?.provider === "google" && user.email?.endsWith("@gmail.com")) {
        return true
      }

      // 2. Si c’est Google mais pas @gmail.com → vérifier AllowedEmail
      if (account?.provider === "google") {
        const allowed = await prisma.allowedEmail.findUnique({
          where: { email: user.email! },
        })
        return !!allowed
      }

      // 3. Pour les Credentials → laisser NextAuth gérer
      return true
    },

    async jwt({ token, user, trigger, session }) {
      if (user) token.id = user.id
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name
        if (session.image !== undefined) token.picture = session.image
      }
      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        if (token.name) session.user.name = token.name as string
        if (token.picture) session.user.image = token.picture as string
      }
      return session
    },
  },
}
