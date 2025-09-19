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
    const phdSupervisions = await prisma.phdSupervision.findMany({
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
    
    return c.json(phdSupervisions)
  } catch (error) {
    console.error('Error fetching PhD supervisions:', error)
    return c.json({ error: 'Failed to fetch PhD supervisions' }, 500)
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
    
    const phdData = {
      title: formData.get('title') as string,
      researchArea: formData.get('researchArea') as string,
      studentId: formData.get('studentId') as string,
      supervisorId: uid,
      startDate: new Date(formData.get('startDate') as string),
      expectedEnd: formData.get('expectedEnd') ? new Date(formData.get('expectedEnd') as string) : null,
      status: (formData.get('status') as string) || 'Ongoing'
    }
    
    // Validate required fields
    if (!phdData.title || !phdData.researchArea || !phdData.studentId || !phdData.startDate) {
      return c.json({ error: 'Missing required fields: title, researchArea, studentId, startDate' }, 400)
    }
    
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { studentId: phdData.studentId }
    })
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    const created = await prisma.phdSupervision.create({ 
      data: phdData,
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
    console.error('Error creating PhD supervision:', error)
    return c.json({ error: 'Failed to create PhD supervision: ' + (error as Error).message }, 500)
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
    const phdId = parseInt(formData.get('phdId') as string)
    
    if (!phdId) {
      return c.json({ error: 'PhD ID is required' }, 400)
    }
    
    // Verify PhD supervision exists and belongs to the authenticated teacher
    const existingPhd = await prisma.phdSupervision.findFirst({
      where: {
        phdId: phdId,
        supervisorId: uid
      }
    })
    
    if (!existingPhd) {
      return c.json({ error: 'PhD supervision not found or access denied' }, 404)
    }
    
    const updateData: any = {}
    
    if (formData.get('title')) updateData.title = formData.get('title') as string
    if (formData.get('researchArea')) updateData.researchArea = formData.get('researchArea') as string
    if (formData.get('studentId')) updateData.studentId = formData.get('studentId') as string
    if (formData.get('startDate')) updateData.startDate = new Date(formData.get('startDate') as string)
    if (formData.get('expectedEnd')) updateData.expectedEnd = new Date(formData.get('expectedEnd') as string)
    if (formData.get('status')) updateData.status = formData.get('status') as string
    
    const updated = await prisma.phdSupervision.update({
      where: { phdId: phdId },
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
    console.error('Error updating PhD supervision:', error)
    return c.json({ error: 'Failed to update PhD supervision: ' + (error as Error).message }, 500)
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
    const phdId = parseInt(url.searchParams.get('phdId') || '')
    
    if (!phdId) {
      return c.json({ error: 'PhD ID is required' }, 400)
    }
    
    // Verify PhD supervision exists and belongs to the authenticated teacher
    const existingPhd = await prisma.phdSupervision.findFirst({
      where: {
        phdId: phdId,
        supervisorId: uid
      }
    })
    
    if (!existingPhd) {
      return c.json({ error: 'PhD supervision not found or access denied' }, 404)
    }
    
    await prisma.phdSupervision.delete({
      where: { phdId: phdId }
    })
    
    return c.json({ message: 'PhD supervision deleted successfully' })
  } catch (error) {
    console.error('Error deleting PhD supervision:', error)
    return c.json({ error: 'Failed to delete PhD supervision: ' + (error as Error).message }, 500)
  }
})
