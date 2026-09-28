import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const tones = {
  secondary: {
    card: 'border-secondary-200 bg-secondary-50 dark:border-secondary-900 dark:bg-secondary-950/40',
    icon: 'bg-secondary text-secondary-foreground',
    badge: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200',
    button: 'secondary',
  },
  primary: {
    card: 'border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950/40',
    icon: 'bg-primary text-primary-foreground',
    badge: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    button: 'default',
  },
} as const

interface ActionCardProps {
  tone: keyof typeof tones
  icon: LucideIcon
  title: string
  badge: string
  description: string
  action: ReactNode
  onAction: () => void
  footer: ReactNode
}

export function ActionCard({
  tone,
  icon: Icon,
  title,
  badge,
  description,
  action,
  onAction,
  footer,
}: ActionCardProps) {
  const styles = tones[tone]

  return (
    <section className={cn('flex flex-col gap-4 rounded-2xl border p-5', styles.card)}>
      <div className="flex gap-3">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            styles.icon,
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="grid flex-1 gap-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg leading-tight font-bold">{title}</h2>
            <Badge className={cn('font-semibold', styles.badge)}>{badge}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant={styles.button} className="mt-auto h-11 w-full text-sm" onClick={onAction}>
        {action}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
        {footer}
      </p>
    </section>
  )
}
