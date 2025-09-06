import { createRoute } from 'honox/factory'

// Legacy login route → redirect to new dashboard login
export default createRoute((c) => c.redirect('/dashboard/login'))


