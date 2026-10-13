import { z } from 'zod'
import type { TranslationKey } from '@/i18n'

export interface InviteRow {
  email: string
  apartment: string
  eBlocUserID: string
}

export interface InviteLineError {
  /** 1-based, as shown in the textarea */
  line: number
  reason: TranslationKey
}

const isEmail = (value: string) => z.email().safeParse(value).success

/**
 * Parses pasted residents, one per line: `email, apartment, eBloc user ID`. Commas,
 * semicolons and tabs all separate columns, so rows copied from a spreadsheet or a CSV
 * export work as-is. Blank lines and a leading header row are skipped.
 */
export function parseInvites(text: string) {
  const rows: InviteRow[] = []
  const errors: InviteLineError[] = []
  const seen = new Set<string>()

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1
    if (!raw.trim()) return
    const cells = raw.split(/[,;\t]/).map((cell) => cell.trim())
    if (rows.length === 0 && errors.length === 0 && cells[0].toLowerCase() === 'email') return

    const [email = '', apartment = '', eBlocUserID = ''] = cells
    const reason: TranslationKey | undefined =
      cells.length !== 3 || !apartment || !eBlocUserID
        ? 'validation.inviteColumns'
        : !isEmail(email)
          ? 'validation.email'
          : seen.has(email.toLowerCase())
            ? 'validation.inviteDuplicate'
            : undefined

    if (reason) errors.push({ line, reason })
    else {
      seen.add(email.toLowerCase())
      rows.push({ email, apartment, eBlocUserID })
    }
  })

  return { rows, errors }
}
