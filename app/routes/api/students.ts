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
  
  // Only return students associated with the authenticated teacher
  const students = await prisma.student.findMany({ 
    where: { teacherId: uid },
    take: 100,
    orderBy: { name: 'asc' }
  })
  return c.json(students)
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
    
    const studentData = {
      studentId: formData.get('studentId') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || null,
      dob: new Date(formData.get('dob') as string),
      department: formData.get('department') as string || null,
      currentSemester: parseInt(formData.get('currentSemester') as string),
      teacherId: uid // Associate student with the authenticated teacher
    }
    
    // Validate required fields
    if (!studentData.studentId || !studentData.name || !studentData.email || !studentData.dob || isNaN(studentData.currentSemester)) {
      return c.json({ error: 'Missing required fields: studentId, name, email, dob, currentSemester' }, 400)
    }
    
    const created = await prisma.student.create({ data: studentData })
    return c.json(created, 201)
  } catch (error) {
    console.error('Error creating student:', error)
    return c.json({ error: 'Failed to create student: ' + (error as Error).message }, 500)
  }
})


