# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**Claude Config Hub** is a planned three-phase project to build tools that help developers configure Claude Code's `CLAUDE.md` memory system. This repository contains the complete documentation, planning, and architecture for the project.

**Note**: This is a documentation repository only. There is no source code here yet - the project is in the planning phase.

---

## Quick Start: Understanding This Project

1. **Read First**: `documentation-index.md` (5 min) - Complete guide to all documents
2. **Core Plan**: `claude-config-hub-integrated-plan.md` (15 min) - The three-phase strategy
3. **Implementation**: `three-phase-implementation-plan.md` (20 min) - 13-month timeline
4. **Technical**: `technical-architecture.md` (30 min) - Tech stack and architecture

---

## Three-Phase Product Vision

### Phase 1: Template Library (Months 1-4)
- Static website showcasing 50+ curated `CLAUDE.md` templates
- Search, browse, and copy templates for different project types
- User authentication, favorites, and community features
- **Tech Stack**: Next.js 14 (SSG), Vercel, shadcn/ui, JSON files

### Phase 2: Config Evaluator (Months 5-9)
- AI-powered project analysis and template matching
- Automatic `CLAUDE.md` generation based on project analysis
- Quality scoring and improvement suggestions
- **Tech Stack**: Next.js 14 (SSR), tRPC, Supabase, Upstash Redis, Stripe

### Phase 3: Team Collaboration (Months 10-13)
- Team workspace for sharing configurations
- Version control and rollout of config updates
- Enterprise SSO, audit logs, and admin controls
- **Tech Stack**: Distributed architecture, microservices, enterprise integrations

---

## Key Architecture Principles

1. **Progressive Evolution**: Each phase builds on the previous one, minimizing rewrites (>70% code reuse)
2. **Start Simple, Scale Smart**: Phase 1 uses simple static files; Phase 3 handles enterprise scale
3. **Cost-Effective**: Phase 1-2 uses free tiers (Vercel Hobby, Supabase Free)
4. **Performance First**: Global CDN, static generation where possible, Redis caching

---

## Documentation Structure

```
claude-config-hub/
├── 📘 Core Documents (read in order)
│   ├── claude-config-hub-integrated-plan.md      # Three-phase strategy and rationale
│   ├── three-phase-implementation-plan.md        # Detailed 13-month timeline
│   ├── technical-architecture.md                # Tech stack and architecture decisions
│   └── task-checklist.md                        # Week-by-week task list
│
├── 📖 Reference Documents
│   ├── direction-1-template-library.md          # Phase 1 details
│   ├── direction-2-config-evaluator.md          # Phase 2 details
│   ├── direction-3-team-collaboration.md        # Phase 3 details
│   └── claude-memory-system-evaluation.md       # Why this approach was chosen
│
└── 📄 Original Documents (may be outdated)
    ├── claude-memory-system-prd.md               # Original PRD
    └── claude-memory-system-design.md           # Original design
```

---

## Working with This Repository

### When Asked About the Project
- The repository is in Chinese (中文) with technical terms in English
- Refer to `documentation-index.md` for guidance on which document to consult
- The integrated plan document explains the three-phase approach and why it was chosen

### When Asked to Start Development
1. **Phase 1 is the starting point** - it validates market need
2. Refer to `task-checklist.md` for Week 1-4 tasks
3. Use `technical-architecture.md` for tech stack guidance (Next.js 14, TypeScript, Tailwind, shadcn/ui)
4. Key decision: Start with static site generation (SSG), not SSR

### When Updating Documentation
- Keep documents in sync with project progress
- Update `task-checklist.md` weekly with completed tasks
- Document architecture decisions in `technical-architecture.md`

---

## Key Decisions & Trade-offs

### Why Three Phases?
- **Risk Mitigation**: Validate market before building complex AI features
- **Learning**: Learn from real users before investing in advanced features
- **Resource Efficiency**: Side-project friendly (10-15 hours/week)

### Why Next.js 14?
- App Router for server components
- Built-in API routes eliminate need for separate backend
- Vercel deployment is free and seamless
- Strong community and shadcn/ui ecosystem

### Why Start with Static Site?
- Zero hosting costs (Vercel Hobby)
- Fastest time to market
- Easier to maintain
- Can migrate to database when needed (Phase 2)

### Why Not Build All Phases at Once?
- Building Phase 3 features upfront would take 6+ months
- High risk of building features nobody wants
- Phase 1 revenue can fund Phase 2 development
- Allows iteration based on real user feedback

---

## Technology Choices (Phase 1)

```yaml
Frontend:
  - Next.js 14 (App Router, Server Components)
  - TypeScript 5.9+ (strict mode)
  - Tailwind CSS 4.0
  - shadcn/ui (components)
  - Framer Motion (animations)

Data:
  - JSON files (in repository)
  - Vercel Blob Storage (optional for images)

Auth:
  - NextAuth.js (GitHub OAuth only)

Deployment:
  - Vercel (Hobby plan - free)

Development:
  - pnpm (package manager)
  - ESLint + Prettier
  - Vitest (testing)
  - Playwright (E2E)
```

---

## Common Questions

**Q: Why is everything in Markdown?**
A: This is a planning repository. Actual development hasn't started. The markdown documents serve as the complete blueprint for implementation.

**Q: Should I implement Phase 2 features first?**
A: No. Phase 1 is critical for validation. Without users and templates, the AI analysis in Phase 2 has nothing to work with. Follow the sequence.

**Q: Can I skip directly to Phase 3?**
A: Not recommended. Phase 3 requires:
- Template library from Phase 1
- User base and feedback from Phase 1-2
- Technical foundation from Phase 2
- Revenue to cover infrastructure costs

**Q: What if Phase 1 fails?**
A: That's valuable information. If users don't want templates, they probably won't want AI analysis either. Fail fast, learn, and pivot.

---

## File Naming Conventions

All files use kebab-case (`claude-config-hub-integrated-plan.md`), not snake_case or camelCase. This is a deliberate choice for web hosting compatibility.

---

## Document Maintenance

When updating project status:
1. Update `task-checklist.md` with completed tasks
2. Adjust timelines in `three-phase-implementation-plan.md` if needed
3. Document new technical decisions in `technical-architecture.md`
4. Keep `documentation-index.md` as the source of truth for document status

---

## Project Status

**Current State**: Planning Phase (Pre-Development)
**Next Milestone**: Week 1 of Phase 1 - Project scaffolding and first template
**Expected Launch**: Phase 1 MVP in ~4 months from start date
