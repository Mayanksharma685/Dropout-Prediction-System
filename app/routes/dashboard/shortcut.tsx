import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

type DummyStudent = {
  studentId: string
  name: string
  email: string
  department?: string
  currentSemester: number
  riskLevel: 'Low' | 'Medium' | 'High'
}

const DUMMY_STUDENTS: DummyStudent[] = [
  { studentId: 'STU001', name: 'Aarav Sharma', email: 'aarav@example.com', department: 'CSE', currentSemester: 3, riskLevel: 'Low' },
  { studentId: 'STU002', name: 'Isha Gupta', email: 'isha@example.com', department: 'ECE', currentSemester: 5, riskLevel: 'Medium' },
  { studentId: 'STU003', name: 'Rohan Verma', email: 'rohan@example.com', department: 'ME', currentSemester: 1, riskLevel: 'High' },
]

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  const kpi = {
    total: DUMMY_STUDENTS.length,
    high: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'High').length,
    medium: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'Medium').length,
    low: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'Low').length,
  }

  return c.render(
    <div class="min-h-screen bg-slate-50">
      <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr] gap-6">
          <Sidebar />
          <main class="space-y-8 p-4">
            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">Shortcut</h2>
              <p class="text-sm text-gray-600">Quick glance with dummy students data.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-3">
              <h3 class="text-sm font-semibold text-slate-700">Bulk Import Students (JSON)</h3>
              <p class="text-xs text-gray-600">Paste an array of student objects. Required: studentId, name, email, dob (YYYY-MM-DD), currentSemester. Optional: phone, department.</p>
              <textarea id="json-input" class="w-full border rounded p-2 font-mono text-xs h-40" placeholder='[
  { "studentId": "STU1001", "name": "Student Name", "email": "student@example.com", "dob": "2002-01-01", "currentSemester": 3, "department": "CSE", "phone": "9999999999" }
]'></textarea>
              <div class="flex items-center gap-2">
                <button id="start-import" class="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900">Start Import</button>
                <button id="clear-log" class="px-4 py-2 rounded border">Clear Log</button>
              </div>
              <div id="import-log" class="mt-2 text-xs space-y-1 max-h-48 overflow-auto bg-gray-50 rounded p-2 border"></div>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
              <h3 class="text-sm font-semibold text-slate-700">Related Entries (optional defaults)</h3>
              <p class="text-xs text-gray-600">These will be created automatically after each student. You can override per student by including an object like attendance/marks/fees/backlogs in each JSON item.</p>
              <div class="grid md:grid-cols-2 gap-4">
                <div class="space-y-2 border rounded p-3">
                  <div class="flex items-center gap-2">
                    <input id="create-attendance" type="checkbox" class="border rounded" />
                    <label for="create-attendance" class="text-sm font-medium text-slate-700">Create Attendance</label>
                  </div>
                  <div class="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <label class="block text-gray-700">Month</label>
                      <input id="att-month" class="mt-1 w-full border rounded p-2" type="month" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Attendance %</label>
                      <input id="att-percent" class="mt-1 w-full border rounded p-2" type="number" min="0" max="100" step="0.1" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 border rounded p-3">
                  <div class="flex items-center gap-2">
                    <input id="create-marks" type="checkbox" class="border rounded" />
                    <label for="create-marks" class="text-sm font-medium text-slate-700">Create Marks</label>
                  </div>
                  <div class="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label class="block text-gray-700">Subject</label>
                      <input id="marks-subject" class="mt-1 w-full border rounded p-2" type="text" placeholder="Maths" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Test Date</label>
                      <input id="marks-date" class="mt-1 w-full border rounded p-2" type="date" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Score</label>
                      <input id="marks-score" class="mt-1 w-full border rounded p-2" type="number" min="0" max="100" step="0.1" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 border rounded p-3">
                  <div class="flex items-center gap-2">
                    <input id="create-fees" type="checkbox" class="border rounded" />
                    <label for="create-fees" class="text-sm font-medium text-slate-700">Create Fees</label>
                  </div>
                  <div class="grid md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <label class="block text-gray-700">Due Date</label>
                      <input id="fees-due" class="mt-1 w-full border rounded p-2" type="date" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Paid Date</label>
                      <input id="fees-paid" class="mt-1 w-full border rounded p-2" type="date" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Status</label>
                      <select id="fees-status" class="mt-1 w-full border rounded p-2">
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-gray-700">Due Months</label>
                      <input id="fees-months" class="mt-1 w-full border rounded p-2" type="number" min="0" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 border rounded p-3">
                  <div class="flex items-center gap-2">
                    <input id="create-backlogs" type="checkbox" class="border rounded" />
                    <label for="create-backlogs" class="text-sm font-medium text-slate-700">Create Backlogs</label>
                  </div>
                  <div class="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label class="block text-gray-700">Subject</label>
                      <input id="backlog-subject" class="mt-1 w-full border rounded p-2" type="text" placeholder="Physics" />
                    </div>
                    <div>
                      <label class="block text-gray-700">Attempts</label>
                      <input id="backlog-attempts" class="mt-1 w-full border rounded p-2" type="number" min="0" />
                    </div>
                    <div class="flex items-center gap-2 mt-6">
                      <input id="backlog-cleared" type="checkbox" class="border rounded" />
                      <label for="backlog-cleared" class="text-gray-700">Cleared</label>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: "\n(function(){\n  var startBtn = document.getElementById('start-import');\n  var clearBtn = document.getElementById('clear-log');\n  var inputEl = document.getElementById('json-input');\n  var logEl = document.getElementById('import-log');\n  if (!startBtn || !inputEl || !logEl) return;\n\n  function log(line, cls){\n    var div = document.createElement('div');\n    if (cls) div.className = cls;\n    div.textContent = line;\n    logEl.appendChild(div);\n    logEl.scrollTop = logEl.scrollHeight;\n  }\n\n  function toFormData(obj){\n    var fd = new FormData();\n    if (obj.studentId) fd.set('studentId', String(obj.studentId));\n    if (obj.name) fd.set('name', String(obj.name));\n    if (obj.email) fd.set('email', String(obj.email));\n    if (obj.phone) fd.set('phone', String(obj.phone));\n    if (obj.dob) fd.set('dob', String(obj.dob));\n    if (obj.department) fd.set('department', String(obj.department));\n    if (obj.currentSemester != null) fd.set('currentSemester', String(obj.currentSemester));\n    return fd;\n  }\n\n  function getDefaults(){\n    var defs = { attendance:null, marks:null, fees:null, backlogs:null };\n    var el;\n    el = document.getElementById('create-attendance');\n    if (el && el.checked) {\n      defs.attendance = {\n        month: (document.getElementById('att-month') || {}).value || null,\n        attendancePercent: (document.getElementById('att-percent') || {}).value || null,\n      };\n    }\n    el = document.getElementById('create-marks');\n    if (el && el.checked) {\n      defs.marks = {\n        subject: (document.getElementById('marks-subject') || {}).value || null,\n        testDate: (document.getElementById('marks-date') || {}).value || null,\n        score: (document.getElementById('marks-score') || {}).value || null,\n      };\n    }\n    el = document.getElementById('create-fees');\n    if (el && el.checked) {\n      defs.fees = {\n        dueDate: (document.getElementById('fees-due') || {}).value || null,\n        paidDate: (document.getElementById('fees-paid') || {}).value || null,\n        status: (document.getElementById('fees-status') || {}).value || null,\n        dueMonths: (document.getElementById('fees-months') || {}).value || null,\n      };\n    }\n    el = document.getElementById('create-backlogs');\n    if (el && el.checked) {\n      defs.backlogs = {\n        subject: (document.getElementById('backlog-subject') || {}).value || null,\n        attempts: (document.getElementById('backlog-attempts') || {}).value || null,\n        cleared: (document.getElementById('backlog-cleared') || {}).checked || false,\n      };\n    }\n    return defs;\n  }\n\n  async function postAttendance(studentId, payload){\n    if (!payload) return;\n    var fd = new FormData();\n    fd.set('studentId', studentId);\n    if (payload.month) fd.set('month', payload.month);\n    if (payload.attendancePercent != null) fd.set('attendancePercent', String(payload.attendancePercent));\n    return fetch('/dashboard/attendance', { method: 'POST', body: fd });\n  }\n\n  async function postMarks(studentId, payload){\n    if (!payload) return;\n    var fd = new FormData();\n    fd.set('studentId', studentId);\n    if (payload.subject) fd.set('subject', payload.subject);\n    if (payload.testDate) fd.set('testDate', payload.testDate);\n    if (payload.score != null) fd.set('score', String(payload.score));\n    return fetch('/dashboard/marks', { method: 'POST', body: fd });\n  }\n\n  async function postFees(studentId, payload){\n    if (!payload) return;\n    var fd = new FormData();\n    fd.set('studentId', studentId);\n    if (payload.dueDate) fd.set('dueDate', payload.dueDate);\n    if (payload.paidDate) fd.set('paidDate', payload.paidDate);\n    if (payload.status) fd.set('status', payload.status);\n    if (payload.dueMonths != null) fd.set('dueMonths', String(payload.dueMonths));\n    return fetch('/dashboard/fees', { method: 'POST', body: fd });\n  }\n\n  async function postBacklogs(studentId, payload){\n    if (!payload) return;\n    var fd = new FormData();\n    fd.set('studentId', studentId);\n    if (payload.subject) fd.set('subject', payload.subject);\n    if (payload.attempts != null) fd.set('attempts', String(payload.attempts));\n    if (payload.cleared) fd.set('cleared', 'on');\n    return fetch('/dashboard/backlogs', { method: 'POST', body: fd });\n  }\n\n  async function importSequential(items){\n    var success = 0;\n    var failed = 0;\n    var defs = getDefaults();\n    for (var i = 0; i < items.length; i++) {\n      var s = items[i];\n      var idx = i + 1;\n      log('[' + idx + '/' + items.length + '] Creating ' + (s.name || s.studentId) + ' ...');\n      try {\n        var res = await fetch('/dashboard/student', { method: 'POST', body: toFormData(s) });\n        var ok = res.ok;\n        var url = res.url || '';\n        if (ok && url.indexOf('success=1') !== -1) {\n          success++;\n          log('  ✔ Success', 'text-emerald-700');\n          var studentId = s.studentId;\n          var att = s.attendance || defs.attendance;\n          var marks = s.marks || defs.marks;\n          var fees = s.fees || defs.fees;\n          var backs = s.backlogs || defs.backlogs;\n          if (att && att.month && att.attendancePercent != null) {\n            try { await postAttendance(studentId, att); log('    ↳ Attendance added'); } catch(e) { log('    ↳ Attendance failed', 'text-red-700'); }\n          }\n          if (marks && marks.subject && marks.testDate && marks.score != null) {\n            try { await postMarks(studentId, marks); log('    ↳ Marks added'); } catch(e) { log('    ↳ Marks failed', 'text-red-700'); }\n          }\n          if (fees && fees.dueDate && fees.status && fees.dueMonths != null) {\n            try { await postFees(studentId, fees); log('    ↳ Fees entry added'); } catch(e) { log('    ↳ Fees failed', 'text-red-700'); }\n          }\n          if (backs && backs.subject && backs.attempts != null) {\n            try { await postBacklogs(studentId, backs); log('    ↳ Backlog added'); } catch(e) { log('    ↳ Backlog failed', 'text-red-700'); }\n          }\n        } else {\n          failed++;\n          var text = '';\n          try { text = await res.text(); } catch(e) {}\n          log('  ✖ Failed (' + res.status + ')', 'text-red-700');\n          if (text) log('    ' + text.substring(0, 200));\n        }\n      } catch (e) {\n        failed++;\n        log('  ✖ Error: ' + (e && e.message ? e.message : String(e)), 'text-red-700');\n      }\n      await new Promise(function(r){ return setTimeout(r, 150); });\n    }\n    log('Done. Success: ' + success + ', Failed: ' + failed, failed ? 'text-amber-700' : 'text-emerald-700');\n  }\n\n  startBtn.addEventListener('click', function(){\n    var raw = inputEl.value.trim();\n    if (!raw) { log('Please paste JSON first.', 'text-amber-700'); return; }\n    var data;\n    try { data = JSON.parse(raw); } catch (e) { log('Invalid JSON: ' + e.message, 'text-red-700'); return; }\n    if (!Array.isArray(data)) { log('Top-level JSON must be an array of students.', 'text-amber-700'); return; }\n    var missing = data.filter(function(x){\n      return !(x && x.studentId && x.name && x.email && x.dob && (x.currentSemester != null));\n    });\n    if (missing.length) { log('Some entries are missing required fields. First invalid: ' + JSON.stringify(missing[0]).substring(0,200), 'text-amber-700'); return; }\n    importSequential(data);\n  });\n\n  if (clearBtn) clearBtn.addEventListener('click', function(){ logEl.innerHTML = ''; });\n})();\n"
      }} />
    </div>,
  )
})


