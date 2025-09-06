import { createRoute } from 'honox/factory'
import { getAuthUrl } from '@/lib/google'

export default createRoute((c) => {
  const url = getAuthUrl({
    GOOGLE_CLIENT_ID: c.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: c.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: c.env.GOOGLE_REDIRECT_URI,
  })
  return c.redirect(url)
})


