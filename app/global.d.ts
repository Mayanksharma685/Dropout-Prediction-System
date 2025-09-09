import type {} from 'hono'
import { PrismaClient } from '@prisma/client'

type Head = {
  title?: string
}

declare module 'hono' {
  interface Variables {
    prisma: PrismaClient
  }
  interface Bindings {
    DB: D1Database
    GOOGLE_CLIENT_ID: string
    GOOGLE_CLIENT_SECRET: string
    GOOGLE_REDIRECT_URI: string
    GEMINI_API_KEY: string
  }
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>
  }
}
