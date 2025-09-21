import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'
import { zValidator } from '@hono/zod-validator'
import z from 'zod'

const StudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dob: z.string().min(1),
  department: z.string().optional(),
  currentSemester: z.coerce.number().int().min(1),
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
    include: {
      attendance: true,
      testScores: true,
      backlogs: true,
      feePayments: true,
      riskFlags: true,
    },
    orderBy: { name: 'asc' },
    take: 200,
  })

  

  return c.render(
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      
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
                  {success ? 'Student added successfully' : error || 'Failed to add student'}
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
              <h2 class="text-xl font-semibold text-slate-900">Students</h2>
              <p class="text-sm text-slate-600">Add new students and view their analysis.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Student</h3>
              <form method="post" class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Student ID</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="studentId" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Name</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="name" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Email</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="email" name="email" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Phone</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="phone" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">DOB</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="date" name="dob" required />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Department</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="text" name="department" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">Current Semester</label>
                  <input class="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" name="currentSemester" min="1" required />
                </div>
                <div class="md:col-span-3">
                  <button class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#3399FF'" onmouseout="this.style.backgroundColor='#E8734A'" type="submit">Add Student</button>
                </div>
              </form>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 class="text-sm font-semibold text-slate-700">All Students</h3>
                <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <button 
                    id="testBtn"
                    onclick="testConnection()"
                    class="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test
                  </button>
                  <button 
                    id="calculateRiskBtn"
                    onclick="calculateDropoutRiskForAll()"
                    class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span id="riskBtnText">Calculate Dropout Risk</span>
                  </button>
                  <div class="relative">
                    <input 
                      type="text" 
                      id="studentSearch" 
                      placeholder="Search by Student ID or Name (e.g., STU011)" 
                      class="pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72"
                      oninput="filterStudentsBySearch(this.value)"
                    />
                    <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Risk Calculation Status */}
              <div id="riskCalculationStatus" class="hidden mb-4 p-4 rounded-lg border">
                <div class="flex items-center gap-3">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <div class="font-medium text-slate-800" id="statusTitle">Calculating Dropout Risk...</div>
                    <div class="text-sm text-slate-600" id="statusMessage">Processing students and calculating risk levels...</div>
                  </div>
                </div>
                <div class="mt-3">
                  <div class="bg-gray-200 rounded-full h-2">
                    <div id="progressBar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                  </div>
                  <div class="text-xs text-slate-500 mt-1" id="progressText">0% complete</div>
                </div>
              </div>
              {students.length === 0 ? (
                <p class="text-sm text-slate-600">No students yet. Add your first student above.</p>
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-600">
                      <tr>
                        <th class="px-4 py-3">Student</th>
                        <th class="px-4 py-3">Email</th>
                        <th class="px-4 py-3">Department</th>
                        <th class="px-4 py-3">Semester</th>
                        <th class="px-4 py-3">Risk Level</th>
                        <th class="px-4 py-3">Risk Details</th>
                        <th class="px-4 py-3">Backlogs</th>
                        <th class="px-4 py-3">Unpaid Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        // Get the latest risk flag (most recent) - using correct field names
                        const latestRiskFlag = s.riskFlags && s.riskFlags.length > 0 
                          ? s.riskFlags.sort((a, b) => new Date(b.flagDate).getTime() - new Date(a.flagDate).getTime())[0]
                          : null;
                        
                        // Determine risk level and styling based on actual schema
                        const getRiskDisplay = () => {
                          if (!latestRiskFlag) {
                            return {
                              level: 'No Assessment',
                              color: 'text-gray-500',
                              bgColor: 'bg-gray-100',
                              badge: '●'
                            };
                          }
                          
                          const riskLevel = latestRiskFlag.riskLevel?.toLowerCase();
                          switch (riskLevel) {
                            case 'red':
                              return {
                                level: 'High Risk',
                                color: 'text-red-700',
                                bgColor: 'bg-red-100',
                                badge: '●'
                              };
                            case 'yellow':
                              return {
                                level: 'Medium Risk',
                                color: 'text-yellow-700',
                                bgColor: 'bg-yellow-100',
                                badge: '●'
                              };
                            case 'green':
                              return {
                                level: 'Low Risk',
                                color: 'text-green-700',
                                bgColor: 'bg-green-100',
                                badge: '●'
                              };
                            default:
                              return {
                                level: 'Unknown',
                                color: 'text-gray-500',
                                bgColor: 'bg-gray-100',
                                badge: '●'
                              };
                          }
                        };
                        
                        const riskDisplay = getRiskDisplay();
                        
                        return (
                          <tr class="border-t hover:bg-slate-50/60" key={s.studentId}>
                            <td class="px-4 py-3">
                              <a class="font-medium text-slate-800 hover:underline" href={`/dashboard/student/${encodeURIComponent(s.studentId)}`}>{s.name}</a>
                              <div class="text-xs text-slate-500">
                                <a class="hover:underline" href={`/dashboard/student/${encodeURIComponent(s.studentId)}`}>{s.studentId}</a>
                              </div>
                            </td>
                            <td class="px-4 py-3">{s.email}</td>
                            <td class="px-4 py-3">{s.department??'-'}</td>
                            <td class="px-4 py-3">{s.currentSemester}</td>
                            <td class="px-4 py-3">
                              <div class="flex items-center gap-2">
                                <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskDisplay.bgColor} ${riskDisplay.color}`}>
                                  <span class="mr-1">{riskDisplay.badge}</span>
                                  {riskDisplay.level}
                                </span>
                              </div>
                            </td>
                            <td class="px-4 py-3">
                              {latestRiskFlag ? (
                                <div class="space-y-1">
                                  <div class="text-xs font-medium text-slate-700">
                                    Probability: {latestRiskFlag.reason?.includes('(') && latestRiskFlag.reason?.includes('%') 
                                      ? latestRiskFlag.reason.match(/\(([^)]+)\)/)?.[1] || 'Not Available'
                                      : 'Not Available'}
                                  </div>
                                  <div class="text-xs text-slate-500">
                                    Level: {latestRiskFlag.riskLevel}
                                  </div>
                                  <div class="text-xs text-slate-500">
                                    Updated: {new Date(latestRiskFlag.flagDate).toLocaleDateString()}
                                  </div>
                                  {s.riskFlags && s.riskFlags.length > 1 && (
                                    <div class="text-xs text-blue-600">
                                      +{s.riskFlags.length - 1} more assessments
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span class="text-xs text-gray-500">No risk assessment</span>
                              )}
                            </td>
                            <td class="px-4 py-3">
                              <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (s.backlogs?.length ?? 0) > 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {s.backlogs?.length ?? 0}
                              </span>
                            </td>
                            <td class="px-4 py-3">
                              <span class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (s.feePayments?.filter((f) => f.status === 'Unpaid').length ?? 0) > 0 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {s.feePayments?.filter((f) => f.status === 'Unpaid').length ?? 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Search Filter and Risk Calculation Scripts */}
            <script dangerouslySetInnerHTML={{
              __html: `
function filterStudentsBySearch(searchValue) {
  const rows = document.querySelectorAll('tbody tr');
  const searchTerm = searchValue.toLowerCase().trim();
  
  rows.forEach(row => {
    const studentNameCell = row.querySelector('td:first-child a.font-medium');
    const studentIdCell = row.querySelector('td:first-child .text-xs a');
    const emailCell = row.querySelector('td:nth-child(2)');
    const departmentCell = row.querySelector('td:nth-child(3)');
    
    if (studentNameCell && studentIdCell && emailCell) {
      const studentName = studentNameCell.textContent.toLowerCase();
      const studentId = studentIdCell.textContent.toLowerCase();
      const email = emailCell.textContent.toLowerCase();
      const department = departmentCell ? departmentCell.textContent.toLowerCase() : '';
      
      if (studentName.includes(searchTerm) || 
          studentId.includes(searchTerm) || 
          email.includes(searchTerm) || 
          department.includes(searchTerm)) {
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
      noResultsMsg.innerHTML = 'No students found matching your search.';
      table.parentNode.appendChild(noResultsMsg);
    }
    noResultsMsg.style.display = 'block';
  } else {
    if (noResultsMsg) {
      noResultsMsg.style.display = 'none';
    }
  }
}

async function testConnection() {
  const btn = document.getElementById('testBtn');
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Testing...';
  
  try {
    const response = await fetch('/api/test-dropout-risk', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(\`✅ Test Successful!\\n\\nTeacher: \${result.teacherName}\\nStudents: \${result.studentCount}\\nPython Response: \${JSON.stringify(result.pythonBackendResponse, null, 2)}\`);
    } else {
      alert(\`❌ Test Failed!\\n\\nError: \${result.error}\\nDetails: \${result.details || 'No details'}\`);
    }
    
    console.log('Test result:', result);
    
  } catch (error) {
    console.error('Test error:', error);
    alert(\`❌ Connection Error!\\n\\nError: \${error.message}\\nCheck console for details.\`);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function calculateDropoutRiskForAll() {
  const btn = document.getElementById('calculateRiskBtn');
  const btnText = document.getElementById('riskBtnText');
  const statusDiv = document.getElementById('riskCalculationStatus');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  // Disable button and show loading state
  btn.disabled = true;
  btnText.textContent = 'Calculating...';
  statusDiv.classList.remove('hidden');
  statusDiv.className = 'mb-4 p-4 rounded-lg border bg-blue-50 border-blue-200';
  
  // Simulate progress updates
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '% complete';
  }, 500);
  
  try {
    const response = await fetch('/api/calculate-dropout-risk', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressText.textContent = '100% complete';
    
    if (result.success) {
      // Success state
      statusDiv.className = 'mb-4 p-4 rounded-lg border bg-green-50 border-green-200';
      statusTitle.textContent = 'Risk Calculation Complete!';
      statusMessage.innerHTML = \`
        Successfully processed <strong>\${result.processed}</strong> students. 
        \${result.errors > 0 ? \`<span class="text-red-600">\${result.errors} errors occurred.</span>\` : ''}
        <br><small class="text-green-600">Risk flags have been updated in the database. Refresh the page to see updated risk counts.</small>
      \`;
      
      // Show detailed results
      if (result.results && result.results.length > 0) {
        const resultsHtml = result.results.map(r => {
          if (r.error) {
            return \`<div class="text-red-600 text-sm">❌ \${r.name} (\${r.studentId}): \${r.error}</div>\`;
          } else {
            const riskColor = r.riskLevel === 'Red' ? 'text-red-600' : 
                             r.riskLevel === 'Yellow' ? 'text-yellow-600' : 'text-green-600';
            return \`<div class="text-sm"><span class="\${riskColor}">●</span> \${r.name} (\${r.studentId}): \${r.riskLevel} risk (\${(r.probability * 100).toFixed(1)}%)</div>\`;
          }
        }).join('');
        
        statusMessage.innerHTML += \`
          <div class="mt-3 max-h-40 overflow-y-auto border-t pt-2">
            <div class="text-sm font-medium text-slate-700 mb-2">Results:</div>
            \${resultsHtml}
          </div>
        \`;
      }
      
      // Auto-hide after 10 seconds and suggest refresh
      setTimeout(() => {
        statusDiv.classList.add('hidden');
        if (confirm('Risk calculation completed! Would you like to refresh the page to see updated risk counts?')) {
          window.location.reload();
        }
      }, 10000);
      
    } else {
      // Error state
      statusDiv.className = 'mb-4 p-4 rounded-lg border bg-red-50 border-red-200';
      statusTitle.textContent = 'Calculation Failed';
      statusMessage.innerHTML = \`
        <div class="text-red-800 font-medium">\${result.error || 'An unknown error occurred while calculating dropout risk.'}</div>
        \${result.details ? \`<div class="text-red-600 text-sm mt-2">Details: \${result.details}</div>\` : ''}
      \`;
    }
    
  } catch (error) {
    clearInterval(progressInterval);
    console.error('Error calculating dropout risk:', error);
    
    // Error state
    statusDiv.className = 'mb-4 p-4 rounded-lg border bg-red-50 border-red-200';
    statusTitle.textContent = 'Connection Error';
    statusMessage.innerHTML = \`
      <div class="text-red-800 font-medium">Failed to connect to the risk calculation service.</div>
      <div class="text-red-600 text-sm mt-2">Error: \${error.message || 'Unknown connection error'}</div>
      <div class="mt-3 text-sm">Please ensure:</div>
      <ul class="list-disc list-inside mt-2 text-sm">
        <li>The Python backend is running on localhost:8000</li>
        <li>Your internet connection is stable</li>
        <li>Check browser console for more details</li>
        <li>Try again in a few moments</li>
      </ul>
    \`;
  } finally {
    // Re-enable button
    btn.disabled = false;
    btnText.textContent = 'Calculate Dropout Risk';
    
    // Hide status after 15 seconds if still showing
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 15000);
  }
}
              `
            }} />
          </main>
          </div>
        </div>
      </div>
    </div>,
  )
})

export const POST = createRoute(zValidator('form', StudentSchema), async (c) => {
  const data = c.req.valid('form')
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  if (!uid) return c.redirect('/dashboard/login')

  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    // Ensure the referenced teacher exists to avoid orphan students
    const teacher = await prisma.teacher.findUnique({ where: { teacherId: uid } })
    if (!teacher) {
      return c.redirect(`/dashboard/student?error=${encodeURIComponent('No teacher account found. Please re-login and try again.')}`)
    }
    await prisma.student.create({
      data: {
        studentId: data.studentId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dob: new Date(data.dob),
        department: data.department,
        currentSemester: Number(data.currentSemester),
        teacherId: uid,
      },
    })
    return c.redirect('/dashboard/student?success=1')
  } catch (e: any) {
    const message = e?.code === 'P2002' ? 'Student ID or email already exists' : 'Failed to create student'
    return c.redirect(`/dashboard/student?error=${encodeURIComponent(message)}`)
  }
  
})


