function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and set it.`)
  }
  return value
}

export const env = {
  apiUrl: required('VITE_API_URL'),
  clerkPublishableKey: required('VITE_CLERK_PUBLISHABLE_KEY'),
  // Optional: without it, picking a spot's location falls back to typing coordinates
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || undefined,
  // Advanced markers need a Map ID; Google's demo one is fine outside production
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
}
