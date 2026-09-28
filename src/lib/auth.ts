import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { publicApi, unwrap } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

// Mirrors LoginRequest / UserCreate validation in the backend (schemas/user.py).
// Messages are translation keys, resolved when the error is displayed.
export const loginSchema = z.object({
  email: z.email('validation.email'),
  password: z.string().min(1, 'validation.passwordRequired'),
  remember: z.boolean(),
})

const passwordsSchema = z.object({
  password: z.string().min(8, 'validation.passwordMin').max(72, 'validation.passwordMax'),
  // Client-only: never sent to the backend
  confirm_password: z.string(),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'validation.nameRequired').max(255, 'validation.nameMax'),
    apartment_number: z
      .string()
      .trim()
      .min(1, 'validation.apartmentRequired')
      .max(50, 'validation.apartmentMax'),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'validation.phone'),
    email: z.email('validation.email'),
    ...passwordsSchema.shape,
    remember: z.boolean(),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: 'validation.passwordMismatch',
    path: ['confirm_password'],
    // Zod skips object refinements while any field is invalid; only require the
    // password fields to be valid so the mismatch shows up alongside other errors
    when: (payload) => passwordsSchema.safeParse(payload.value).success,
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>

export async function login({ remember, ...credentials }: LoginValues) {
  const tokens = await unwrap(publicApi.POST('/api/v1/auth/login', { body: credentials }))
  useAuthStore.getState().signIn(tokens, remember)
}

export async function register(values: RegisterValues) {
  const { name, apartment_number, phone, email, password, remember } = values
  await unwrap(
    publicApi.POST('/api/v1/auth/register', {
      body: { name, apartment_number, phone, email, password },
    }),
  )
  await login({ email, password, remember })
}

export async function logout(queryClient: QueryClient, goToLogin: () => Promise<void>) {
  useAuthStore.getState().signOut()
  await goToLogin()
  // Clear only after leaving the signed-in pages, or their queries refetch without a token
  queryClient.clear()
}

export function isAuthenticated() {
  return useAuthStore.getState().accessToken !== null
}

// Only follow same-origin paths so ?redirect= can't bounce users to another site
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .refine((path) => path.startsWith('/') && !path.startsWith('//'))
    .optional()
    .catch(undefined),
})
