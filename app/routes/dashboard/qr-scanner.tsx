import { createRoute } from 'honox/factory'
import { html } from 'hono/html'
import Header from '../../components/dashboard/Header'
import Sidebar from '../../components/dashboard/Sidebar'

export default createRoute(async (c) => {
  // Get teacher information from cookies
  const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
  if (!teacherIdRaw) {
    return c.redirect('/login')
  }
  
  const teacherId = decodeURIComponent(teacherIdRaw)
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  const teacher = await prisma.teacher.findUnique({
    where: { teacherId }
  })

  // Get students and courses for the scanner interface
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    take: 100 // Limit for performance
  })

  const courses = await prisma.courseSubject.findMany({
    orderBy: { name: 'asc' }
  })

  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QR Scanner - Student Attendance - GuideED</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js"></script>
      <style>
        .scanner-container {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .scanner-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .success-animation {
          animation: successPulse 0.6s ease-out;
        }
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .error-animation {
          animation: errorShake 0.6s ease-out;
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        #qr-reader {
          border-radius: 12px;
          overflow: hidden;
        }
        #qr-reader__dashboard_section_swaplink {
          display: none !important;
        }
      </style>
    </head>
    <body class="bg-gray-50">
      <div class="flex h-screen">
        ${Sidebar({ currentPath: '/dashboard/qr-scanner' })}
        
        <div class="flex-1 flex flex-col overflow-hidden">
          ${Header({ 
            uid: teacherId, 
            userName: teacher?.name, 
            userEmail: teacher?.email, 
            userPicture: teacher?.picture 
          })}
          
          <main class="flex-1 overflow-y-auto p-6">
            <div class="max-w-7xl mx-auto">
              <!-- Header Section -->
              <div class="mb-8">
                <div class="flex items-center justify-between">
                  <div>
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">QR Scanner - Student Interface</h1>
                    <p class="text-gray-600">Students can scan QR codes here to mark their attendance</p>
                  </div>
                  <div class="flex items-center gap-4">
                    <div id="scanner-status" class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span class="text-sm text-gray-600">Scanner Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- QR Scanner -->
                <div class="scanner-container rounded-xl p-6">
                  <div class="scanner-card rounded-lg p-6">
                    <h2 class="text-xl font-semibold text-white mb-4 text-center">Scan QR Code for Attendance</h2>
                    
                    <!-- Student Selection -->
                    <div class="mb-4">
                      <label for="student-select" class="block text-sm font-medium text-white/80 mb-2">Select Your Name</label>
                      <select id="student-select" class="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50">
                        <option value="" class="text-gray-900">Choose your name...</option>
                        ${students.map(student => html`
                          <option value="${student.studentId}" class="text-gray-900">${student.name} (${student.rollNumber})</option>
                        `)}
                      </select>
                    </div>

                    <!-- Course Selection -->
                    <div class="mb-6">
                      <label for="course-select-scanner" class="block text-sm font-medium text-white/80 mb-2">Select Course</label>
                      <select id="course-select-scanner" class="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50">
                        <option value="" class="text-gray-900">Choose course...</option>
                        ${courses.map(course => html`
                          <option value="${course.courseId}" class="text-gray-900">${course.name} (${course.code})</option>
                        `)}
                      </select>
                    </div>

                    <!-- QR Scanner -->
                    <div id="qr-reader" class="mb-4" style="width: 100%; max-width: 400px; margin: 0 auto;"></div>
                    
                    <!-- Manual Input Alternative -->
                    <div class="mt-4">
                      <div class="text-center text-white/60 text-sm mb-2">Or enter session ID manually:</div>
                      <div class="flex gap-2">
                        <input 
                          type="text" 
                          id="manual-session-id" 
                          placeholder="Session ID" 
                          class="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                        >
                        <button 
                          id="manual-submit-btn" 
                          class="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled
                        >
                          Submit
                        </button>
                      </div>
                    </div>

                    <!-- Scanner Controls -->
                    <div class="flex gap-2 mt-4">
                      <button id="start-scanner-btn" class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                        Start Scanner
                      </button>
                      <button id="stop-scanner-btn" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors" disabled>
                        Stop Scanner
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Attendance Status & History -->
                <div class="space-y-6">
                  <!-- Current Status -->
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Attendance Status</h2>
                    
                    <div id="attendance-status" class="text-center py-8">
                      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p class="text-gray-600">Ready to scan QR code</p>
                      <p class="text-sm text-gray-500 mt-1">Select your name and course, then scan the QR code</p>
                    </div>

                    <div id="success-status" class="text-center py-8 hidden">
                      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 success-animation">
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p class="text-green-600 font-semibold">Attendance Marked Successfully!</p>
                      <div id="success-details" class="text-sm text-gray-600 mt-2"></div>
                    </div>

                    <div id="error-status" class="text-center py-8 hidden">
                      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 error-animation">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p class="text-red-600 font-semibold">Attendance Failed</p>
                      <div id="error-details" class="text-sm text-gray-600 mt-2"></div>
                    </div>
                  </div>

                  <!-- Recent Attendance -->
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Recent Attendance</h2>
                    
                    <div id="recent-attendance" class="space-y-3">
                      <div class="text-center text-gray-500 py-4">
                        <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <p class="text-sm">No recent attendance records</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Instructions -->
              <div class="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-3">How to Mark Attendance</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-800">
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p class="font-medium">Select Your Details</p>
                      <p class="text-blue-700">Choose your name and the course you're attending</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <p class="font-medium">Start Scanner</p>
                      <p class="text-blue-700">Click "Start Scanner" and allow camera access</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <p class="font-medium">Scan QR Code</p>
                      <p class="text-blue-700">Point your camera at the QR code displayed by your teacher</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <script>
        let html5QrCode = null;
        let isScanning = false;

        // DOM Elements
        const studentSelect = document.getElementById('student-select');
        const courseSelect = document.getElementById('course-select-scanner');
        const manualSessionId = document.getElementById('manual-session-id');
        const manualSubmitBtn = document.getElementById('manual-submit-btn');
        const startScannerBtn = document.getElementById('start-scanner-btn');
        const stopScannerBtn = document.getElementById('stop-scanner-btn');
        const attendanceStatus = document.getElementById('attendance-status');
        const successStatus = document.getElementById('success-status');
        const errorStatus = document.getElementById('error-status');
        const successDetails = document.getElementById('success-details');
        const errorDetails = document.getElementById('error-details');
        const recentAttendance = document.getElementById('recent-attendance');
        const scannerStatus = document.getElementById('scanner-status');

        // Enable manual submit when session ID is entered
        manualSessionId.addEventListener('input', function() {
          manualSubmitBtn.disabled = !this.value.trim() || !studentSelect.value || !courseSelect.value;
        });

        // Enable scanner when student and course are selected
        function updateScannerState() {
          const canScan = studentSelect.value && courseSelect.value;
          startScannerBtn.disabled = !canScan || isScanning;
          manualSubmitBtn.disabled = !manualSessionId.value.trim() || !canScan;
        }

        studentSelect.addEventListener('change', updateScannerState);
        courseSelect.addEventListener('change', updateScannerState);

        // Start QR Scanner
        startScannerBtn.addEventListener('click', async function() {
          if (!studentSelect.value || !courseSelect.value) {
            alert('Please select your name and course first');
            return;
          }

          try {
            html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            };

            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              onScanSuccess,
              onScanFailure
            );

            isScanning = true;
            startScannerBtn.disabled = true;
            stopScannerBtn.disabled = false;
            updateScannerStatus('active', 'Scanner Active');
            
          } catch (err) {
            console.error('Error starting scanner:', err);
            alert('Failed to start camera. Please check permissions.');
            updateScannerStatus('error', 'Scanner Error');
          }
        });

        // Stop QR Scanner
        stopScannerBtn.addEventListener('click', async function() {
          if (html5QrCode && isScanning) {
            try {
              await html5QrCode.stop();
              html5QrCode.clear();
              html5QrCode = null;
              isScanning = false;
              startScannerBtn.disabled = false;
              stopScannerBtn.disabled = true;
              updateScannerStatus('ready', 'Scanner Ready');
            } catch (err) {
              console.error('Error stopping scanner:', err);
            }
          }
        });

        // Manual submission
        manualSubmitBtn.addEventListener('click', function() {
          const sessionId = manualSessionId.value.trim();
          if (sessionId) {
            processAttendance(sessionId);
          }
        });

        // QR Scan Success Handler
        function onScanSuccess(decodedText, decodedResult) {
          try {
            const qrData = JSON.parse(decodedText);
            if (qrData.sessionId) {
              processAttendance(qrData.sessionId);
            } else {
              showError('Invalid QR code format');
            }
          } catch (error) {
            // Try treating as plain session ID
            processAttendance(decodedText);
          }
        }

        // QR Scan Failure Handler (silent)
        function onScanFailure(error) {
          // Silent handling of scan failures
        }

        // Process Attendance
        async function processAttendance(sessionId) {
          const studentId = studentSelect.value;
          const courseId = courseSelect.value;

          if (!studentId || !courseId) {
            showError('Please select your name and course');
            return;
          }

          try {
            showStatus('processing');
            
            const response = await fetch('/api/qr-attendance/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                studentId,
                courseId
              })
            });

            const result = await response.json();

            if (response.ok && result.success) {
              showSuccess(result);
              addRecentAttendance(result);
              
              // Stop scanner after successful scan
              if (isScanning) {
                stopScannerBtn.click();
              }
              
              // Clear manual input
              manualSessionId.value = '';
              updateScannerState();
              
            } else {
              showError(result.error || 'Failed to mark attendance');
            }

          } catch (error) {
            console.error('Error processing attendance:', error);
            showError('Network error. Please try again.');
          }
        }

        // Show Status Functions
        function showStatus(type) {
          attendanceStatus.classList.add('hidden');
          successStatus.classList.add('hidden');
          errorStatus.classList.add('hidden');

          if (type === 'processing') {
            attendanceStatus.classList.remove('hidden');
            attendanceStatus.innerHTML = \`
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div class="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <p class="text-blue-600 font-semibold">Processing attendance...</p>
            \`;
          }
        }

        function showSuccess(result) {
          attendanceStatus.classList.add('hidden');
          errorStatus.classList.add('hidden');
          successStatus.classList.remove('hidden');

          successDetails.innerHTML = \`
            <p><strong>\${result.student.name}</strong> (\${result.student.rollNumber})</p>
            <p>\${result.course.name} - \${result.attendance.percentage}% attendance</p>
            <p>Days Present: \${result.attendance.daysPresent}/\${result.attendance.totalDays}</p>
          \`;

          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            successStatus.classList.add('hidden');
            attendanceStatus.classList.remove('hidden');
            attendanceStatus.innerHTML = \`
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p class="text-gray-600">Ready to scan QR code</p>
              <p class="text-sm text-gray-500 mt-1">Select your name and course, then scan the QR code</p>
            \`;
          }, 5000);
        }

        function showError(message) {
          attendanceStatus.classList.add('hidden');
          successStatus.classList.add('hidden');
          errorStatus.classList.remove('hidden');

          errorDetails.textContent = message;

          // Auto-hide error message after 5 seconds
          setTimeout(() => {
            errorStatus.classList.add('hidden');
            attendanceStatus.classList.remove('hidden');
            attendanceStatus.innerHTML = \`
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <p class="text-gray-600">Ready to scan QR code</p>
              <p class="text-sm text-gray-500 mt-1">Select your name and course, then scan the QR code</p>
            \`;
          }, 5000);
        }

        function addRecentAttendance(result) {
          const emptyState = recentAttendance.querySelector('.text-center');
          if (emptyState) {
            emptyState.remove();
          }

          const attendanceItem = document.createElement('div');
          attendanceItem.className = 'flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg';
          
          attendanceItem.innerHTML = \`
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">\${result.course.name}</p>
                <p class="text-sm text-gray-600">\${result.attendance.percentage}% attendance</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-green-600">Present</p>
              <p class="text-xs text-gray-500">\${new Date().toLocaleTimeString()}</p>
            </div>
          \`;

          recentAttendance.insertBefore(attendanceItem, recentAttendance.firstChild);

          // Keep only last 5 entries
          const entries = recentAttendance.querySelectorAll('.flex');
          if (entries.length > 5) {
            entries[entries.length - 1].remove();
          }
        }

        function updateScannerStatus(status, message) {
          const indicator = scannerStatus.querySelector('div');
          const text = scannerStatus.querySelector('span');
          
          indicator.className = 'w-3 h-3 rounded-full';
          
          switch(status) {
            case 'active':
              indicator.classList.add('bg-green-500');
              break;
            case 'error':
              indicator.classList.add('bg-red-500');
              break;
            default:
              indicator.classList.add('bg-gray-400');
          }
          
          text.textContent = message;
        }

        // Initialize
        updateScannerState();

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
          if (html5QrCode && isScanning) {
            html5QrCode.stop();
          }
        });
      </script>
    </body>
    </html>
  `)
})
