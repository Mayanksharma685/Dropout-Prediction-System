import { createRoute } from 'honox/factory'
import Section from '@/components/landing-page/Section'
import FeatureCard from '@/components/landing-page/FeatureCard'
import { AuthModal } from '@/components/landing-page/AuthModal'
import LandingHeader from '@/components/landing-page/LandingHeader'

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const isAuthed = cookies.includes('auth=1')
  let teacher: any = null
  if (isAuthed) {
    const uid = cookies
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('uid='))
      ?.slice(4)
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
                <button class="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700" onclick="openModal('signup-modal')">Signup</button>
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
              <button class="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700" onclick="openModal('signup-modal')">Create account</button>
              <button class="px-5 py-3 rounded border hover:bg-gray-50" onclick="openModal('login-modal')">I already have an account</button>
            </div>
          </div>
        </Section>
      </main>

      <footer class="border-t py-8 text-center text-sm text-gray-600">
        <div class="max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} EduPulse — Built for PSID 25102
        </div>
      </footer>

      <AuthModal id="login-modal" title="Login">
        <form method="post" action="/dashboard/auth/login" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input class="mt-1 w-full border rounded p-2" type="email" name="email" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Password</label>
            <input class="mt-1 w-full border rounded p-2" type="password" name="password" required />
          </div>
          <div class="flex items-center justify-between">
            <a href="/dashboard/login" class="text-blue-600 hover:underline text-sm">Login with Google</a>
            <div class="flex gap-2">
              <button type="button" class="px-4 py-2 rounded border" onclick="closeModal('login-modal')">Cancel</button>
              <button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" type="submit">Login</button>
            </div>
          </div>
        </form>
      </AuthModal>

      <AuthModal id="signup-modal" title="Create your account">
        <form method="post" action="/dashboard/auth/signup" class="space-y-4">
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input class="mt-1 w-full border rounded p-2" type="text" name="name" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Department</label>
              <input class="mt-1 w-full border rounded p-2" type="text" name="department" />
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input class="mt-1 w-full border rounded p-2" type="email" name="email" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Phone</label>
              <input class="mt-1 w-full border rounded p-2" type="text" name="phone" />
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <input class="mt-1 w-full border rounded p-2" type="password" name="password" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input class="mt-1 w-full border rounded p-2" type="password" name="passwordConfirm" required />
            </div>
          </div>
          <p class="text-xs text-gray-500">By continuing you agree to our terms and privacy policy.</p>
          <div class="flex items-center justify-between">
            <a href="/dashboard/login" class="text-blue-600 hover:underline text-sm">Continue with Google</a>
            <div class="flex gap-2">
              <button type="button" class="px-4 py-2 rounded border" onclick="closeModal('signup-modal')">Cancel</button>
              <button class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" type="submit">Create account</button>
            </div>
          </div>
        </form>
      </AuthModal>

      <script dangerouslySetInnerHTML={{
        __html: `
function openModal(id){
  const el = document.getElementById(id); if(!el) return;
  el.classList.remove('hidden');
}
function closeModal(id){
  const el = document.getElementById(id); if(!el) return;
  el.classList.add('hidden');
}
`
      }} />
    </div>,
  )
})
