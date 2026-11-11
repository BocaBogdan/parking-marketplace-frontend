import { z } from 'zod'

// The spot's proof of ownership: a PDF or a photo (see DocumentInput)

// The backend has no upload limit; this keeps uploads from stalling on mobile data
export const MAX_DOCUMENT_MB = 10

// What the backend accepts (it checks the bytes, not the name). No HEIC: browsers can't show
// it, and iPhones convert photos to JPEG when picked through a file input.
const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp']

/** For the file input; image types make phones offer the camera and photo library */
export const DOCUMENT_ACCEPT = [...DOCUMENT_MIME_TYPES, ...DOCUMENT_EXTENSIONS].join(',')

// Some systems report an empty MIME type, so accept the extension too
const isAcceptedDocument = (file: File) =>
  DOCUMENT_MIME_TYPES.includes(file.type) ||
  DOCUMENT_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))

/** The stored document is a photo; the backend keys it by the type it detected */
export const isImageDocument = (fileId: string) => /\.(jpg|png|webp)$/i.test(fileId)

/** A newly picked document, or null to keep the current one (or none yet) */
export const documentSchema = z
  .custom<File | null>()
  .refine((file) => !file || isAcceptedDocument(file), 'validation.documentType')
  .refine((file) => !file || file.size <= MAX_DOCUMENT_MB * 1024 * 1024, 'validation.documentSize')
