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
    const url = new URL(c.req.url)
    const type = url.searchParams.get('type') // 'Full Time' or 'Part Time'
    
    const whereClause: any = {
      supervisorId: uid
    }
    
    if (type) {
      whereClause.type = type
    }
    
    const fellowships = await prisma.fellowship.findMany({
      where: whereClause,
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
    
    return c.json(fellowships)
  } catch (error) {
    console.error('Error fetching fellowships:', error)
    return c.json({ error: 'Failed to fetch fellowships' }, 500)
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
    
    const fellowshipData = {
      type: formData.get('type') as string, // 'Full Time' or 'Part Time'
      amount: parseFloat(formData.get('amount') as string),
      duration: parseInt(formData.get('duration') as string), // in months
      studentId: formData.get('studentId') as string,
      supervisorId: uid,
      startDate: new Date(formData.get('startDate') as string),
      endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : null,
      status: (formData.get('status') as string) || 'Active'
    }
    
    // Validate required fields
    if (!fellowshipData.type || !fellowshipData.amount || !fellowshipData.duration || 
        !fellowshipData.studentId || !fellowshipData.startDate) {
      return c.json({ error: 'Missing required fields: type, amount, duration, studentId, startDate' }, 400)
    }
    
    // Validate fellowship type
    if (!['Full Time', 'Part Time'].includes(fellowshipData.type)) {
      return c.json({ error: 'Fellowship type must be "Full Time" or "Part Time"' }, 400)
    }
    
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { studentId: fellowshipData.studentId }
    })
    
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    const created = await prisma.fellowship.create({ 
      data: fellowshipData,
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
    console.error('Error creating fellowship:', error)
    return c.json({ error: 'Failed to create fellowship: ' + (error as Error).message }, 500)
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
    const fellowshipId = parseInt(formData.get('fellowshipId') as string)
    
    if (!fellowshipId) {
      return c.json({ error: 'Fellowship ID is required' }, 400)
    }
    
    // Verify fellowship exists and belongs to the authenticated teacher
    const existingFellowship = await prisma.fellowship.findFirst({
      where: {
        fellowshipId: fellowshipId,
        supervisorId: uid
      }
    })
    
    if (!existingFellowship) {
      return c.json({ error: 'Fellowship not found or access denied' }, 404)
    }
    
    const updateData: any = {}
    
    if (formData.get('type')) {
      const type = formData.get('type') as string
      if (!['Full Time', 'Part Time'].includes(type)) {
        return c.json({ error: 'Fellowship type must be "Full Time" or "Part Time"' }, 400)
      }
      updateData.type = type
    }
    if (formData.get('amount')) updateData.amount = parseFloat(formData.get('amount') as string)
    if (formData.get('duration')) updateData.duration = parseInt(formData.get('duration') as string)
    if (formData.get('studentId')) updateData.studentId = formData.get('studentId') as string
    if (formData.get('startDate')) updateData.startDate = new Date(formData.get('startDate') as string)
    if (formData.get('endDate')) updateData.endDate = new Date(formData.get('endDate') as string)
    if (formData.get('status')) updateData.status = formData.get('status') as string
    
    const updated = await prisma.fellowship.update({
      where: { fellowshipId: fellowshipId },
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
    console.error('Error updating fellowship:', error)
    return c.json({ error: 'Failed to update fellowship: ' + (error as Error).message }, 500)
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
    const fellowshipId = parseInt(url.searchParams.get('fellowshipId') || '')
    
    if (!fellowshipId) {
      return c.json({ error: 'Fellowship ID is required' }, 400)
    }
    
    // Verify fellowship exists and belongs to the authenticated teacher
    const existingFellowship = await prisma.fellowship.findFirst({
      where: {
        fellowshipId: fellowshipId,
        supervisorId: uid
      }
    })
    
    if (!existingFellowship) {
      return c.json({ error: 'Fellowship not found or access denied' }, 404)
    }
    
    await prisma.fellowship.delete({
      where: { fellowshipId: fellowshipId }
    })
    
    return c.json({ message: 'Fellowship deleted successfully' })
  } catch (error) {
    console.error('Error deleting fellowship:', error)
    return c.json({ error: 'Failed to delete fellowship: ' + (error as Error).message }, 500)
  }
})
