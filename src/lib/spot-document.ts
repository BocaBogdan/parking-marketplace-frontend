import { z } from 'zod'

// The spot's proof-of-ownership PDF (see DocumentInput)

// The backend has no upload limit; this keeps uploads from stalling on mobile data
export const MAX_DOCUMENT_MB = 10

// Some systems report an empty MIME type for PDFs, so accept the extension too
const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

/** A newly picked PDF, or null to keep the current one (or none yet) */
export const documentSchema = z
  .custom<File | null>()
  .refine((file) => !file || isPdf(file), 'validation.documentType')
  .refine((file) => !file || file.size <= MAX_DOCUMENT_MB * 1024 * 1024, 'validation.documentSize')
