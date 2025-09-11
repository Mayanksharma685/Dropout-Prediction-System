import { createRoute } from 'honox/factory'
import Section from '@/components/landing-page/Section'
import FeatureCard from '@/components/landing-page/FeatureCard'
import LandingHeader from '@/components/landing-page/LandingHeader'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const isAuthed = cookies.includes('auth=1')
  let teacher: any = null
  if (isAuthed) {
    const uidRaw = cookies
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('uid='))
      ?.slice(4)
    const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
    if (uid) {
      const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
      teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })
    }
  }

  return c.render(
    <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <LandingHeader isAuthed={isAuthed} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />

      <main>
        <Section id="hero" class="pt-24 pb-20">
          <div class="text-center max-w-3xl mx-auto">
            <p class="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">PSID 25102</p>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
              Early detection of at-risk students. Actionable, affordable, explainable.
            </h1>
            <p class="mt-4 text-gray-600 md:text-lg">
              Attendance, marks, fees—consolidated into one simple dashboard so mentors can intervene early and reduce dropouts.
            </p>
            <div class="mt-8 flex items-center justify-center gap-3">
              {!isAuthed ? (
                <a href="/dashboard/auth/signup" class="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">Signup</a>
              ) : (
                <a href="/dashboard" class="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">Dashboard</a>
              )}
              <a href="#solution" class="px-5 py-3 rounded border hover:bg-gray-50">See how it works</a>
            </div>
          </div>
        </Section>

        <Section id="problem" title="Problem" subtitle="Why current systems fail mentors">
          <div class="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Data silos" description="Attendance, tests, fees live separately" icon="🗂️" />
            <FeatureCard title="Late realization" description="Issues found only after final marks" icon="⏰" />
            <FeatureCard title="High cost" description="Tools are expensive and complex" icon="💸" />
          </div>
        </Section>

        <Section id="solution" title="Proposed Solution" subtitle="Consolidated, simple, transparent">
          <div class="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Data Integration" icon="🔗" description="Import Sheets/CSV for Attendance, Marks, Fees" />
            <FeatureCard title="Risk Engine" icon="🚦" description="Explainable rules + optional ML for accuracy" />
            <FeatureCard title="Mentor Workflow" icon="📊" description="Color-coded list, trends, and notifications" />
          </div>
          <div class="mt-8 grid md:grid-cols-2 gap-5">
            <FeatureCard title="Rule-based thresholds" icon="✅">
              <ul class="list-disc pl-5 space-y-1">
                <li>Attendance &lt; 60% → yellow; &lt; 40% → red</li>
                <li>Marks drop &gt; 15% vs last 2 tests</li>
                <li>More than 2 failed attempts in a subject</li>
                <li>Fee unpaid &gt; 1 month</li>
              </ul>
            </FeatureCard>
            <FeatureCard title="Optional ML (demo)" icon="🤖">
              <p>Logistic Regression / Random Forest on features: attendance, marks trend, backlogs, fee status.</p>
            </FeatureCard>
          </div>
        </Section>

        <Section id="features" title="Features" subtitle="What makes EduPulse effective">
          <div class="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Unified Student View" icon="🧩" description="Attendance, marks, fees in one place" />
            <FeatureCard title="Explainable Risk Scores" icon="🔍" description="Clear, rule-based flags with reasons" />
            <FeatureCard title="Mentor-first Workflow" icon="🧭" description="Prioritized list, trends and next actions" />
          </div>
          <div class="mt-8 grid md:grid-cols-2 gap-5">
            <FeatureCard title="Easy Imports" icon="📥">
              <ul class="list-disc pl-5 space-y-1">
                <li>Upload CSV/Sheets for attendance, marks, fees</li>
                <li>Map columns quickly with smart defaults</li>
                <li>Validate data quality before saving</li>
              </ul>
            </FeatureCard>
            <FeatureCard title="Actionable Alerts" icon="📣">
              <ul class="list-disc pl-5 space-y-1">
                <li>Email/SMS/WhatsApp to mentors and parents</li>
                <li>Color-coded urgency levels</li>
                <li>One-click notes and follow-ups</li>
              </ul>
            </FeatureCard>
          </div>
        </Section>

        <Section id="about" title="About the Project" subtitle="Built for PSID 25102 to reduce dropouts">
          <div class="grid md:grid-cols-2 gap-8 items-start">
            <div class="space-y-4 text-gray-700">
              <p>
                EduPulse focuses on early detection of at-risk students by consolidating academic and administrative signals into a single, mentor-friendly dashboard. The goal is to intervene early, with clear reasons, and improve student outcomes.
              </p>
              <p>
                The system begins with transparent, rule-based thresholds and can optionally incorporate lightweight ML models for improved accuracy. It is designed to be affordable, explainable, and simple to deploy in typical college environments.
              </p>
              <p class="text-sm text-gray-500">
                Deliverable includes: data import flows, risk calculation, mentor dashboard, and notification hooks.
              </p>
            </div>
            <div class="grid gap-4">
              <FeatureCard title="Objectives" icon="🎯">
                <ul class="list-disc pl-5 space-y-1">
                  <li>Reduce student dropouts through timely insights</li>
                  <li>Provide mentors with clear, explainable flags</li>
                  <li>Lower cost and setup overhead for institutions</li>
                </ul>
              </FeatureCard>
              <FeatureCard title="Outcomes" icon="🏁">
                <ul class="list-disc pl-5 space-y-1">
                  <li>Unified student risk view</li>
                  <li>Prioritized interventions and trackable notes</li>
                  <li>Configurable rules to fit departments</li>
                </ul>
              </FeatureCard>
            </div>
          </div>
        </Section>

        <Section id="dashboard" title="Counseling Dashboard" subtitle="Designed for quick, preventive action">
          <div class="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Risk colours" icon="🟢🟡🔴" description="Green/Yellow/Red per student" />
            <FeatureCard title="Trends" icon="📈" description="Attendance drops, marks decline over time" />
            <FeatureCard title="Notifications" icon="📬" description="Auto email/SMS/WhatsApp to mentors and parents" />
          </div>
        </Section>

        <Section id="tech" title="Tech Stack" subtitle="Built for rapid prototyping and scalability">
          <div class="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Backend" icon="🧠" description="Cloudflare Workers + Prisma (D1)" />
            <FeatureCard title="Frontend" icon="⚛️" description="Honox (Hono + JSX) + Tailwind styles" />
            <FeatureCard title="Analytics" icon="📊" description="Chart.js/Recharts as needed" />
          </div>
        </Section>

        <Section id="cta" class="pb-24">
          <div class="text-center bg-blue-50 rounded-xl p-8">
            <h3 class="text-2xl font-bold">Reduce dropouts with early, explainable alerts</h3>
            <p class="mt-2 text-gray-700">Create an account and start exploring the dashboard</p>
            <div class="mt-6 flex items-center justify-center gap-3">
              <a href="/dashboard/auth/signup" class="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">Create account</a>
              <a href="/dashboard/auth/login" class="px-5 py-3 rounded border hover:bg-gray-50">I already have an account</a>
            </div>
          </div>
        </Section>
      </main>

      <footer class="border-t py-8 text-center text-sm text-gray-600">
        <div class="max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} EduPulse — Built for PSID 25102
        </div>
      </footer>

      
    </div>,
  )
})
