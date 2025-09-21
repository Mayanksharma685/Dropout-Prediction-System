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

  // Get courses for attendance selection
  const courses = await prisma.courseSubject.findMany({
    orderBy: { name: 'asc' }
  })

  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QR Attendance - EduPulse</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        .qr-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .qr-card {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        
        .success-animation {
          animation: successPulse 0.6s ease-out;
        }
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .shuffle-animation {
          animation: shuffleRotate 0.5s ease-in-out;
        }
        @keyframes shuffleRotate {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(90deg) scale(0.8); }
          100% { transform: rotateY(0deg) scale(1); }
        }
      </style>
    </head>
    <body class="bg-gray-50">
      <div class="flex h-screen">
        ${Sidebar({ currentPath: '/dashboard/qr-attendance' })}
        
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
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">QR Attendance System</h1>
                    <p class="text-gray-600">Generate QR codes for real-time attendance marking</p>
                  </div>
                  <div class="flex items-center gap-4">
                    <div id="status-indicator" class="flex items-center gap-2">
                      <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span class="text-sm text-gray-600">System Ready</span>
                    </div>
                    <button id="refresh-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <!-- Course Selection -->
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Select Course for Attendance</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="course-select" class="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <select id="course-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select a course...</option>
                      ${courses.map(course => html`
                        <option value="${course.courseId}">${course.name} (${course.code}) - Sem ${course.semester}</option>
                      `)}
                    </select>
                  </div>
                  <div class="flex items-end">
                    <button id="generate-qr-btn" class="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
                      <svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Generate QR Code
                    </button>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- QR Code Display -->
                <div class="qr-container rounded-xl p-6">
                  <div class="qr-card rounded-lg p-6 text-center">
                    <h2 class="text-xl font-semibold text-white mb-4">Attendance QR Code</h2>
                    
                    <div id="qr-display" class="mb-4">
                      <div class="w-64 h-64 mx-auto bg-white/20 rounded-lg flex items-center justify-center">
                        <div class="text-white/60">
                          <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m4 0h.01M4 16h4m0 0h.01M4 20h4M12 8h.01"></path>
                          </svg>
                          <p class="text-sm">Select a course and click Generate</p>
                        </div>
                      </div>
                    </div>

                    <div id="qr-info" class="text-white/80 text-sm space-y-1 hidden">
                      <p>Session ID: <span id="session-id" class="font-mono"></span></p>
                      <p>Expires in: <span id="countdown" class="font-bold text-yellow-300"></span></p>
                      <p id="course-info" class="text-white/60"></p>
                    </div>

                    <div id="qr-expired" class="text-red-300 hidden">
                      <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <p>QR Code Expired</p>
                      <p class="text-sm">Generate a new code to continue</p>
                    </div>
                  </div>
                </div>

                <!-- Real-time Attendance Log -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div class="p-6 border-b border-gray-200">
                    <h2 class="text-xl font-semibold text-gray-900">Live Attendance Log</h2>
                    <p class="text-gray-600 text-sm mt-1">Real-time attendance marking updates</p>
                  </div>
                  
                  <div class="p-6">
                    <div id="attendance-log" class="space-y-3 max-h-96 overflow-y-auto">
                      <div class="text-center text-gray-500 py-8">
                        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                        <p>No attendance records yet</p>
                        <p class="text-sm">Generate a QR code to start tracking</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Statistics Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-600">Today's Sessions</p>
                      <p id="sessions-count" class="text-2xl font-bold text-gray-900">0</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-600">Students Present</p>
                      <p id="present-count" class="text-2xl font-bold text-green-600">0</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-600">Active QR</p>
                      <p id="active-qr" class="text-2xl font-bold text-purple-600">No</p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m4 0h.01M4 16h4m0 0h.01M4 20h4M12 8h.01"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-600">Success Rate</p>
                      <p id="success-rate" class="text-2xl font-bold text-orange-600">100%</p>
                    </div>
                    <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <script>
        let currentSessionId = null;
        let currentBaseSessionId = null;
        let countdownInterval = null;
        let qrShuffleInterval = null;
        let attendancePollingInterval = null;
        let sessionStartTime = null;
        let shuffleCount = 0;
        let sessionStats = {
          sessionsCount: 0,
          presentCount: 0,
          totalScans: 0,
          successfulScans: 0
        };

        // DOM Elements
        const courseSelect = document.getElementById('course-select');
        const generateBtn = document.getElementById('generate-qr-btn');
        const qrDisplay = document.getElementById('qr-display');
        const qrInfo = document.getElementById('qr-info');
        const qrExpired = document.getElementById('qr-expired');
        const sessionIdSpan = document.getElementById('session-id');
        const countdownSpan = document.getElementById('countdown');
        const courseInfoSpan = document.getElementById('course-info');
        const attendanceLog = document.getElementById('attendance-log');
        const statusIndicator = document.getElementById('status-indicator');
        const refreshBtn = document.getElementById('refresh-btn');
        const shuffleStatus = document.getElementById('shuffle-status');
        const nextShuffleSpan = document.getElementById('next-shuffle');

        // Enable generate button when course is selected
        courseSelect.addEventListener('change', function() {
          generateBtn.disabled = !this.value;
        });

        // Generate QR Code
        generateBtn.addEventListener('click', async function() {
          const courseId = courseSelect.value;
          if (!courseId) return;

          try {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>Generating...';

            const response = await fetch('/api/qr-attendance');
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error('HTTP ' + response.status + ': ' + errorText);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const responseText = await response.text();
              throw new Error('Expected JSON response, got: ' + responseText);
            }

            const data = await response.json();
            
            console.log('QR Generation Response:', data); // Debug log
            
            // Initialize session data
            currentBaseSessionId = data.baseSessionId || data.sessionId;
            sessionStartTime = Math.floor(Date.now() / 1000);
            shuffleCount = 0;
            
            displayQRCode(data, courseId);
            startCountdown(data.createdAt || sessionStartTime);
            startQRShuffling();
            startAttendancePolling();
            updateStats();
            updateStatus('active', 'QR Code Active');
          } catch (error) {
            console.error('Error generating QR:', error);
            alert('Failed to generate QR code: ' + error.message);
            updateStatus('error', 'Generation Failed');
          } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<svg class="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>Generate QR Code';
          }
        });

        // Function to generate shuffled session ID
        function generateShuffledSessionId(baseSessionId, shuffleIndex) {
          return baseSessionId + '_shuffle_' + shuffleIndex + '_' + Math.floor(Date.now() / 1000);
        }

        // Function to generate QR code image from text
        async function generateQRImage(text) {
          try {
            // Use a simple QR code generation approach
            const qrText = encodeURIComponent(text);
            const qrImageUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=\${qrText}&bgcolor=ffffff&color=000000&format=png&margin=10\`;
            return qrImageUrl;
          } catch (error) {
            console.error('Error generating QR image:', error);
            return null;
          }
        }

        function displayQRCode(data, courseId) {
          currentSessionId = data.sessionId;
          currentBaseSessionId = data.baseSessionId || data.sessionId;
          
          const selectedCourse = courseSelect.options[courseSelect.selectedIndex];
          const courseName = selectedCourse.text;

          qrDisplay.innerHTML = \`
            <div class="relative">
              <img src="\${data.qrImage}" alt="QR Code" class="w-64 h-64 mx-auto rounded-lg shadow-lg bg-white p-4">
              <div class="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full">
                #\${(data.shuffleIndex !== undefined ? data.shuffleIndex : shuffleCount) + 1}
              </div>
            </div>
          \`;

          // Handle both old and new response formats
          const displaySessionId = data.baseSessionId || data.sessionId;
          const shuffleInfo = ' #' + (shuffleCount + 1);
          sessionIdSpan.textContent = displaySessionId.substring(0, 8) + '...' + shuffleInfo;
          courseInfoSpan.textContent = \`Course: \${courseName}\`;
          
          qrInfo.classList.remove('hidden');
          qrExpired.classList.add('hidden');
          
          // Show shuffle status
          if (shuffleStatus) {
            shuffleStatus.classList.remove('hidden');
          }
        }

        function startQRShuffling() {
          if (qrShuffleInterval) clearInterval(qrShuffleInterval);
          
          console.log('Starting QR shuffling every 5 seconds...');
          
          // Shuffle QR code every 5 seconds
          qrShuffleInterval = setInterval(async () => {
            if (!currentBaseSessionId) return;
            
            // Check if session is still active (30 seconds total)
            const now = Math.floor(Date.now() / 1000);
            const elapsed = now - sessionStartTime;
            
            if (elapsed >= 30) {
              console.log('Session expired, stopping shuffle');
              stopQRShuffling();
              return;
            }
            
            // Increment shuffle count (0-5 for 6 total shuffles)
            shuffleCount++;
            if (shuffleCount >= 6) {
              console.log('All shuffles completed, stopping');
              stopQRShuffling();
              return;
            }
            
            try {
              // Generate new shuffled session ID
              const shuffledSessionId = generateShuffledSessionId(currentBaseSessionId, shuffleCount);
              
              // Generate new QR code image
              const qrImageUrl = await generateQRImage(JSON.stringify({
                sessionId: shuffledSessionId,
                shuffleIndex: shuffleCount,
                baseSessionId: currentBaseSessionId,
                timestamp: now
              }));
              
              if (!qrImageUrl) {
                console.error('Failed to generate QR image');
                return;
              }
              
              // Add shuffle animation to existing QR
              const existingImg = qrDisplay.querySelector('img');
              if (existingImg) {
                existingImg.classList.add('shuffle-animation');
              }
              
              console.log(\`Shuffling to #\${shuffleCount + 1}\`);
              
              // Update QR display with new shuffled code after animation
              setTimeout(() => {
                qrDisplay.innerHTML = \`
                  <div class="relative">
                    <img src="\${qrImageUrl}" alt="QR Code" class="w-64 h-64 mx-auto rounded-lg shadow-lg bg-white p-4 fade-in">
                    <div class="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      #\${shuffleCount + 1}
                    </div>
                    <div class="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                      SHUFFLED
                    </div>
                  </div>
                \`;
                
                // Update session info
                sessionIdSpan.textContent = currentBaseSessionId.substring(0, 8) + '... #' + (shuffleCount + 1);
                currentSessionId = shuffledSessionId;
              }, 250);
              
            } catch (error) {
              console.error('Error shuffling QR:', error);
            }
          }, 5000);
        }

        function stopQRShuffling() {
          if (qrShuffleInterval) {
            clearInterval(qrShuffleInterval);
            qrShuffleInterval = null;
          }
        }

        function startCountdown(createdAt) {
          if (countdownInterval) clearInterval(countdownInterval);

          // Use session start time for consistency
          const startTime = sessionStartTime || Math.floor(Date.now() / 1000);

          countdownInterval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const elapsed = now - startTime;
            const remaining = Math.max(0, 30 - elapsed);

            if (remaining > 0) {
              countdownSpan.textContent = remaining + 's';
              countdownSpan.className = remaining <= 10 ? 'font-bold text-red-300 pulse-animation' : 'font-bold text-yellow-300';
              
              // Show shuffle progress
              const shuffleProgress = Math.floor(elapsed / 5) + 1;
              if (shuffleProgress <= 6) {
                const nextShuffleIn = 5 - (elapsed % 5);
                if (nextShuffleIn <= 5 && shuffleProgress < 6 && nextShuffleSpan) {
                  nextShuffleSpan.textContent = nextShuffleIn;
                }
              }
            } else {
              // QR Expired
              clearInterval(countdownInterval);
              stopQRShuffling();
              showExpiredQR();
              stopAttendancePolling();
              updateStatus('expired', 'QR Code Expired');
              
              // Reset shuffle count for next session
              shuffleCount = 0;
            }
          }, 1000);
        }

        function showExpiredQR() {
          qrInfo.classList.add('hidden');
          qrExpired.classList.remove('hidden');
          qrDisplay.innerHTML = \`
            <div class="w-64 h-64 mx-auto bg-white/10 rounded-lg flex items-center justify-center">
              <div class="text-white/60 text-center">
                <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm">QR Code Expired</p>
              </div>
            </div>
          \`;
          currentSessionId = null;
          currentBaseSessionId = null;
          sessionStartTime = null;
          shuffleCount = 0;
        }

        function startAttendancePolling() {
          if (attendancePollingInterval) clearInterval(attendancePollingInterval);
          
          // Poll for new attendance every 2 seconds
          attendancePollingInterval = setInterval(async () => {
            if (!currentSessionId) return;
            
            // In a real implementation, you'd poll for new attendance records
            // For now, we'll simulate this functionality
          }, 2000);
        }

        function stopAttendancePolling() {
          if (attendancePollingInterval) {
            clearInterval(attendancePollingInterval);
            attendancePollingInterval = null;
          }
        }

        function addAttendanceRecord(student, course, timestamp) {
          const logEntry = document.createElement('div');
          logEntry.className = 'flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg fade-in success-animation';
          
          logEntry.innerHTML = \`
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">\${student.name}</p>
                <p class="text-sm text-gray-600">\${student.rollNumber} • \${course.name}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-green-600">Present</p>
              <p class="text-xs text-gray-500">\${new Date(timestamp).toLocaleTimeString()}</p>
            </div>
          \`;

          // Remove empty state if present
          const emptyState = attendanceLog.querySelector('.text-center');
          if (emptyState) {
            emptyState.remove();
          }

          attendanceLog.insertBefore(logEntry, attendanceLog.firstChild);
          
          // Keep only last 10 entries
          const entries = attendanceLog.querySelectorAll('.fade-in');
          if (entries.length > 10) {
            entries[entries.length - 1].remove();
          }

          // Update stats
          sessionStats.presentCount++;
          sessionStats.successfulScans++;
          updateStatsDisplay();
        }

        function updateStats() {
          sessionStats.sessionsCount++;
          updateStatsDisplay();
        }

        function updateStatsDisplay() {
          document.getElementById('sessions-count').textContent = sessionStats.sessionsCount;
          document.getElementById('present-count').textContent = sessionStats.presentCount;
          document.getElementById('active-qr').textContent = currentSessionId ? 'Yes' : 'No';
          
          const successRate = sessionStats.totalScans > 0 
            ? Math.round((sessionStats.successfulScans / sessionStats.totalScans) * 100) 
            : 100;
          document.getElementById('success-rate').textContent = successRate + '%';
        }

        function updateStatus(status, message) {
          const indicator = statusIndicator.querySelector('div');
          const text = statusIndicator.querySelector('span');
          
          indicator.className = 'w-3 h-3 rounded-full';
          
          switch(status) {
            case 'active':
              indicator.classList.add('bg-green-500', 'pulse-animation');
              break;
            case 'expired':
              indicator.classList.add('bg-yellow-500');
              break;
            case 'error':
              indicator.classList.add('bg-red-500');
              break;
            default:
              indicator.classList.add('bg-gray-400');
          }
          
          text.textContent = message;
        }

        // Refresh button
        refreshBtn.addEventListener('click', function() {
          location.reload();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
          if (countdownInterval) clearInterval(countdownInterval);
          if (qrShuffleInterval) clearInterval(qrShuffleInterval);
          if (attendancePollingInterval) clearInterval(attendancePollingInterval);
        });

        // Initialize stats display
        updateStatsDisplay();
      </script>
    </body>
    </html>
  `)
})
