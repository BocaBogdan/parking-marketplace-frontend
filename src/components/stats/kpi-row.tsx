export interface KpiTile {
  label: string
  value: string
  hint?: string
  /** 0–1: draws a meter under the value, e.g. utilization */
  meter?: number
}

/** Headline numbers as stat tiles */
export function KpiRow({ tiles }: { tiles: KpiTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="grid content-start gap-1 rounded-2xl border bg-card px-4 py-3 shadow-xs"
        >
          <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
          <p className="text-xl font-bold tabular-nums">{tile.value}</p>
          {tile.meter !== undefined && (
            <div className="h-1.5 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-950">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${Math.min(100, tile.meter * 100)}%` }}
              />
            </div>
          )}
          {tile.hint && <p className="text-xs text-muted-foreground tabular-nums">{tile.hint}</p>}
        </div>
      ))}
    </div>
  )
}
