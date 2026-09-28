import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowRightIcon, LockIcon, MailIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthLayout, ComingSoonLink } from '@/components/auth-layout'
import { FormError } from '@/components/form/form-error'
import { authSearchSchema, isAuthenticated, login, loginSchema, type LoginValues } from '@/lib/auth'
import { setServerErrors, useAppForm } from '@/lib/form'

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (isAuthenticated()) throw redirect({ href: search.redirect ?? '/home' })
  },
  component: LoginPage,
})

const defaultValues: LoginValues = { email: '', password: '', remember: true }

function LoginPage() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const form = useAppForm({
    defaultValues,
    validators: { onChange: loginSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await login(value)
      } catch (error) {
        setServerErrors(formApi, error)
        return
      }
      await navigate({ href: search.redirect ?? '/home' })
    },
  })

  return (
    <AuthLayout title={t('auth.login.title')} description={t('auth.login.description')}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="grid gap-5"
      >
        <form.AppForm>
          <FormError />
        </form.AppForm>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label={t('auth.fields.email')}
              icon={MailIcon}
              type="email"
              autoComplete="email"
              placeholder={t('auth.fields.emailPlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.TextField
              label={t('auth.fields.password')}
              icon={LockIcon}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              labelAction={
                <ComingSoonLink
                  label={t('auth.fields.forgotPassword')}
                  className="text-sm font-semibold text-primary hover:underline"
                />
              }
            />
          )}
        </form.AppField>
        <form.AppField name="remember">
          {(field) => <field.CheckboxField label={t('auth.fields.remember')} />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>
            {t('auth.login.submit')}
            <ArrowRightIcon />
          </form.SubmitButton>
        </form.AppForm>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/register"
            search={search}
            className="font-semibold text-primary hover:underline"
          >
            {t('auth.login.registerLink')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
