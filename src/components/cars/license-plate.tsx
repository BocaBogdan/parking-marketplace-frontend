import { cn } from '@/lib/utils'

/** A plate styled like an EU number plate, with the blue country band */
export function LicensePlate({ plate, size = 'md' }: { plate: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-stretch overflow-hidden rounded-md border-2 border-neutral-800 bg-white font-mono font-bold tracking-wider text-neutral-900 uppercase dark:border-neutral-300',
        size === 'sm' && 'rounded text-xs',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-2xl',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex items-end justify-center bg-primary-700 font-sans text-white',
          size === 'sm'
            ? 'w-3.5 pb-px text-[7px]'
            : size === 'md'
              ? 'w-5 pb-0.5 text-[9px]'
              : 'w-7 pb-1 text-xs',
        )}
      >
        RO
      </span>
      <span
        className={cn(
          size === 'sm' ? 'px-1.5 py-0.5' : size === 'md' ? 'px-2.5 py-1' : 'px-4 py-2',
        )}
      >
        {plate}
      </span>
    </span>
  )
}
