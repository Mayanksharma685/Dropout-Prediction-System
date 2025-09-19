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
        <title>Project Supervision - EduPulse</title>
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
            .status-suspended { @apply bg-red-100 text-red-800; }
          `}
        </style>
      </head>
      <body>
        <div class="flex h-screen bg-gray-100">
          <Sidebar currentPath="/dashboard/supervise/projects" />
          <div class="flex-1 flex flex-col overflow-hidden">
            <Header uid={teacherId} userName={teacher?.name} userEmail={teacher?.email} userPicture={teacher?.picture} />
            <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
              <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">Project Supervision</h1>
                    <p class="text-gray-600 mt-1">Manage and track student projects</p>
                  </div>
                  <button 
                    onclick="openModal('addProjectModal')"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>+</span>
                    Add New Project
                  </button>
                </div>

                {/* Projects List */}
                <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Active Projects</h2>
                  </div>
                  <div id="projects-container" class="divide-y divide-gray-200">
                    {/* Projects will be loaded here */}
                  </div>
                </div>

                {/* Add Project Modal */}
                <div id="addProjectModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Add New Project</h3>
                      <button onclick="closeModal('addProjectModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="addProjectForm" class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter project title"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          name="description" 
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Project description (optional)"
                        ></textarea>
                      </div>
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
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Project
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('addProjectModal')"
                          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Edit Project Modal */}
                <div id="editProjectModal" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div class="flex justify-between items-center mb-4">
                      <h3 class="text-lg font-semibold text-gray-900">Edit Project</h3>
                      <button onclick="closeModal('editProjectModal')" class="text-gray-400 hover:text-gray-600">
                        <span class="text-xl">×</span>
                      </button>
                    </div>
                    <form id="editProjectForm" class="space-y-4">
                      <input type="hidden" name="projectId" id="editProjectId" />
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
                        <input 
                          type="text" 
                          name="title" 
                          id="editTitle"
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          name="description" 
                          id="editDescription"
                          rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
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
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                      <div class="flex gap-3 pt-4">
                        <button 
                          type="submit"
                          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Update Project
                        </button>
                        <button 
                          type="button"
                          onclick="closeModal('editProjectModal')"
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

            // Load projects on page load
            document.addEventListener('DOMContentLoaded', function() {
              loadProjects();
            });

            // Load projects function
            async function loadProjects() {
              try {
                const response = await fetch('/api/projects');
                const projects = await response.json();
                
                const container = document.getElementById('projects-container');
                
                if (projects.length === 0) {
                  container.innerHTML = \`
                    <div class="p-8 text-center text-gray-500">
                      <div class="text-4xl mb-4">📋</div>
                      <p>No projects found. Add your first project to get started.</p>
                    </div>
                  \`;
                  return;
                }
                
                container.innerHTML = projects.map(project => \`
                  <div class="p-6 hover:bg-gray-50">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h3 class="text-lg font-semibold text-gray-900">\${project.title}</h3>
                          <span class="px-2 py-1 text-xs font-medium rounded-full status-\${project.status.toLowerCase()}">\${project.status}</span>
                        </div>
                        \${project.description ? \`<p class="text-gray-600 mb-3">\${project.description}</p>\` : ''}
                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="font-medium text-gray-700">Student:</span>
                            <span class="text-gray-600">\${project.student.name} (\${project.student.studentId})</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Department:</span>
                            <span class="text-gray-600">\${project.student.department || 'N/A'}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">Start Date:</span>
                            <span class="text-gray-600">\${new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span class="font-medium text-gray-700">End Date:</span>
                            <span class="text-gray-600">\${project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex gap-2 ml-4">
                        <button 
                          onclick="editProject(\${project.projectId})"
                          class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onclick="deleteProject(\${project.projectId})"
                          class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                \`).join('');
              } catch (error) {
                console.error('Error loading projects:', error);
                document.getElementById('projects-container').innerHTML = \`
                  <div class="p-8 text-center text-red-500">
                    <p>Error loading projects. Please try again.</p>
                  </div>
                \`;
              }
            }

            // Add project form handler
            document.getElementById('addProjectForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/projects', {
                  method: 'POST',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('addProjectModal');
                  this.reset();
                  loadProjects();
                  alert('Project added successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error adding project:', error);
                alert('Error adding project. Please try again.');
              }
            });

            // Edit project function
            async function editProject(projectId) {
              try {
                const response = await fetch('/api/projects');
                const projects = await response.json();
                const project = projects.find(p => p.projectId === projectId);
                
                if (project) {
                  document.getElementById('editProjectId').value = project.projectId;
                  document.getElementById('editTitle').value = project.title;
                  document.getElementById('editDescription').value = project.description || '';
                  document.getElementById('editStudentId').value = project.studentId;
                  document.getElementById('editStartDate').value = project.startDate.split('T')[0];
                  document.getElementById('editEndDate').value = project.endDate ? project.endDate.split('T')[0] : '';
                  document.getElementById('editStatus').value = project.status;
                  
                  openModal('editProjectModal');
                }
              } catch (error) {
                console.error('Error loading project for edit:', error);
                alert('Error loading project details.');
              }
            }

            // Edit project form handler
            document.getElementById('editProjectForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const formData = new FormData(this);
              
              try {
                const response = await fetch('/api/projects', {
                  method: 'PUT',
                  body: formData
                });
                
                if (response.ok) {
                  closeModal('editProjectModal');
                  loadProjects();
                  alert('Project updated successfully!');
                } else {
                  const error = await response.json();
                  alert('Error: ' + error.error);
                }
              } catch (error) {
                console.error('Error updating project:', error);
                alert('Error updating project. Please try again.');
              }
            });

            // Delete project function
            async function deleteProject(projectId) {
              if (confirm('Are you sure you want to delete this project?')) {
                try {
                  const response = await fetch(\`/api/projects?projectId=\${projectId}\`, {
                    method: 'DELETE'
                  });
                  
                  if (response.ok) {
                    loadProjects();
                    alert('Project deleted successfully!');
                  } else {
                    const error = await response.json();
                    alert('Error: ' + error.error);
                  }
                } catch (error) {
                  console.error('Error deleting project:', error);
                  alert('Error deleting project. Please try again.');
                }
              }
            }
          `}
        </script>
      </body>
    </html>
  )
})

