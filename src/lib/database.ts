import { prisma } from './prisma'

/**
 * 用户相关操作
 */
export const db = {
  // ========== 用户 ==========
  user: {
    findOrCreate: async (githubId: string, data: { name?: string; email?: string; image?: string; login?: string }) => {
      return prisma.user.upsert({
        where: { githubId },
        create: { githubId, ...data },
        update: data,
      })
    },

    findById: (id: string) => prisma.user.findUnique({ where: { id } }),

    findByGithubId: (githubId: string) => prisma.user.findUnique({ where: { githubId } }),
  },

  // ========== 模板 ==========
  template: {
    findAll: (status?: string) => {
      return prisma.template.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
      })
    },

    findBySlug: (slug: string) => {
      return prisma.template.findUnique({ where: { slug } })
    },

    incrementViews: async (id: string) => {
      return prisma.template.update({
        where: { id },
        data: { views: { increment: 1 } },
      })
    },

    incrementCopies: async (id: string) => {
      return prisma.template.update({
        where: { id },
        data: { copies: { increment: 1 } },
      })
    },

    create: (data: {
      slug: string
      name: string
      description: string
      content: string
      techStack: Record<string, unknown>
      category: string
      submittedBy?: string
    }) => {
      return prisma.template.create({ data })
    },

    updateStatus: (id: string, status: 'approved' | 'rejected') => {
      return prisma.template.update({
        where: { id },
        data: { status },
      })
    },
  },

  // ========== 收藏 ==========
  favorite: {
    findByUser: (userId: string) => {
      return prisma.favorite.findMany({
        where: { userId },
        include: { template: true },
        orderBy: { createdAt: 'desc' },
      })
    },

    toggle: async (userId: string, templateId: string) => {
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_templateId: { userId, templateId },
        },
      })

      if (existing) {
        await prisma.favorite.delete({
          where: { id: existing.id },
        })
        return { favorited: false }
      } else {
        await prisma.favorite.create({
          data: { userId, templateId },
        })
        return { favorited: true }
      }
    },

    isFavorited: (userId: string, templateId: string) => {
      return prisma.favorite.findUnique({
        where: {
          userId_templateId: { userId, templateId },
        },
      })
    },

    count: (templateId: string) => {
      return prisma.favorite.count({ where: { templateId } })
    },
  },

  // ========== 评分 ==========
  rating: {
    findByTemplate: (templateId: string) => {
      return prisma.rating.findMany({
        where: { templateId },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      })
    },

    getUserRating: (userId: string, templateId: string) => {
      return prisma.rating.findUnique({
        where: {
          userId_templateId: { userId, templateId },
        },
      })
    },

    upsert: async (userId: string, templateId: string, score: number) => {
      return prisma.rating.upsert({
        where: {
          userId_templateId: { userId, templateId },
        },
        create: { userId, templateId, score },
        update: { score },
      })
    },

    getAverage: (templateId: string) => {
      return prisma.rating.aggregate({
        where: { templateId },
        _avg: { score: true },
        _count: { score: true },
      })
    },
  },

  // ========== 评论 ==========
  comment: {
    findByTemplate: (templateId: string) => {
      return prisma.comment.findMany({
        where: { templateId },
        include: { user: { select: { name: true, image: true, login: true } } },
        orderBy: { createdAt: 'desc' },
      })
    },

    create: (userId: string, templateId: string, content: string) => {
      return prisma.comment.create({
        data: { userId, templateId, content },
        include: { user: { select: { name: true, image: true, login: true } } },
      })
    },

    count: (templateId: string) => {
      return prisma.comment.count({ where: { templateId } })
    },
  },
}
