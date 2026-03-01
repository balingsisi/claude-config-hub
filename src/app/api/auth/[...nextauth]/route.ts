import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { db } from '@/lib/database'

// 扩展 session 类型以包含 GitHub 用户信息
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      login?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    login?: string
    githubId?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!profile) return true

      try {
        // 同步用户到数据库
        await db.user.findOrCreate(
          profile.id.toString(),
          {
            name: user.name || undefined,
            email: user.email || undefined,
            image: user.image || undefined,
            login: profile.login as string,
          }
        )
      } catch (error) {
        console.error('Error syncing user to database:', error)
        // 即使数据库同步失败，也允许登录
      }

      return true
    },
    async jwt({ token, account, profile }) {
      // 首次登录时保存用户信息
      if (account && profile) {
        token.githubId = profile.id.toString()
        token.id = profile.id.toString()
        token.login = profile.login
      }
      return token
    },
    async session({ session, token }) {
      // 将 token 中的信息添加到 session
      if (token && session.user) {
        session.user.id = token.id
        session.user.login = token.login
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
