import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-9 items-center justify-center rounded-xl bg-primary text-xl font-black text-primary-foreground',
        className,
      )}
    >
      P
    </div>
  )
}
