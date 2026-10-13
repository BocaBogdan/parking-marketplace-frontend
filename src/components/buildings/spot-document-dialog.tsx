import { useQuery } from '@tanstack/react-query'
import { CircleAlertIcon, ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { serverErrorMessage } from '@/lib/form'
import { documentUrlQuery } from '@/queries/admin-spots'
import type { ReviewableSpot as Spot } from '@/types/models'

interface SpotDocumentDialogProps {
  /** Spot whose document to preview; undefined closes the dialog */
  spot: Spot | undefined
  onOpenChange: (open: boolean) => void
}

/** Previews a spot's proof-of-ownership PDF, so the admin can check it before deciding */
export function SpotDocumentDialog({ spot, onOpenChange }: SpotDocumentDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={spot !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(52rem,calc(100svh-2rem))] flex-col sm:max-w-3xl">
        {spot && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {t('buildings.spots.document.title', { number: spot.number })}
              </DialogTitle>
              <DialogDescription>{t('buildings.spots.document.description')}</DialogDescription>
            </DialogHeader>
            <DocumentPreview spot={spot} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DocumentPreview({ spot }: { spot: Spot }) {
  const { t } = useTranslation()
  const { data: url, error, isPending } = useQuery(documentUrlQuery(spot.fileId))

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
      >
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
        {serverErrorMessage(error)}
      </p>
    )
  }

  return (
    <>
      <iframe
        src={url}
        title={t('buildings.spots.document.title', { number: spot.number })}
        className="min-h-0 w-full flex-1 rounded-lg border bg-muted"
      />
      {/* Most phone browsers can't show a PDF inside a page */}
      <Button asChild variant="outline" className="self-start">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLinkIcon />
          {t('buildings.spots.document.open')}
        </a>
      </Button>
    </>
  )
}
