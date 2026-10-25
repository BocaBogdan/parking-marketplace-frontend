import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon, CircleCheckIcon, FileUpIcon, Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { serverErrorMessage } from '@/lib/form'
import { parseInvites } from '@/lib/invites'
import { inviteResidents } from '@/queries/invites'

interface BulkInviteDialogProps {
  buildingId: string
  buildingName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkInviteDialog({
  buildingId,
  buildingName,
  open,
  onOpenChange,
}: BulkInviteDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('buildings.invite.bulk.title')}
          </DialogTitle>
          <DialogDescription>
            {t('buildings.invite.bulk.description', { building: buildingName })}
          </DialogDescription>
        </DialogHeader>
        <BulkInviteForm buildingId={buildingId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function BulkInviteForm({ buildingId, onDone }: { buildingId: string; onDone: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const [text, setText] = useState('')
  const { rows, errors } = parseInvites(text)
  const canSend = rows.length > 0 && errors.length === 0

  const queryClient = useQueryClient()

  const invite = useMutation({
    mutationFn: () => inviteResidents(buildingId, rows),
    onSuccess: () => {
      // Existing accounts join right away; everyone else is listed as pending
      void queryClient.invalidateQueries({ queryKey: ['buildings', buildingId, 'members'] })
      void queryClient.invalidateQueries({ queryKey: ['buildings', buildingId, 'invites'] })
      toast.success(t('buildings.invite.toast.sentBulk', { count: rows.length }))
      onDone()
    },
  })

  // A CSV export fills the textarea, so it can be checked and fixed before sending
  const importFile = async (file: File | undefined) => {
    if (file) setText(await file.text())
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (canSend) invite.mutate()
      }}
      className="grid gap-4"
    >
      {invite.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {serverErrorMessage(invite.error)}
        </p>
      )}

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id} className="font-semibold">
            {t('buildings.invite.bulk.label')}
          </Label>
          <Button asChild variant="ghost" size="sm" className="text-primary">
            <label>
              <FileUpIcon />
              {t('buildings.invite.bulk.import')}
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={(e) => {
                  void importFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          </Button>
        </div>
        <Textarea
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          placeholder={t('buildings.invite.bulk.placeholder')}
          aria-describedby={`${id}-hint`}
          aria-invalid={errors.length > 0 ? true : undefined}
          className="min-h-40 border-transparent bg-primary-50 px-3 font-mono text-sm dark:bg-input/30"
        />
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {t('buildings.invite.bulk.hint')}
        </p>
      </div>

      {errors.length > 0 ? (
        <ul
          role="alert"
          className="grid max-h-32 gap-1 overflow-y-auto rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {errors.map(({ line, reason }) => (
            <li key={line} className="flex items-start gap-2">
              <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
              {t('buildings.invite.bulk.lineError', { line, reason: t(reason) })}
            </li>
          ))}
        </ul>
      ) : (
        rows.length > 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-secondary-50 px-3 py-2.5 text-sm font-medium text-secondary-800 dark:bg-secondary-950 dark:text-secondary-200">
            <CircleCheckIcon className="size-4 shrink-0" />
            {t('buildings.invite.bulk.ready', { count: rows.length })}
          </p>
        )
      )}

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full text-base"
        disabled={!canSend || invite.isPending}
      >
        {invite.isPending && <Loader2Icon className="animate-spin" />}
        {t('buildings.invite.bulk.submit', { count: rows.length })}
      </Button>
    </form>
  )
}
