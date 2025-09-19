import { createRoute } from 'honox/factory'

export const POST = createRoute(async (c) => {
  // Get authenticated teacher ID from cookies
  const cookies = c.req.raw.headers.get('Cookie') || ''
  const uidRaw = cookies.split(';').map((s) => s.trim()).find((s) => s.startsWith('uid='))?.slice(4)
  const teacherId = uidRaw ? decodeURIComponent(uidRaw) : undefined
  
  if (!teacherId) {
    return c.json({ error: 'Authentication required' }, 401)
  }
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient

  try {
    // Create some sample students first
    const sampleStudents = [
      {
        studentId: 'STU001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        dob: new Date('2000-01-15'),
        department: 'Computer Science',
        currentSemester: 6,
        teacherId: teacherId
      },
      {
        studentId: 'STU002', 
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        dob: new Date('1999-05-20'),
        department: 'Computer Science',
        currentSemester: 8,
        teacherId: teacherId
      },
      {
        studentId: 'STU003',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com', 
        dob: new Date('2001-03-10'),
        department: 'Electronics',
        currentSemester: 4,
        teacherId: teacherId
      }
    ]

    // Create students (upsert to avoid duplicates)
    for (const student of sampleStudents) {
      await prisma.student.upsert({
        where: { studentId: student.studentId },
        update: student,
        create: student
      })
    }

    // Create sample PhD supervisions
    const samplePhds = [
      {
        title: 'Machine Learning in Healthcare',
        researchArea: 'Artificial Intelligence',
        studentId: 'STU001',
        supervisorId: teacherId,
        startDate: new Date('2022-01-15'),
        expectedEnd: new Date('2025-01-15'),
        status: 'Ongoing'
      },
      {
        title: 'Blockchain Security Protocols',
        researchArea: 'Cybersecurity',
        studentId: 'STU002',
        supervisorId: teacherId,
        startDate: new Date('2021-08-01'),
        expectedEnd: new Date('2024-08-01'),
        status: 'Ongoing'
      }
    ]

    const createdPhds = []
    for (const phd of samplePhds) {
      const created = await prisma.phdSupervision.create({
        data: phd
      })
      createdPhds.push(created)
    }

    // Create sample fellowships
    const sampleFellowships = [
      {
        type: 'Full Time',
        amount: 50000,
        duration: 24,
        studentId: 'STU001',
        supervisorId: teacherId,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'Active'
      },
      {
        type: 'Part Time',
        amount: 25000,
        duration: 12,
        studentId: 'STU003',
        supervisorId: teacherId,
        startDate: new Date('2023-06-01'),
        endDate: new Date('2024-05-31'),
        status: 'Active'
      }
    ]

    const createdFellowships = []
    for (const fellowship of sampleFellowships) {
      const created = await prisma.fellowship.create({
        data: fellowship
      })
      createdFellowships.push(created)
    }

    // Create sample projects
    const sampleProjects = [
      {
        title: 'Smart City IoT Platform',
        description: 'Development of IoT platform for smart city management',
        studentId: 'STU002',
        supervisorId: teacherId,
        startDate: new Date('2023-03-01'),
        status: 'Active'
      },
      {
        title: 'Mobile App for Student Management',
        description: 'React Native app for student academic tracking',
        studentId: 'STU003',
        supervisorId: teacherId,
        startDate: new Date('2023-01-15'),
        endDate: new Date('2023-12-15'),
        status: 'Completed'
      }
    ]

    const createdProjects = []
    for (const project of sampleProjects) {
      const created = await prisma.project.create({
        data: project
      })
      createdProjects.push(created)
    }

    return c.json({
      message: 'Sample data created successfully!',
      created: {
        students: sampleStudents.length,
        phdSupervisions: createdPhds.length,
        fellowships: createdFellowships.length,
        projects: createdProjects.length
      },
      data: {
        students: sampleStudents.map(s => ({ studentId: s.studentId, name: s.name })),
        phdSupervisions: createdPhds.map(p => ({ id: p.phdId, title: p.title })),
        fellowships: createdFellowships.map(f => ({ id: f.fellowshipId, type: f.type, amount: f.amount })),
        projects: createdProjects.map(p => ({ id: p.projectId, title: p.title }))
      }
    })

  } catch (error) {
    console.error('Error creating sample data:', error)
    return c.json({ 
      error: 'Failed to create sample data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})
