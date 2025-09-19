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
  
  // Get available courses for dropdowns
  const courses = await prisma.courseSubject.findMany({
    orderBy: [{ department: 'asc' }, { semester: 'asc' }, { name: 'asc' }]
  })

  const kpi = {
    total: DUMMY_STUDENTS.length,
    high: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'High').length,
    medium: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'Medium').length,
    low: DUMMY_STUDENTS.filter((s) => s.riskLevel === 'Low').length,
  }

  return c.render(
    <div class="min-h-screen bg-slate-50">
      
      <div>
        <div class="grid grid-cols-1 md:grid-cols-[16rem_1fr]">
          <Sidebar currentPath={new URL(c.req.url).pathname} />
          <div>
          <Header uid={uid} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
          
          <main class="space-y-8 p-4">
            <section class="space-y-3">
              <h2 class="text-xl font-semibold text-slate-800">Bulk Import & Data Management</h2>
              <p class="text-sm text-gray-600">Comprehensive student data import with support for academic records, parent information, and research supervision activities.</p>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-3">
              <h3 class="text-sm font-semibold text-slate-700">Bulk Import Students (JSON)</h3>
              <p class="text-xs text-gray-600">Paste an array of student objects. Required: studentId, name, email, dob (YYYY-MM-DD), currentSemester. Optional: phone, department, batchId, parent info, attendance, testScores, backlogs, feePayments, projects, phdSupervision, fellowships.</p>
              <textarea id="json-input" class="w-full border rounded p-2 font-mono text-xs h-48" placeholder='[
  {
    "studentId": "STU1001",
    "name": "John Doe",
    "email": "john@example.com",
    "dob": "2002-01-15",
    "currentSemester": 3,
    "department": "CSE",
    "phone": "9876543210",
    "batchId": "CSE2022A",
    "parentName": "Jane Doe",
    "parentEmail": "jane@example.com",
    "parentPhone": "9876543211",
    "address": "123 Main St, City",
    "attendance": [{"courseId": "CSE101", "month": "2024-01", "attendancePercent": 85.5}],
    "testScores": [{"courseId": "MATH201", "testDate": "2024-01-15", "score": 92.5}],
    "backlogs": [{"courseId": "PHY101", "attempts": 2, "cleared": false}],
    "feePayments": [{"dueDate": "2024-01-01", "paidDate": "2024-01-05", "status": "Paid", "dueMonths": 1}],
    "projects": [{"title": "AI Project", "description": "ML research", "startDate": "2024-01-01", "status": "Active"}],
    "phdSupervision": [{"title": "PhD Research", "researchArea": "AI/ML", "startDate": "2024-01-01", "expectedEnd": "2027-01-01"}],
    "fellowships": [{"type": "Full Time", "amount": 25000, "duration": 12, "startDate": "2024-01-01"}]
  }
]'></textarea>
              <div class="flex items-center gap-2">
                <button id="start-import" class="text-white px-4 py-2 rounded" style="background-color: #E8734A" onmouseover="this.style.backgroundColor='#FC816B'" onmouseout="this.style.backgroundColor='#E8734A'">Start Import</button>
                <button id="clear-log" class="px-4 py-2 rounded border">Clear Log</button>
              </div>
              <div id="import-log" class="mt-2 text-xs space-y-1 max-h-48 overflow-auto bg-gray-50 rounded p-2 border"></div>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
              <h3 class="text-sm font-semibold text-slate-700">Course Management</h3>
              <p class="text-xs text-gray-600">Create new courses if they don't exist. If a courseId is not found during import, it will be automatically created using these default values.</p>
              <div class="grid md:grid-cols-2 gap-4 p-3 border rounded bg-blue-50">
                <div>
                  <label class="block text-gray-700 text-sm font-medium">Default Department</label>
                  <input id="default-department" class="mt-1 w-full border rounded p-2" type="text" placeholder="e.g., CSE, ECE, ME" />
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-medium">Default Course Name Pattern</label>
                  <input id="default-course-name" class="mt-1 w-full border rounded p-2" type="text" placeholder="e.g., Subject {courseId}" />
                </div>
                <div>
                  <label class="block text-gray-700 text-sm font-medium">Default Semester</label>
                  <input id="default-semester" class="mt-1 w-full border rounded p-2" type="number" min="1" max="8" value="1" />
                </div>
                <div class="flex items-center gap-2 mt-6">
                  <input id="auto-create-courses" type="checkbox" class="border rounded" checked />
                  <label for="auto-create-courses" class="text-gray-700 text-sm">Auto-create missing courses</label>
                </div>
              </div>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
              <h3 class="text-sm font-semibold text-slate-700">Student Information Fields</h3>
              <p class="text-xs text-gray-600">The updated schema supports comprehensive student information including parent/guardian details.</p>
              <div class="grid md:grid-cols-2 gap-4 p-3 border rounded bg-blue-50">
                <div class="space-y-2">
                  <h4 class="font-medium text-blue-800">Required Fields</h4>
                  <ul class="text-xs text-blue-700 space-y-1">
                    <li>• <strong>studentId</strong>: Unique identifier</li>
                    <li>• <strong>name</strong>: Full name</li>
                    <li>• <strong>email</strong>: Email address</li>
                    <li>• <strong>dob</strong>: Date of birth (YYYY-MM-DD)</li>
                    <li>• <strong>currentSemester</strong>: Current semester (1-8)</li>
                  </ul>
                </div>
                <div class="space-y-2">
                  <h4 class="font-medium text-blue-800">Optional Fields</h4>
                  <ul class="text-xs text-blue-700 space-y-1">
                    <li>• <strong>phone, department, batchId</strong></li>
                    <li>• <strong>parentName, parentEmail, parentPhone</strong></li>
                    <li>• <strong>address</strong>: Home address</li>
                    <li>• <strong>attendance, testScores, backlogs</strong></li>
                    <li>• <strong>feePayments</strong>: Fee payment records</li>
                  </ul>
                </div>
              </div>
            </section>

            <section class="bg-white rounded-xl border shadow-sm p-4 space-y-4">
              <h3 class="text-sm font-semibold text-slate-700">Supervision Models (Research Activities)</h3>
              <p class="text-xs text-gray-600">The JSON can include research supervision data. These will be automatically linked to the current teacher as supervisor.</p>
              <div class="grid md:grid-cols-3 gap-4 p-3 border rounded bg-green-50">
                <div class="space-y-2">
                  <h4 class="font-medium text-green-800">Projects</h4>
                  <p class="text-xs text-green-700">Required: title, startDate<br/>Optional: description, endDate, status</p>
                  <code class="text-xs bg-green-100 p-1 rounded block">{`"projects": [{"title": "AI Research", "startDate": "2024-01-01"}]`}</code>
                </div>
                <div class="space-y-2">
                  <h4 class="font-medium text-green-800">PhD Supervision</h4>
                  <p class="text-xs text-green-700">Required: title, researchArea, startDate<br/>Optional: expectedEnd, status</p>
                  <code class="text-xs bg-green-100 p-1 rounded block">{`"phdSupervision": [{"title": "PhD Title", "researchArea": "AI/ML"}]`}</code>
                </div>
                <div class="space-y-2">
                  <h4 class="font-medium text-green-800">Fellowships</h4>
                  <p class="text-xs text-green-700">Required: type, amount, duration, startDate<br/>Optional: endDate, status</p>
                  <code class="text-xs bg-green-100 p-1 rounded block">{`"fellowships": [{"type": "Full Time", "amount": 25000, "duration": 12}]`}</code>
                </div>
              </div>
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
                  <div class="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label class="block text-gray-700">Course</label>
                      <select id="att-course" class="mt-1 w-full border rounded p-2">
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.courseId} value={course.courseId}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      <label class="block text-gray-700">Course</label>
                      <select id="marks-course" class="mt-1 w-full border rounded p-2">
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.courseId} value={course.courseId}>
                            {course.code} - {course.name} (Sem {course.semester})
                          </option>
                        ))}
                      </select>
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
                      <label class="block text-gray-700">Course</label>
                      <select id="backlog-course" class="mt-1 w-full border rounded p-2">
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.courseId} value={course.courseId}>
                            {course.code} - {course.name} (Sem {course.semester})
                          </option>
                        ))}
                      </select>
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
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
(function(){
  var TEACHER_ID = '${uid}';
  var startBtn = document.getElementById('start-import');
  var clearBtn = document.getElementById('clear-log');
  var inputEl = document.getElementById('json-input');
  var logEl = document.getElementById('import-log');
  if (!startBtn || !inputEl || !logEl) return;

  function log(line, cls){
    var div = document.createElement('div');
    if (cls) div.className = cls;
    div.textContent = line;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function toFormData(obj){
    var fd = new FormData();
    if (obj.studentId) fd.set('studentId', String(obj.studentId));
    if (obj.name) fd.set('name', String(obj.name));
    if (obj.email) fd.set('email', String(obj.email));
    if (obj.phone) fd.set('phone', String(obj.phone));
    if (obj.dob) fd.set('dob', String(obj.dob));
    if (obj.department) fd.set('department', String(obj.department));
    if (obj.currentSemester != null) fd.set('currentSemester', String(obj.currentSemester));
    if (obj.batchId) fd.set('batchId', String(obj.batchId));
    // Parent/Guardian Information
    if (obj.parentName) fd.set('parentName', String(obj.parentName));
    if (obj.parentEmail) fd.set('parentEmail', String(obj.parentEmail));
    if (obj.parentPhone) fd.set('parentPhone', String(obj.parentPhone));
    if (obj.address) fd.set('address', String(obj.address));
    return fd;
  }

  async function ensureCourseExists(courseId) {
    if (!courseId) return false;
    
    // Check if auto-create is enabled
    var autoCreate = document.getElementById('auto-create-courses');
    if (!autoCreate || !autoCreate.checked) return true;
    
    try {
      // First check if course exists
      var resp = await fetch('/api/courses?courseId=' + encodeURIComponent(courseId));
      var courses = await resp.json();
      
      // If course exists, return true
      if (courses && courses.length > 0) {
        return true;
      }
      
      // Course doesn't exist, create it
      var defaultDept = (document.getElementById('default-department') || {}).value || 'CSE';
      var defaultName = (document.getElementById('default-course-name') || {}).value || 'Subject {courseId}';
      var defaultSem = parseInt((document.getElementById('default-semester') || {}).value) || 1;
      
      var courseData = {
        courseId: courseId,
        name: defaultName.replace('{courseId}', courseId),
        code: courseId,
        semester: defaultSem,
        department: defaultDept
      };
      
      var createResp = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      
      if (createResp.ok) {
        log('✓ Created new course: ' + courseId + ' - ' + courseData.name, 'text-blue-600');
        return true;
      } else {
        var errorText = await createResp.text();
        log('✗ Failed to create course ' + courseId + ': ' + errorText, 'text-red-600');
        return false;
      }
    } catch (e) {
      log('✗ Error checking/creating course ' + courseId + ': ' + e.message, 'text-red-600');
      return false;
    }
  }

  function getDefaults(){
    var defs = { attendance:null, testScores:null, fees:null, backlogs:null };
    var el;
    
    el = document.getElementById('create-attendance');
    if (el && el.checked) {
      var courseId = (document.getElementById('att-course') || {}).value;
      var month = (document.getElementById('att-month') || {}).value;
      var percent = (document.getElementById('att-percent') || {}).value;
      if (courseId && month && percent) {
        defs.attendance = {
          courseId: courseId,
          month: month + '-01',
          attendancePercent: parseFloat(percent)
        };
      }
    }
    
    el = document.getElementById('create-marks');
    if (el && el.checked) {
      var courseId = (document.getElementById('marks-course') || {}).value;
      var testDate = (document.getElementById('marks-date') || {}).value;
      var score = (document.getElementById('marks-score') || {}).value;
      if (courseId && testDate && score) {
        defs.testScores = {
          courseId: courseId,
          testDate: testDate,
          score: parseFloat(score)
        };
      }
    }
    
    el = document.getElementById('create-fees');
    if (el && el.checked) {
      var dueDate = (document.getElementById('fees-due') || {}).value;
      var paidDate = (document.getElementById('fees-paid') || {}).value;
      var status = (document.getElementById('fees-status') || {}).value;
      var dueMonths = (document.getElementById('fees-months') || {}).value;
      if (dueDate && status && dueMonths) {
        defs.fees = {
          dueDate: dueDate,
          paidDate: paidDate || null,
          status: status,
          dueMonths: parseInt(dueMonths)
        };
      }
    }
    
    el = document.getElementById('create-backlogs');
    if (el && el.checked) {
      var courseId = (document.getElementById('backlog-course') || {}).value;
      var attempts = (document.getElementById('backlog-attempts') || {}).value;
      var cleared = (document.getElementById('backlog-cleared') || {}).checked;
      if (courseId && attempts) {
        defs.backlogs = {
          courseId: courseId,
          attempts: parseInt(attempts),
          cleared: cleared
        };
      }
    }
    
    return defs;
  }

  async function createRelatedEntries(studentId, studentData, defaults) {
    var results = [];
    
    // Create attendance entries
    var attendanceList = studentData.attendance || (defaults.attendance ? [defaults.attendance] : []);
    for (var i = 0; i < attendanceList.length; i++) {
      var att = attendanceList[i];
      if (att.courseId && att.month && att.attendancePercent != null) {
        // Ensure course exists before creating attendance
        var courseExists = await ensureCourseExists(att.courseId);
        if (!courseExists) {
          results.push('✗ Attendance skipped: Course ' + att.courseId + ' could not be created');
          continue;
        }
        
        try {
          var fd = new FormData();
          fd.set('studentId', studentId);
          fd.set('courseId', att.courseId);
          fd.set('month', att.month);
          fd.set('attendancePercent', String(att.attendancePercent));
          
          var resp = await fetch('/api/attendance', { method: 'POST', body: fd });
          if (resp.ok) {
            results.push('✓ Attendance created for course ' + att.courseId);
          } else {
            results.push('✗ Attendance failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Attendance error: ' + e.message);
        }
      }
    }
    
    // Create test scores
    var testScoresList = studentData.testScores || (defaults.testScores ? [defaults.testScores] : []);
    for (var i = 0; i < testScoresList.length; i++) {
      var test = testScoresList[i];
      if (test.courseId && test.testDate && test.score != null) {
        // Ensure course exists before creating test score
        var courseExists = await ensureCourseExists(test.courseId);
        if (!courseExists) {
          results.push('✗ Test score skipped: Course ' + test.courseId + ' could not be created');
          continue;
        }
        
        try {
          var fd = new FormData();
          fd.set('studentId', studentId);
          fd.set('courseId', test.courseId);
          fd.set('testDate', test.testDate);
          fd.set('score', String(test.score));
          
          var resp = await fetch('/api/tests', { method: 'POST', body: fd });
          if (resp.ok) {
            results.push('✓ Test score created for course ' + test.courseId);
          } else {
            results.push('✗ Test score failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Test score error: ' + e.message);
        }
      }
    }
    
    // Create fee payments
    var feesList = studentData.feePayments || (defaults.fees ? [defaults.fees] : []);
    for (var i = 0; i < feesList.length; i++) {
      var fee = feesList[i];
      // Handle both old format (dueDate, status, dueMonths) and new format (semester, amountPaid, paymentDate)
      if ((fee.dueDate && fee.status && fee.dueMonths != null) || (fee.semester && fee.paymentDate)) {
        try {
          var fd = new FormData();
          fd.set('studentId', studentId);
          
          // Handle different JSON formats
          if (fee.dueDate) {
            // Old format
            fd.set('dueDate', fee.dueDate);
            if (fee.paidDate) fd.set('paidDate', fee.paidDate);
            fd.set('status', fee.status);
            fd.set('dueMonths', String(fee.dueMonths));
          } else {
            // New format - convert from semester/paymentDate format
            var dueDate = new Date(fee.paymentDate);
            dueDate.setMonth(dueDate.getMonth() - 1); // Due date is 1 month before payment
            fd.set('dueDate', dueDate.toISOString().split('T')[0]);
            fd.set('paidDate', fee.paymentDate);
            fd.set('status', fee.amountPaid ? 'Paid' : 'Unpaid');
            fd.set('dueMonths', String(fee.semester || 1));
          }
          
          var resp = await fetch('/api/fees', { method: 'POST', body: fd });
          if (resp.ok) {
            results.push('✓ Fee payment created for semester ' + (fee.semester || 'N/A'));
          } else {
            results.push('✗ Fee payment failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Fee payment error: ' + e.message);
        }
      }
    }
    
    // Create backlogs
    var backlogsList = studentData.backlogs || (defaults.backlogs ? [defaults.backlogs] : []);
    for (var i = 0; i < backlogsList.length; i++) {
      var backlog = backlogsList[i];
      if (backlog.courseId && backlog.attempts != null) {
        // Ensure course exists before creating backlog
        var courseExists = await ensureCourseExists(backlog.courseId);
        if (!courseExists) {
          results.push('✗ Backlog skipped: Course ' + backlog.courseId + ' could not be created');
          continue;
        }
        
        try {
          var fd = new FormData();
          fd.set('studentId', studentId);
          fd.set('courseId', backlog.courseId);
          fd.set('attempts', String(backlog.attempts));
          fd.set('cleared', String(backlog.cleared || false));
          
          var resp = await fetch('/api/backlogs', { method: 'POST', body: fd });
          if (resp.ok) {
            results.push('✓ Backlog created for course ' + backlog.courseId);
          } else {
            results.push('✗ Backlog failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Backlog error: ' + e.message);
        }
      }
    }
    
    return results;
  }

  async function createSupervisionEntries(studentId, studentData, teacherId) {
    var results = [];
    
    // Create projects
    var projectsList = studentData.projects || [];
    for (var i = 0; i < projectsList.length; i++) {
      var project = projectsList[i];
      if (project.title && project.startDate) {
        try {
          var fd = new FormData();
          fd.set('title', project.title);
          if (project.description) fd.set('description', project.description);
          fd.set('studentId', studentId);
          fd.set('startDate', project.startDate);
          if (project.endDate) fd.set('endDate', project.endDate);
          fd.set('status', project.status || 'Active');
          
          var resp = await fetch('/api/projects', {
            method: 'POST',
            body: fd
          });
          
          if (resp.ok) {
            results.push('✓ Project created: ' + project.title);
          } else {
            results.push('✗ Project failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Project error: ' + e.message);
        }
      }
    }
    
    // Create PhD supervisions
    var phdList = studentData.phdSupervision || [];
    for (var i = 0; i < phdList.length; i++) {
      var phd = phdList[i];
      if (phd.title && phd.researchArea && phd.startDate) {
        try {
          var fd = new FormData();
          fd.set('title', phd.title);
          fd.set('researchArea', phd.researchArea);
          fd.set('studentId', studentId);
          fd.set('startDate', phd.startDate);
          if (phd.expectedEnd) fd.set('expectedEnd', phd.expectedEnd);
          fd.set('status', phd.status || 'Ongoing');
          
          var resp = await fetch('/api/phd-supervision', {
            method: 'POST',
            body: fd
          });
          
          if (resp.ok) {
            results.push('✓ PhD supervision created: ' + phd.title);
          } else {
            results.push('✗ PhD supervision failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ PhD supervision error: ' + e.message);
        }
      }
    }
    
    // Create fellowships
    var fellowshipsList = studentData.fellowships || [];
    for (var i = 0; i < fellowshipsList.length; i++) {
      var fellowship = fellowshipsList[i];
      if (fellowship.type && fellowship.amount && fellowship.duration && fellowship.startDate) {
        try {
          var fd = new FormData();
          fd.set('type', fellowship.type);
          fd.set('amount', String(fellowship.amount));
          fd.set('duration', String(fellowship.duration));
          fd.set('studentId', studentId);
          fd.set('startDate', fellowship.startDate);
          if (fellowship.endDate) fd.set('endDate', fellowship.endDate);
          fd.set('status', fellowship.status || 'Active');
          
          var resp = await fetch('/api/fellowships', {
            method: 'POST',
            body: fd
          });
          
          if (resp.ok) {
            results.push('✓ Fellowship created: ' + fellowship.type + ' - $' + fellowship.amount);
          } else {
            results.push('✗ Fellowship failed: ' + await resp.text());
          }
        } catch (e) {
          results.push('✗ Fellowship error: ' + e.message);
        }
      }
    }
    
    return results;
  }

  startBtn.addEventListener('click', async function(){
    var text = inputEl.value.trim();
    if (!text) {
      log('No JSON input provided', 'text-red-600');
      return;
    }
    
    var students;
    try {
      students = JSON.parse(text);
    } catch (e) {
      log('Invalid JSON: ' + e.message, 'text-red-600');
      return;
    }
    
    if (!Array.isArray(students)) {
      log('Input must be an array of student objects', 'text-red-600');
      return;
    }
    
    log('Starting import of ' + students.length + ' students...', 'text-blue-600 font-semibold');
    var defaults = getDefaults();
    
    // Get current teacher ID from the page context
    var teacherId = TEACHER_ID;
    
    for (var i = 0; i < students.length; i++) {
      var student = students[i];
      log('Processing student ' + (i + 1) + ': ' + (student.name || student.studentId || 'Unknown'));
      
      if (!student.studentId || !student.name || !student.email || !student.dob || student.currentSemester == null) {
        log('✗ Missing required fields (studentId, name, email, dob, currentSemester)', 'text-red-600');
        continue;
      }
      
      try {
        var fd = toFormData(student);
        var resp = await fetch('/api/students', { method: 'POST', body: fd });
        
        if (resp.ok) {
          log('✓ Student created: ' + student.name, 'text-green-600');
          
          // Create related entries
          var relatedResults = await createRelatedEntries(student.studentId, student, defaults);
          relatedResults.forEach(function(result) {
            log('  ' + result, result.startsWith('✓') ? 'text-green-600' : 'text-red-600');
          });
          
          // Create supervision entries (projects, PhD, fellowships)
          var supervisionResults = await createSupervisionEntries(student.studentId, student, teacherId);
          supervisionResults.forEach(function(result) {
            log('  ' + result, result.startsWith('✓') ? 'text-green-600' : 'text-red-600');
          });
        } else {
          var errorText = await resp.text();
          log('✗ Student creation failed: ' + errorText, 'text-red-600');
        }
      } catch (e) {
        log('✗ Error creating student: ' + e.message, 'text-red-600');
      }
    }
    
    log('Import completed!', 'text-blue-600 font-semibold');
  });

  clearBtn.addEventListener('click', function(){
    logEl.innerHTML = '';
  });
})();
`
      }} />
    </div>,
  )
})
