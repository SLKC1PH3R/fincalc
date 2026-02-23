import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Custom adapter that handles missing 'image' column gracefully
function safeAdapter() {
  const base = PrismaAdapter(prisma) as any

  return {
    ...base,
    createUser: async (data: any) => {
      // Try with image first, fall back without if column doesn't exist
      try {
        return await base.createUser(data)
      } catch (err: any) {
        if (err?.message?.includes('image') || err?.meta?.field_name === 'image') {
          const { image: _removed, ...dataWithoutImage } = data
          return await base.createUser(dataWithoutImage)
        }
        throw err
      }
    },
    updateUser: async (data: any) => {
      try {
        return await base.updateUser(data)
      } catch (err: any) {
        if (err?.message?.includes('image') || err?.meta?.field_name === 'image') {
          const { image: _removed, ...dataWithoutImage } = data
          return await base.updateUser(dataWithoutImage)
        }
        throw err
      }
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: safeAdapter() as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
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
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
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
