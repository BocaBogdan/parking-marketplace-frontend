function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and set it.`)
  }
  return value
}

export const env = {
  apiUrl: required('VITE_API_URL'),
}
