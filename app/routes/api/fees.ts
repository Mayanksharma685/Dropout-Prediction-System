import { createRoute } from 'honox/factory'

export const GET = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  const data = await prisma.feePayment.findMany({ take: 200 })
  return c.json(data)
})

export const POST = createRoute(async (c) => {
  const prisma = (c as any).get('prisma') as import('@prisma/client').PrismaClient
  
  try {
    const formData = await c.req.formData()
    
    const feeData = {
      studentId: formData.get('studentId') as string,
      dueDate: new Date(formData.get('dueDate') as string),
      paidDate: formData.get('paidDate') ? new Date(formData.get('paidDate') as string) : null,
      status: formData.get('status') as string,
      dueMonths: parseInt(formData.get('dueMonths') as string)
    }
    
    // Validate required fields
    if (!feeData.studentId || !feeData.dueDate || !feeData.status || isNaN(feeData.dueMonths)) {
      return c.json({ error: 'Missing required fields: studentId, dueDate, status, dueMonths' }, 400)
    }
    
    const created = await prisma.feePayment.create({ data: feeData })
    return c.json(created, 201)
  } catch (error: any) {
    console.error('Error creating fee payment:', error)
    return c.json({ error: 'Failed to create fee payment: ' + error.message }, 500)
  }
})


