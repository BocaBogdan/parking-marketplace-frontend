import { FileCheckIcon, FileUpIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MAX_DOCUMENT_MB } from '@/lib/spot-document'
import { cn } from '@/lib/utils'

/*
 * Not in the first release: the API dropped the spot's proof-of-ownership document.
 * Kept so the upload can come back to the spot form (validate it with `documentSchema`,
 * send it as the multipart `file` part via `spotFormData` in queries/spots.ts).
 */

interface DocumentInputProps {
  file: File | null
  /** Editing: the spot already has a document, so picking one is optional */
  hasDocumentOnFile: boolean
  onChange: (file: File) => void
  error: string | undefined
}

/** Picks the PDF proving the owner has the right to the spot */
export function DocumentInput({ file, hasDocumentOnFile, onChange, error }: DocumentInputProps) {
  const { t, i18n } = useTranslation()
  const size = (bytes: number) =>
    new Intl.NumberFormat(i18n.resolvedLanguage, {
      style: 'unit',
      unit: 'megabyte',
      maximumFractionDigits: 1,
    }).format(bytes / 1024 / 1024)

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">{t('spots.form.document')}</span>
      <label
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed bg-primary-50 p-3 transition-colors hover:bg-primary-100 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30',
          (file || hasDocumentOnFile) && 'border-solid border-primary-200 dark:border-primary-900',
          error && 'border-destructive',
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
          {file || hasDocumentOnFile ? (
            <FileCheckIcon className="size-5" />
          ) : (
            <FileUpIcon className="size-5" />
          )}
        </span>
        {file ? (
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm font-semibold">{file.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{size(file.size)}</span>
          </span>
        ) : hasDocumentOnFile ? (
          <span className="flex-1 text-sm font-semibold">{t('spots.form.documentOnFile')}</span>
        ) : (
          <span className="flex-1 text-sm font-semibold text-primary">
            {t('spots.form.documentAdd')}
          </span>
        )}
        {(file || hasDocumentOnFile) && (
          <span className="text-sm font-semibold text-primary">
            {t('spots.form.documentChange')}
          </span>
        )}
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const picked = e.target.files?.[0]
            // Keep the current document if the picker is cancelled
            if (picked) onChange(picked)
            e.target.value = ''
          }}
        />
      </label>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t(hasDocumentOnFile ? 'spots.form.documentReplaceHint' : 'spots.form.documentHint', {
            size: MAX_DOCUMENT_MB,
          })}
        </p>
      )}
    </div>
  )
}
