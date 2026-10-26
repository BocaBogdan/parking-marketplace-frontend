/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
  readonly VITE_FEEDBACK_FORM_URL?: string
  readonly VITE_DONATION_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
