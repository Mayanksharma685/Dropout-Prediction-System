import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const RiskFlagFormSchema = z.object({
  studentId: z.string().min(1),
  riskLevel: z.enum(['Low', 'Medium', 'High']),
  reason: z.string().min(1),
  flagDate: z.string().min(1),
})

export default createRoute(async (c) => {
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })

  const url = new URL(c.req.url)
  const success = url.searchParams.get('success')
  const error = url.searchParams.get('error')

  const students = await prisma.student.findMany({
    where: { teacherId: uid },
    orderBy: { name: 'asc' },
    take: 500,
  })

  const flags = await prisma.riskFlag.findMany({
    where: { student: { teacherId: uid } },
    include: { student: true },
    orderBy: { flagDate: 'desc' },
    take: 500,
  })

  return c.render(
    <div class="min-h-screen bg-slate-50">
      
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          <main class="space-y-8 p-4">
            {(success || error) && (
              <div id="toast" class={`fixed right-4 top-4 z-50 rounded-md border px-4 py-3 shadow-sm ${
                success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div class="text-sm font-medium">
                  {success ? 'Risk flag added' : error || 'Failed to add risk flag'}
                </div>
              </div>
            )}

            {(success || error) && (
              <script dangerouslySetInnerHTML={{
                __html: `
setTimeout(() => {
  const el = document.getElementById('toast');
  if (el) el.style.display = 'none';
  const url = new URL(window.location.href);
  url.searchParams.delete('success');
  url.searchParams.delete('error');
  window.history.replaceState({}, document.title, url.toString());
}, 2500);
`
              }} />
            )}

            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">Risk Flags</h2>
              <p class="text-sm text-gray-600">Log and review student risk flags.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Risk Flag</h3>
              <form method="post" class="grid md:grid-cols-4 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700">Student</label>
                  <select name="studentId" class="mt-1 w-full border rounded p-2" required>
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option value={s.studentId}>{s.name} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Risk Level</label>
                  <select name="riskLevel" class="mt-1 w-full border rounded p-2" required>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Date</label>
                  <input class="mt-1 w-full border rounded p-2" type="date" name="flagDate" required />
                </div>
                <div class="md:col-span-4">
                  <label class="block text-sm font-medium text-gray-700">Reason</label>
                  <input class="mt-1 w-full border rounded p-2" type="text" name="reason" required />
                </div>
                <div class="md:col-span-4">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#3399FF'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 class="text-sm font-semibold text-slate-700">Recent Flags</h3>
                <div class="relative">
                  <input 
                    type="text" 
                    id="studentSearch" 
                    placeholder="Search by Student ID, Name, Risk Level, Alert Status, or Reason" 
                    class="pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
                    oninput="filterRiskFlagsBySearch(this.value)"
                  />
                  <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              {flags.length === 0 ? (
                <p class="text-sm text-gray-600">No entries yet.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-gray-50 text-gray-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Level</th>
                        <th class="px-4 py-3">Alert</th>
                        <th class="px-4 py-3">Date</th>
                        <th class="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map((f) => {
                        // Determine colors based on risk level
                        const getRiskLevelStyles = (level: string) => {
                          switch (level.toLowerCase()) {
                            case 'high':
                            case 'red':
                              return {
                                badge: 'bg-red-100 text-red-800 border border-red-200',
                                dot: 'bg-red-500'
                              }
                            case 'medium':
                            case 'yellow':
                              return {
                                badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                                dot: 'bg-yellow-500'
                              }
                            case 'low':
                            case 'green':
                              return {
                                badge: 'bg-green-100 text-green-800 border border-green-200',
                                dot: 'bg-green-500'
                              }
                            default:
                              return {
                                badge: 'bg-gray-100 text-gray-800 border border-gray-200',
                                dot: 'bg-gray-500'
                              }
                          }
                        }
                        
                        const styles = getRiskLevelStyles(f.riskLevel)
                        
                        // Check if this is a high risk flag for alert
                        const isHighRisk = f.riskLevel.toLowerCase() === 'high' || f.riskLevel.toLowerCase() === 'red'
                        
                        return (
                          <tr class="border-t hover:bg-gray-50/60">
                            <td class="px-4 py-3">
                              <div class="font-medium text-slate-900">{f.student.name}</div>
                              <div class="text-xs text-gray-500">{f.studentId}</div>
                            </td>
                            <td class="px-4 py-3">
                              <div class="flex items-center gap-2">
                                <div class={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                                  {f.riskLevel}
                                </span>
                              </div>
                            </td>
                            <td class="px-4 py-3">
                              {isHighRisk ? (
                                <div class="flex items-center gap-2">
                                  <div class="relative">
                                    <svg class="w-5 h-5 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                                  <button 
                                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 transition-colors cursor-pointer"
                                    onclick={`openAlertModal('${f.studentId}', '${f.student.name}', '${f.riskLevel}', '${f.reason}', '${new Date(f.flagDate).toLocaleDateString()}', '${f.student.parentName || 'N/A'}', '${f.student.parentPhone || 'N/A'}', '${f.student.parentEmail || 'N/A'}')`}
                                  >
                                    HIGH ALERT
                                  </button>
                                </div>
                              ) : (
                                <div class="flex items-center gap-2">
                                  <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                  </svg>
                                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    NORMAL
                                  </span>
                                </div>
                              )}
                            </td>
                            <td class="px-4 py-3">
                              <div class="text-sm text-slate-700">
                                {new Date(f.flagDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td class="px-4 py-3">
                              <div class="text-sm text-slate-700 max-w-xs truncate" title={f.reason}>
                                {f.reason}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* High Alert Modal */}
            <div id="alertModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
              <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                  {/* Modal Header */}
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-red-100 rounded-full">
                        <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-red-800">High Risk Alert</h3>
                        <p class="text-sm text-gray-600">Immediate attention required</p>
                      </div>
                    </div>
                    <button onclick="closeAlertModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Student Information */}
                  <div class="space-y-4">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 class="font-semibold text-red-800 mb-2">Student Details</h4>
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-600">Name:</span>
                          <span id="modalStudentName" class="font-medium text-gray-900"></span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Student ID:</span>
                          <span id="modalStudentId" class="font-medium text-gray-900"></span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Risk Level:</span>
                          <span id="modalRiskLevel" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"></span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Flag Date:</span>
                          <span id="modalFlagDate" class="font-medium text-gray-900"></span>
                        </div>
                      </div>
                    </div>

                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 class="font-semibold text-gray-800 mb-2">Risk Details</h4>
                      <p id="modalReason" class="text-sm text-gray-700"></p>
                    </div>

                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 class="font-semibold text-blue-800 mb-2">Parent/Guardian Information</h4>
                      <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                          <span class="text-gray-600">Name:</span>
                          <span id="modalParentName" class="font-medium text-gray-900"></span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Phone:</span>
                          <span id="modalParentPhone" class="font-medium text-gray-900"></span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-gray-600">Email:</span>
                          <span id="modalParentEmail" class="font-medium text-gray-900"></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div class="flex flex-col gap-3 pt-4">
                      <button 
                        onclick="notifyParent()" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Notify Parent/Guardian
                      </button>
                      <button 
                        onclick="closeAlertModal()" 
                        class="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Filter Script */}
            <script dangerouslySetInnerHTML={{
              __html: `
function filterRiskFlagsBySearch(searchValue) {
  const rows = document.querySelectorAll('tbody tr');
  const searchTerm = searchValue.toLowerCase().trim();
  
  rows.forEach(row => {
    const studentNameCell = row.querySelector('td:first-child .font-medium');
    const studentIdCell = row.querySelector('td:first-child .text-xs');
    const riskLevelCell = row.querySelector('td:nth-child(2) span');
    const alertCell = row.querySelector('td:nth-child(3) span');
    const reasonCell = row.querySelector('td:nth-child(5) div');
    
    if (studentNameCell && studentIdCell) {
      const studentName = studentNameCell.textContent.toLowerCase();
      const studentId = studentIdCell.textContent.toLowerCase();
      const riskLevel = riskLevelCell ? riskLevelCell.textContent.toLowerCase() : '';
      const alertStatus = alertCell ? alertCell.textContent.toLowerCase() : '';
      const reason = reasonCell ? reasonCell.textContent.toLowerCase() : '';
      
      if (studentName.includes(searchTerm) || 
          studentId.includes(searchTerm) || 
          riskLevel.includes(searchTerm) || 
          alertStatus.includes(searchTerm) ||
          reason.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });
  
  // Show "No results" message if no rows are visible
  const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
  const table = document.querySelector('table');
  let noResultsMsg = document.getElementById('no-results-msg');
  
  if (visibleRows.length === 0 && searchTerm !== '') {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.id = 'no-results-msg';
      noResultsMsg.className = 'text-center py-8 text-gray-500';
      noResultsMsg.innerHTML = 'No risk flags found matching your search.';
      table.parentNode.appendChild(noResultsMsg);
    }
    noResultsMsg.style.display = 'block';
  } else {
    if (noResultsMsg) {
      noResultsMsg.style.display = 'none';
    }
  }
}

// Modal Functions
function openAlertModal(studentId, studentName, riskLevel, reason, flagDate, parentName, parentPhone, parentEmail) {
  // Populate modal with student data
  document.getElementById('modalStudentName').textContent = studentName;
  document.getElementById('modalStudentId').textContent = studentId;
  document.getElementById('modalRiskLevel').textContent = riskLevel;
  document.getElementById('modalFlagDate').textContent = flagDate;
  document.getElementById('modalReason').textContent = reason;
  document.getElementById('modalParentName').textContent = parentName;
  document.getElementById('modalParentPhone').textContent = parentPhone;
  document.getElementById('modalParentEmail').textContent = parentEmail;
  
  // Store current student data for notification
  window.currentAlertStudent = {
    studentId, studentName, riskLevel, reason, flagDate, parentName, parentPhone, parentEmail
  };
  
  // Show modal
  document.getElementById('alertModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeAlertModal() {
  document.getElementById('alertModal').classList.add('hidden');
  document.body.style.overflow = 'auto'; // Restore scrolling
  window.currentAlertStudent = null;
}

function notifyParent() {
  const student = window.currentAlertStudent;
  if (!student) return;
  
  // Show loading state
  const notifyBtn = event.target;
  const originalText = notifyBtn.innerHTML;
  notifyBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Sending...';
  notifyBtn.disabled = true;
  
  // Simulate notification (you can replace this with actual API call)
  setTimeout(() => {
    // Create notification message
    const message = \`Dear \${student.parentName},

We hope this message finds you well. We are writing to inform you about an important matter regarding your child, \${student.studentName} (Student ID: \${student.studentId}).

ALERT DETAILS:
- Risk Level: \${student.riskLevel}
- Date Flagged: \${student.flagDate}
- Reason: \${student.reason}

We recommend scheduling a meeting to discuss this matter and develop an action plan to support \${student.studentName}'s academic progress.

Please contact us at your earliest convenience.

Best regards,
Academic Team\`;

    // Show success message
    alert('Parent notification sent successfully!\\n\\nNotification Details:\\n' + message);
    
    // Reset button
    notifyBtn.innerHTML = originalText;
    notifyBtn.disabled = false;
    
    // Close modal
    closeAlertModal();
  }, 2000);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
  const modal = document.getElementById('alertModal');
  if (event.target === modal) {
    closeAlertModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeAlertModal();
  }
});
              `
            }} />
          </main>
          </div>
        </div>
      </div>
    </div>
  )
})

export const POST = createRoute(zValidator('form', RiskFlagFormSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    await prisma.riskFlag.create({
      data: {
        studentId: data.studentId,
        riskLevel: data.riskLevel,
        reason: data.reason,
        flagDate: new Date(data.flagDate),
      },
    })
    return c.redirect('/dashboard/risk-flags?success=1')
  } catch (e: any) {
    return c.redirect(`/dashboard/risk-flags?error=${encodeURIComponent('Failed to add risk flag')}`)
  }
})


