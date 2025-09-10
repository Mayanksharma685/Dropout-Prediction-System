import { createApp } from 'honox/server'

// Create the Honox app with explicit configuration
const app = createApp({
  // Explicitly specify the routes directory
  routes: './app/routes'
})

export default app
