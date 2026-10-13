import { PencilIcon, PhoneIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/cars/license-plate'
import { RemoveCarButton } from '@/components/cars/remove-car-button'
import type { Car } from '@/types/models'

interface CarCardProps {
  car: Car
  onEdit: () => void
}

export function CarCard({ car, onEdit }: CarCardProps) {
  const { t } = useTranslation()

  return (
    <article className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
        <LicensePlate plate={car.plate} />
        <p className="truncate text-sm font-medium">{car.description}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
          <PhoneIcon className="size-3.5" />
          {car.phone}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground"
          aria-label={t('cars.edit', { plate: car.plate })}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
        <RemoveCarButton car={car} />
      </div>
    </article>
  )
}
