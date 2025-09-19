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
        <title>Part Time Fellowship - EduPulse</title>
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
        <style>
          {`
            .modal {
              display: none;
            }
            .modal.active {
              display: flex;
            }
            .status-active { @apply bg-green-100 text-green-800; }
            .status-completed { @apply bg-blue-100 text-blue-800; }
            .status-terminated { @apply bg-red-100 text-red-800; }
          `}
        </style>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/supervise/fellowship/part-time" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">Part Time Fellowships</h1>
                    <p class="text-gray-600 mt-1">Manage part-time research fellowships</p>
                    <div class="flex gap-4 mt-2">
                      <a 
                        href="/dashboard/supervise/fellowship/full-time"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        → View Full Time Fellowships
                      </a>
                    </div>
                  </div>
                  <button 
                    onclick="openModal('addFellowshipModal')"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>+</span>
                    Add Part Time Fellowship
                  </button>
                </div>

                {/* Fellowship Guidelines */}
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div class="flex items-start">
                    <div class="text-orange-400 mr-3 text-xl">💡</div>
                    <div>
                      <h4 class="text-sm font-medium text-orange-800">Part Time Fellowship Guidelines</h4>
                      <p class="text-sm text-orange-700 mt-1">
                        Part-time fellowships are typically for students who are pursuing research alongside other commitments. 
                        The amount is usually 50-70% of full-time fellowship rates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fellowships List */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Part Time Fellowship Awards</h2>
                  </div>
                  <div id="fellowships-container" class="divide-y divide-gray-200">
                    {/* Fellowships will be loaded here */}
                  </div>
                </div>

                {/* Add Fellowship Modal */}
                <div id="addFellowshipModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Add Part Time Fellowship</h3>
                      <button onclick="closeModal('addFellowshipModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="addFellowshipForm" class="space-y-4">
                      <input type="hidden" name="type" value="Part Time" />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input 
                          type="text" 
                          name="studentId" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter student ID"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fellowship Amount (₹)</label>
                        <input 
                          type="number" 
                          name="amount" 
                          required
                          min="0"
                          step="0.01"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter monthly amount (typically 50-70% of full-time)"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <input 
                          type="number" 
                          name="duration" 
                          required
                          min="1"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Duration in months"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                        <input 
                          type="date" 
                          name="endDate"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          name="status"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Fellowship
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('addFellowshipModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Edit Fellowship Modal */}
                <div id="editFellowshipModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Edit Part Time Fellowship</h3>
                      <button onclick="closeModal('editFellowshipModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="editFellowshipForm" class="space-y-4">
                      <input type="hidden" name="fellowshipId" id="editFellowshipId" />
                      <input type="hidden" name="type" value="Part Time" />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input 
                          type="text" 
                          name="studentId" 
                          id="editStudentId"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Fellowship Amount (₹)</label>
                        <input 
                          type="number" 
                          name="amount" 
                          id="editAmount"
                          required
                          min="0"
                          step="0.01"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <input 
                          type="number" 
                          name="duration" 
                          id="editDuration"
                          required
                          min="1"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          name="startDate" 
                          id="editStartDate"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                          type="date" 
                          name="endDate"
                          id="editEndDate"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                          name="status"
                          id="editStatus"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Terminated">Terminated</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update Fellowship
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('editFellowshipModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <script>
          {`
            // Modal functions
            function openModal(modalId) {
              document.getElementById(modalId).classList.add('active');
            }

            function closeModal(modalId) {
              document.getElementById(modalId).classList.remove('active');
            }

            // Load fellowships on page load
            document.addEventListener('DOMContentLoaded', function() {
              loadFellowships();
            });

            // Load fellowships function
            async function loadFellowships() {
              try {
                const response = await fetch('/api/fellowships?type=Part Time');
                const fellowships = await response.json();
                
                const container = document.getElementById('fellowships-container');
                
                if (fellowships.length === 0) {
                  container.innerHTML = \`
                    <div class="p-8 text-center text-gray-500">
                      <div class="text-4xl mb-4">💰</div>
                      <p>No part-time fellowships found. Add your first fellowship to get started.</p>
                    </div>
                  \`;
                  return;
                }
                
                container.innerHTML = fellowships.map(fellowship => \`
                  <div class="p-6 hover:bg-gray-50">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-lg font-semibold text-gray-900">Part Time Fellowship</h3>
                          <span class="px-2 py-1 text-xs font-medium rounded-full status-\${fellowship.status.toLowerCase()}">\${fellowship.status}</span>
                          <span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Part Time</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span class="font-medium text-gray-700">Student:</span>
                            <span class="text-gray-600">\${fellowship.student.name} (\${fellowship.student.studentId})</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Department:</span>
                            <span class="text-gray-600">\${fellowship.student.department || 'N/A'}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Amount:</span>
                            <span class="text-gray-600 font-semibold">₹\${fellowship.amount.toLocaleString()}/month</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Duration:</span>
                            <span class="text-gray-600">\${fellowship.duration} months</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Start Date:</span>
                            <span class="text-gray-600">\${new Date(fellowship.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">End Date:</span>
                            <span class="text-gray-600">\${fellowship.endDate ? new Date(fellowship.endDate).toLocaleDateString() : 'Ongoing'}</span>
                          </div>
                        </div>
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div class="text-sm">
                            <span class="font-medium text-orange-800">Total Fellowship Value:</span>
                            <span class="text-orange-700 font-semibold">₹\${(fellowship.amount * fellowship.duration).toLocaleString()}</span>
                            <span class="text-orange-600 ml-2">(Part-time rate)</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          onclick="editFellowship(\${fellowship.fellowshipId})"
                          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onclick="deleteFellowship(\${fellowship.fellowshipId})"
                          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Error loading fellowships:', error);
                document.getElementById('fellowships-container').innerHTML = \`
                  <div class="p-8 text-center text-red-500">
                    <p>Error loading fellowships. Please try again.</p>
                  </div>
                \`;
              }
            }

            // Add fellowship form handler
            document.getElementById('addFellowshipForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/fellowships', {
                  method: 'POST',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('addFellowshipModal');
                  this.reset();
                  loadFellowships();
                  alert('Fellowship added successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error adding fellowship:', error);
                alert('Error adding fellowship. Please try again.');
              }
            });

            // Edit fellowship function
            async function editFellowship(fellowshipId) {
              try {
                const response = await fetch('/api/fellowships?type=Part Time');
                const fellowships = await response.json();
                const fellowship = fellowships.find(f => f.fellowshipId === fellowshipId);
                
                if (fellowship) {
                  document.getElementById('editFellowshipId').value = fellowship.fellowshipId;
                  document.getElementById('editStudentId').value = fellowship.studentId;
                  document.getElementById('editAmount').value = fellowship.amount;
                  document.getElementById('editDuration').value = fellowship.duration;
                  document.getElementById('editStartDate').value = fellowship.startDate.split('T')[0];
                  document.getElementById('editEndDate').value = fellowship.endDate ? fellowship.endDate.split('T')[0] : '';
                  document.getElementById('editStatus').value = fellowship.status;
                  
                  openModal('editFellowshipModal');
                }
              } catch (error) {
                console.error('Error loading fellowship for edit:', error);
                alert('Error loading fellowship details.');
              }
            }

            // Edit fellowship form handler
            document.getElementById('editFellowshipForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/fellowships', {
                  method: 'PUT',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('editFellowshipModal');
                  loadFellowships();
                  alert('Fellowship updated successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error updating fellowship:', error);
                alert('Error updating fellowship. Please try again.');
              }
            });

            // Delete fellowship function
            async function deleteFellowship(fellowshipId) {
              if (confirm('Are you sure you want to delete this fellowship?')) {
                try {
                  const response = await fetch(\`/api/fellowships?fellowshipId=\${fellowshipId}\`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    loadFellowships();
                    alert('Fellowship deleted successfully!');
                  } else {
                    const error = await response.json();
                    alert('Error: ' + error.error);
                  }
                } catch (error) {
                  console.error('Error deleting fellowship:', error);
                  alert('Error deleting fellowship. Please try again.');
                }
              }
            }
          `}
        </script>
      </body>
    </html>
  )
})
