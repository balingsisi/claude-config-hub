import { NextAuthOptions, DefaultSession } from 'next-auth'
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async signIn({ user, account: _account, profile }) {
      if (!profile) return true

      // 使用类型断言访问 GitHub 特有属性
      const githubId = (profile as { id?: number }).id
      const githubLogin = (profile as { login?: string }).login

      if (!githubId) return true

      try {
        await db.user.findOrCreate(githubId.toString(), {
          name: user.name || undefined,
          email: user.email || undefined,
          image: user.image || undefined,
          login: githubLogin,
        })
      } catch (error) {
        console.error('Error syncing user to database:', error)
      }

      return true
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const githubId = (profile as { id?: number }).id
        const githubLogin = (profile as { login?: string }).login

        if (githubId) {
          token.githubId = githubId.toString()
          token.id = githubId.toString()
          token.login = githubLogin
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.login = token.login
      }
      return session
    },
  },
}
