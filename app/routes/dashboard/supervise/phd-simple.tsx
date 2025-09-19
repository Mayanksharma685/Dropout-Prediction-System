import { createRoute } from 'honox/factory'
import Header from '@/components/dashboard/Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default createRoute(async (c) => {
  // Get teacher ID from cookies for authentication
  const teacherIdRaw = c.req.header('Cookie')?.match(/uid=([^;]+)/)?.[1]
  
  if (!teacherIdRaw) {
    return c.redirect('/login')
  }

  const teacherId = decodeURIComponent(teacherIdRaw)

  // Fetch teacher info for header
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const teacher = await prisma.teacher.findUnique({ where: { teacherId } })

  return c.render(
    <html>
      <head>
        <title>PhD Supervision (Simple) - EduPulse</title>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/supervise/phd-simple" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-6">PhD Supervision (Simple Version)</h1>
                
                <div class="bg-white p-6 rounded-lg shadow mb-6">
                  <h2 class="text-lg font-semibold mb-4">Debug Info:</h2>
                  <p><strong>Teacher ID:</strong> {teacherId}</p>
                  <p><strong>Teacher Name:</strong> {teacher?.name || 'N/A'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <button 
                    onclick="testAPI('/api/debug-data')"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Test Debug Data
                  </button>
                  
                  <button 
                    onclick="testAPI('/api/phd-analytics')"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Test PhD Analytics
                  </button>
                  
                  <button 
                    onclick="createTestData()"
                    class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Create Test Data
                  </button>
                </div>
                
                <div id="result" class="bg-white p-6 rounded-lg shadow">
                  <h3 class="font-semibold mb-2">API Test Results:</h3>
                  <div id="output" class="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                    Click a button above to test the APIs...
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            function log(message) {
              const output = document.getElementById('output');
              const timestamp = new Date().toLocaleTimeString();
              output.innerHTML += '[' + timestamp + '] ' + message + '\\n';
              console.log(message);
            }
            
            function testAPI(url) {
              log('Testing: ' + url);
              const output = document.getElementById('output');
              
              fetch(url)
                .then(response => {
                  log('Response Status: ' + response.status);
                  log('Response Headers: ' + JSON.stringify([...response.headers.entries()]));
                  return response.text();
                })
                .then(text => {
                  log('Response Text Length: ' + text.length);
                  log('Response Text: ' + text.substring(0, 500) + (text.length > 500 ? '...' : ''));
                  
                  try {
                    const data = JSON.parse(text);
                    log('Parsed JSON successfully');
                    log('JSON Data: ' + JSON.stringify(data, null, 2));
                  } catch (e) {
                    log('JSON Parse Error: ' + e.message);
                  }
                })
                .catch(error => {
                  log('Fetch Error: ' + error.message);
                });
            }
            
            function createTestData() {
              log('Creating test data...');
              
              fetch('/api/create-test-data', { method: 'POST' })
                .then(response => {
                  log('Create Test Data Status: ' + response.status);
                  return response.text();
                })
                .then(text => {
                  log('Create Test Data Response: ' + text);
                  
                  try {
                    const data = JSON.parse(text);
                    log('Test data creation result: ' + JSON.stringify(data, null, 2));
                  } catch (e) {
                    log('JSON Parse Error: ' + e.message);
                  }
                })
                .catch(error => {
                  log('Create Test Data Error: ' + error.message);
                });
            }
            
            // Auto-run debug test on page load
            document.addEventListener('DOMContentLoaded', function() {
              log('Page loaded successfully');
              log('Teacher ID: ${teacherId}');
              setTimeout(() => testAPI('/api/debug-data'), 1000);
            });
          `
        }} />
      </body>
    </html>
  )
})
