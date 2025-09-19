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
        <title>Simple Test - EduPulse</title>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/simple-test" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-6">Simple API Test</h1>
                
                <div class="bg-white p-6 rounded-lg shadow">
                  <h2 class="text-lg font-semibold mb-4">Teacher Info:</h2>
                  <p><strong>Teacher ID:</strong> {teacherId}</p>
                  <p><strong>Name:</strong> {teacher?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {teacher?.email || 'N/A'}</p>
                </div>
                
                <div class="mt-6 space-y-4">
                  <button 
                    onclick="testAPI()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Test PhD Analytics API
                  </button>
                  
                  <div id="result" class="mt-4 p-4 bg-gray-100 rounded-lg min-h-32">
                    <p>Click the button to test the API...</p>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{
          __html: `
            function testAPI() {
              const resultDiv = document.getElementById('result');
              resultDiv.innerHTML = '<p>Testing API...</p>';
              
              fetch('/api/phd-analytics')
                .then(response => {
                  resultDiv.innerHTML += '<p>Response Status: ' + response.status + '</p>';
                  return response.text();
                })
                .then(text => {
                  resultDiv.innerHTML += '<p>Response Text: ' + text + '</p>';
                  try {
                    const data = JSON.parse(text);
                    resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                  } catch (e) {
                    resultDiv.innerHTML += '<p>JSON Parse Error: ' + e.message + '</p>';
                  }
                })
                .catch(error => {
                  resultDiv.innerHTML += '<p>Error: ' + error.message + '</p>';
                });
            }
          `
        }} />
      </body>
    </html>
  )
})
