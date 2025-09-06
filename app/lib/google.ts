type GoogleEnv = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URI: string
}

export function getAuthUrl(env: GoogleEnv) {
  const base = 'https://accounts.google.com/o/oauth2/v2/auth'
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `${base}?${params.toString()}`
}

export async function verifyCode(env: GoogleEnv, code: string) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Token exchange failed: ${tokenRes.status} ${errText}`)
  }

  const tokenJson = (await tokenRes.json()) as {
    id_token?: string
  }
  if (!tokenJson.id_token) throw new Error('Missing id_token from token response')

  // Use tokeninfo endpoint to validate and parse ID Token payload
  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenJson.id_token)}`,
  )
  if (!infoRes.ok) {
    const errText = await infoRes.text()
    throw new Error(`tokeninfo failed: ${infoRes.status} ${errText}`)
  }
  const payload = (await infoRes.json()) as {
    sub: string
    email: string
    name?: string
    picture?: string
    aud?: string
  }

  if (payload.aud && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('ID token audience mismatch')
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}


