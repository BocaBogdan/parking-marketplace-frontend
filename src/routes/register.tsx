import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  Building2Icon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth-layout'
import { FormError } from '@/components/form/form-error'
import {
  authSearchSchema,
  isAuthenticated,
  register,
  registerSchema,
  type RegisterValues,
} from '@/lib/auth'
import { setServerErrors, useAppForm } from '@/lib/form'

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (isAuthenticated()) throw redirect({ href: search.redirect ?? '/home' })
  },
  component: RegisterPage,
})

const defaultValues: RegisterValues = {
  name: '',
  apartment_number: '',
  phone: '',
  email: '',
  password: '',
  confirm_password: '',
  remember: true,
}

function RegisterPage() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const form = useAppForm({
    defaultValues,
    validators: { onChange: registerSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await register(registerSchema.parse(value))
      } catch (error) {
        setServerErrors(formApi, error)
        return
      }
      await navigate({ href: search.redirect ?? '/home' })
    },
  })

  return (
    <AuthLayout title={t('auth.register.title')} description={t('auth.register.description')}>
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
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t('auth.fields.name')}
              icon={UserIcon}
              autoComplete="name"
              placeholder={t('auth.fields.namePlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField name="apartment_number">
          {(field) => (
            <field.TextField
              label={t('auth.fields.apartment')}
              icon={Building2Icon}
              autoComplete="off"
              placeholder={t('auth.fields.apartmentPlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField name="phone">
          {(field) => (
            <field.TextField
              label={t('auth.fields.phone')}
              icon={PhoneIcon}
              type="tel"
              autoComplete="tel"
              placeholder={t('auth.fields.phonePlaceholder')}
              hint={t('auth.fields.phoneHint')}
            />
          )}
        </form.AppField>
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
              autoComplete="new-password"
              placeholder="••••••••"
              hint={t('auth.fields.passwordHint')}
            />
          )}
        </form.AppField>
        <form.AppField name="confirm_password">
          {(field) => (
            <field.TextField
              label={t('auth.fields.confirmPassword')}
              icon={LockIcon}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          )}
        </form.AppField>
        <form.AppField name="remember">
          {(field) => <field.CheckboxField label={t('auth.fields.remember')} />}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>
            {t('auth.register.submit')}
            <ArrowRightIcon />
          </form.SubmitButton>
        </form.AppForm>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" search={search} className="font-semibold text-primary hover:underline">
            {t('auth.register.loginLink')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
