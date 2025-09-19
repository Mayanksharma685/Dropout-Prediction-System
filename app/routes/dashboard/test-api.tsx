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
        <title>API Test - EduPulse</title>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/test-api" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-6">API Testing Page</h1>
                
                <div class="space-y-4">
                  <button 
                    onclick="testPhdAnalytics()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Test PhD Analytics API
                  </button>
                  
                  <button 
                    onclick="testFellowshipAnalytics()"
                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Test Fellowship Analytics API
                  </button>
                  
                  <button 
                    onclick="testDebugData()"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Test Debug Data API
                  </button>
                  
                  <button 
                    onclick="createTestData()"
                    class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Create Test Data
                  </button>
                </div>
                
                <div id="results" class="mt-6 p-4 bg-white rounded-lg border">
                  <h3 class="font-semibold mb-2">Results:</h3>
                  <pre id="output" class="text-sm bg-gray-100 p-2 rounded overflow-auto max-h-96"></pre>
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
              output.textContent += '[' + timestamp + '] ' + message + '\\n';
              console.log(message);
            }
            
            async function testPhdAnalytics() {
              log('Testing PhD Analytics API...');
              try {
                const response = await fetch('/api/phd-analytics');
                log('PhD Analytics Response Status: ' + response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  log('PhD Analytics Data: ' + JSON.stringify(data, null, 2));
                } else {
                  const errorText = await response.text();
                  log('PhD Analytics Error: ' + errorText);
                }
              } catch (error) {
                log('PhD Analytics Exception: ' + error.message);
              }
            }
            
            async function testFellowshipAnalytics() {
              log('Testing Fellowship Analytics API...');
              try {
                const response = await fetch('/api/fellowship-analytics?type=Full Time');
                log('Fellowship Analytics Response Status: ' + response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  log('Fellowship Analytics Data: ' + JSON.stringify(data, null, 2));
                } else {
                  const errorText = await response.text();
                  log('Fellowship Analytics Error: ' + errorText);
                }
              } catch (error) {
                log('Fellowship Analytics Exception: ' + error.message);
              }
            }
            
            async function testDebugData() {
              log('Testing Debug Data API...');
              try {
                const response = await fetch('/api/debug-data');
                log('Debug Data Response Status: ' + response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  log('Debug Data: ' + JSON.stringify(data, null, 2));
                } else {
                  const errorText = await response.text();
                  log('Debug Data Error: ' + errorText);
                }
              } catch (error) {
                log('Debug Data Exception: ' + error.message);
              }
            }
            
            async function createTestData() {
              log('Creating Test Data...');
              try {
                const response = await fetch('/api/create-test-data', {
                  method: 'POST'
                });
                log('Create Test Data Response Status: ' + response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  log('Test Data Created: ' + JSON.stringify(data, null, 2));
                } else {
                  const errorText = await response.text();
                  log('Create Test Data Error: ' + errorText);
                }
              } catch (error) {
                log('Create Test Data Exception: ' + error.message);
              }
            }
            
            // Auto-run debug test on page load
            document.addEventListener('DOMContentLoaded', function() {
              log('Page loaded. Teacher ID: ${teacherId}');
              testDebugData();
            });
          `
        }} />
      </body>
    </html>
  )
})
