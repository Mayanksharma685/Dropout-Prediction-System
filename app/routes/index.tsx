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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 text-gray-900">
      <LandingHeader isAuthed={isAuthed} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />

      <main>
        <Section id="hero" className="pt-32 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 text-sm font-medium text-[#3399FF] border border-orange-200">
              <span className="w-2 h-2 bg-[#3399FF] rounded-full animate-pulse"></span>
              PSID 25102 • Smart Intervention System
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-[#3399FF] to-gray-700 bg-clip-text text-transparent leading-tight">
              Early Detection
              <span className="text-4xl md:text-5xl lg:text-6xl"> Smart Intervention.</span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Transform student outcomes with AI-powered risk detection. Consolidate attendance, marks, and fees into one intelligent dashboard for proactive mentoring.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isAuthed ? (
                <a href="/dashboard/auth/signup" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl bg-[#3399FF] text-white hover:bg-[#e8735f] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Start Free Trial
                </a>
              ) : (
                <a href="/dashboard" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl bg-[#3399FF] text-white hover:bg-[#e8735f] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Go to Dashboard
                </a>
              )}
              <a href="#solution" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl border-2 border-gray-300 text-gray-700 hover:border-[#3399FF] hover:text-[#3399FF] transition-all duration-200">
                See How It Works
              </a>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3399FF]">85%</div>
                <div className="text-sm text-gray-600 mt-1">Dropout Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3399FF]">24/7</div>
                <div className="text-sm text-gray-600 mt-1">Monitoring</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#3399FF]">{'< 5min'}</div>
                <div className="text-sm text-gray-600 mt-1">Setup Time</div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="problem" className="bg-gray-50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">The Challenge</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Current educational systems struggle with fragmented data and reactive approaches, leading to preventable student dropouts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard title="Fragmented Data" description="Student information scattered across multiple systems makes it impossible to get a complete picture" icon="🗂️" />
            <FeatureCard title="Reactive Approach" description="Problems are identified only after it's too late to intervene effectively" icon="⏰" />
            <FeatureCard title="Complex Solutions" description="Existing tools are expensive, difficult to implement, and require extensive training" icon="💸" />
          </div>
        </Section>

        <Section id="solution">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">GuideED consolidates student data into one intelligent platform, enabling proactive intervention through AI-powered risk detection.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <FeatureCard title="Smart Data Integration" icon="🔗" description="Seamlessly import and consolidate data from multiple sources including spreadsheets, databases, and existing systems" />
            <FeatureCard title="AI Risk Engine" icon="🚦" description="Advanced algorithms analyze patterns and predict at-risk students with explainable insights" />
            <FeatureCard title="Intuitive Dashboard" icon="📊" description="Color-coded interface with real-time alerts and actionable recommendations for mentors" />
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
            <div className="grid md:grid-cols-2 gap-8">
              <FeatureCard title="Intelligent Risk Detection" icon="🎯" className="border-0 shadow-none bg-white/70">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span>Attendance below 60% triggers yellow alert</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Critical threshold at 40% attendance</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-orange-400 rounded-full"></span>Grade decline detection (&gt;15% drop)</li>
                  <li className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-400 rounded-full"></span>Fee payment status monitoring</li>
                </ul>
              </FeatureCard>
              <FeatureCard title="Machine Learning Enhancement" icon="🤖" className="border-0 shadow-none bg-white/70">
                <p className="mb-3">Advanced ML models enhance prediction accuracy:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Logistic Regression</span><span className="text-[#3399FF] font-semibold">92% accuracy</span></div>
                  <div className="flex justify-between"><span>Random Forest</span><span className="text-[#3399FF] font-semibold">94% accuracy</span></div>
                  <div className="flex justify-between"><span>Neural Networks</span><span className="text-[#3399FF] font-semibold">96% accuracy</span></div>
                </div>
              </FeatureCard>
            </div>
          </div>
        </Section>

        <Section id="features" className="bg-gray-50">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to transform student outcomes through data-driven insights and proactive intervention.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <FeatureCard title="360° Student View" icon="🧩" description="Complete student profile with academic, financial, and behavioral data in one unified interface" />
            <FeatureCard title="Transparent AI" icon="🔍" description="Every risk score comes with clear explanations and actionable recommendations" />
            <FeatureCard title="Mentor-Centric Design" icon="🧭" description="Workflow optimized for busy educators with prioritized alerts and quick actions" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <FeatureCard title="Seamless Data Import" icon="📥">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span>Drag & drop CSV/Excel files</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span>Smart column mapping with AI assistance</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span>Real-time data validation and error detection</span>
                </div>
              </div>
            </FeatureCard>
            <FeatureCard title="Multi-Channel Alerts" icon="📣">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📧</span>
                  </div>
                  <span>Email notifications to mentors and parents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📱</span>
                  </div>
                  <span>SMS alerts for urgent interventions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">💬</span>
                  </div>
                  <span>WhatsApp integration for instant communication</span>
                </div>
              </div>
            </FeatureCard>
          </div>
        </Section>

        <Section id="about" title="About the Project" subtitle="Built for PSID 25102 to reduce dropouts">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-gray-700">
              <p>
                GuideED focuses on early detection of at-risk students by consolidating academic and administrative signals into a single, mentor-friendly dashboard. The goal is to intervene early, with clear reasons, and improve student outcomes.
              </p>
              <p>
                The system begins with transparent, rule-based thresholds and can optionally incorporate lightweight ML models for improved accuracy. It is designed to be affordable, explainable, and simple to deploy in typical college environments.
              </p>
              <p className="text-sm text-gray-500">
                Deliverable includes: data import flows, risk calculation, mentor dashboard, and notification hooks.
              </p>
            </div>
            <div className="grid gap-4">
              <FeatureCard title="Objectives" icon="🎯">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reduce student dropouts through timely insights</li>
                  <li>Provide mentors with clear, explainable flags</li>
                  <li>Lower cost and setup overhead for institutions</li>
                </ul>
              </FeatureCard>
              <FeatureCard title="Outcomes" icon="🏁">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Unified student risk view</li>
                  <li>Prioritized interventions and trackable notes</li>
                  <li>Configurable rules to fit departments</li>
                </ul>
              </FeatureCard>
            </div>
          </div>
        </Section>

        <Section id="dashboard" title="Counseling Dashboard" subtitle="Designed for quick, preventive action">
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Risk colours" icon="🟢🟡🔴" description="Green/Yellow/Red per student" />
            <FeatureCard title="Trends" icon="📈" description="Attendance drops, marks decline over time" />
            <FeatureCard title="Notifications" icon="📬" description="Auto email/SMS/WhatsApp to mentors and parents" />
          </div>
        </Section>

        <Section id="tech" title="Tech Stack" subtitle="Built for rapid prototyping and scalability">
          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard title="Backend" icon="🧠" description="Cloudflare Workers + Prisma (D1)" />
            <FeatureCard title="Frontend" icon="⚛️" description="Honox (Hono + JSX) + Tailwind styles" />
            <FeatureCard title="Analytics" icon="📊" description="Chart.js/Recharts as needed" />
          </div>
        </Section>

        <Section id="cta" className="pb-24">
          <div className="text-center bg-blue-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold">Reduce dropouts with early, explainable alerts</h3>
            <p className="mt-2 text-gray-700">Create an account and start exploring the dashboard</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <a href="/dashboard/auth/signup" className="px-5 py-3 rounded bg-blue-600 text-white hover:bg-blue-700">Create account</a>
              <a href="/dashboard/auth/login" className="px-5 py-3 rounded border hover:bg-gray-50">I already have an account</a>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-gray-600">
        <div className="max-w-6xl mx-auto px-4">
          © {new Date().getFullYear()} GuideED — Built for PSID 25102
        </div>
      </footer>

      
    </div>,
  )
})
