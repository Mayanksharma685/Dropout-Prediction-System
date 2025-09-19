import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!uid) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const projects = await prisma.project.findMany({
      where: {
        supervisorId: uid
      },
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true,
            currentSemester: true
          }
        },
        supervisor: {
          select: {
            teacherId: true,
            name: true,
            email: true,
            department: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })
    
    return c.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!uid) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const formData = await c.req.formData()
    
    const projectData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      studentId: formData.get('studentId') as string,
      supervisorId: uid,
      startDate: new Date(formData.get('startDate') as string),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : null,
      status: (formData.get('status') as string) || 'Active'
    }
    
    // Validate required fields
    if (!projectData.title || !projectData.studentId || !projectData.startDate) {
      return c.json({ error: 'Missing required fields: title, studentId, startDate' }, 400)
    }
    
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { studentId: projectData.studentId }
    })
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    const created = await prisma.project.create({ 
      data: projectData,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true,
            currentSemester: true
          }
        }
      }
    })
    
    return c.json(created, 201)
  } catch (error) {
    console.error('Error creating project:', error)
    return c.json({ error: 'Failed to create project: ' + (error as Error).message }, 500)
  }
})

export const PUT = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!uid) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const formData = await c.req.formData()
    const projectId = parseInt(formData.get('projectId') as string)
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400)
    }
    
    // Verify project exists and belongs to the authenticated teacher
    const existingProject = await prisma.project.findFirst({
      where: {
        projectId: projectId,
        supervisorId: uid
      }
    })
    
    if (!existingProject) {
      return c.json({ error: 'Project not found or access denied' }, 404)
    }
    
    const updateData: any = {}
    
    if (formData.get('title')) updateData.title = formData.get('title') as string
    if (formData.get('description')) updateData.description = formData.get('description') as string
    if (formData.get('studentId')) updateData.studentId = formData.get('studentId') as string
    if (formData.get('startDate')) updateData.startDate = new Date(formData.get('startDate') as string)
    if (formData.get('endDate')) updateData.endDate = new Date(formData.get('endDate') as string)
    if (formData.get('status')) updateData.status = formData.get('status') as string
    
    const updated = await prisma.project.update({
      where: { projectId: projectId },
      data: updateData,
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
            department: true,
            currentSemester: true
          }
        }
      }
    })
    
    return c.json(updated)
  } catch (error) {
    console.error('Error updating project:', error)
    return c.json({ error: 'Failed to update project: ' + (error as Error).message }, 500)
  }
})

export const DELETE = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const uid = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!uid) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  
  try {
    const url = new URL(c.req.url)
    const projectId = parseInt(url.searchParams.get('projectId') || '')
    
    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400)
    }
    
    // Verify project exists and belongs to the authenticated teacher
    const existingProject = await prisma.project.findFirst({
      where: {
        projectId: projectId,
        supervisorId: uid
      }
    })
    
    if (!existingProject) {
      return c.json({ error: 'Project not found or access denied' }, 404)
    }
    
    await prisma.project.delete({
      where: { projectId: projectId }
    })
    
    return c.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return c.json({ error: 'Failed to delete project: ' + (error as Error).message }, 500)
  }
})
