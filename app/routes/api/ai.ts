import { createRoute } from 'honox/factory'

// Simple AI endpoint: accepts { question }, fetches some DB context, calls Gemini, returns answer
export const POST = createRoute(async (c) => {
  try {
    const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
    const { question } = await c.req.json<{ question?: string }>().catch(() => ({} as any))
    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Missing question' }, 400)
    }

    // Minimal context: counts and recent items to ground the model
    const [studentCount, recentRisks, recentFees] = await Promise.all([
      prisma.student.count(),
      prisma.riskFlag.findMany({ orderBy: { flagDate: 'desc' }, take: 5 }),
      prisma.feePayment.findMany({ orderBy: { dueDate: 'desc' }, take: 5 }),
    ])

    const systemPrompt = `You are EduPulse, an assistant for a student analytics dashboard.
You answer questions using the provided database context. If the answer isn't in context, say so and suggest where to look in the dashboard.
Be concise and accurate.`

    const context = {
      summary: {
        studentCount,
      },
      recentRisks,
      recentFees,
    }

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `Context (JSON):\n${JSON.stringify(context, null, 2)}` },
            { text: `Question: ${question}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }

    const apiKey = (c.env as any).GEMINI_API_KEY as string | undefined
    if (!apiKey) return c.json({ error: 'Missing GEMINI_API_KEY' }, 500)

    const model = 'gemini-1.5-flash'
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      return c.json({ error: 'Gemini request failed', details: errText }, 502)
    }
    const data: any = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No answer generated.'

    return c.json({ answer: text, context })
  } catch (err: any) {
    return c.json({ error: 'Unexpected error', details: String(err?.message || err) }, 500)
  }
})


