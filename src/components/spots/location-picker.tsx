import { useState, type ReactNode } from 'react'
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  Map,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps'
import { CircleAlertIcon, LocateFixedIcon, Loader2Icon, MapPinIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

/** Coordinates as the backend stores them: decimal strings */
export interface Coordinates {
  lat: string
  long: string
}

interface LocationPickerProps {
  value: Coordinates
  onChange: (value: Coordinates) => void
  error: string | undefined
  /** Coordinate inputs, shown when the map isn't available (no API key, or it failed to load) */
  manualFields: ReactNode
}

// Whole country in view until the owner picks a point or shares their location
const ROMANIA = { center: { lat: 45.9432, lng: 24.9668 }, zoom: 6 }
// Close enough to tell parking bays apart on the satellite view
const SPOT_ZOOM = 19

/** 6 decimals is about 10 cm — more than a phone's GPS can tell anyway */
function toCoordinates(lat: number, lng: number): Coordinates {
  return { lat: lat.toFixed(6), long: lng.toFixed(6) }
}

function toLatLng(value: Coordinates) {
  const lat = Number(value.lat)
  const lng = Number(value.long)
  return value.lat && value.long && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : null
}

/**
 * Where the spot is: tap the Google map (or drag the pin), or use the device's location.
 * Without a Maps API key, or if Maps fails to load, it falls back to typed coordinates.
 */
export function LocationPicker(props: LocationPickerProps) {
  const { i18n } = useTranslation()

  if (!env.googleMapsApiKey) return <ManualPicker {...props} />

  return (
    <APIProvider apiKey={env.googleMapsApiKey} language={i18n.resolvedLanguage} region="RO">
      <MapPicker {...props} />
    </APIProvider>
  )
}

function MapPicker({ value, onChange, error, manualFields }: LocationPickerProps) {
  const { t } = useTranslation()
  const status = useApiLoadingStatus()
  const map = useMap()
  const position = toLatLng(value)

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <ManualPicker
        value={value}
        onChange={onChange}
        error={error}
        manualFields={manualFields}
        unavailable
      />
    )
  }

  const pick = (lat: number, lng: number) => onChange(toCoordinates(lat, lng))

  return (
    <fieldset className="grid gap-2">
      <Legend
        onLocate={(lat, lng) => {
          pick(lat, lng)
          map?.panTo({ lat, lng })
          map?.setZoom(SPOT_ZOOM)
        }}
      />
      <div
        className={cn(
          'h-64 overflow-hidden rounded-xl border bg-muted',
          error && 'border-destructive',
        )}
      >
        <Map
          mapId={env.googleMapsMapId}
          defaultCenter={position ?? ROMANIA.center}
          defaultZoom={position ? SPOT_ZOOM : ROMANIA.zoom}
          // Satellite with labels: bays and building entrances are visible
          defaultMapTypeId="hybrid"
          // One finger pans, so picking works on phones; the dialog scrolls outside the map
          gestureHandling="greedy"
          // A tap on a shop or bus stop should drop the pin, not open its info card
          clickableIcons={false}
          streetViewControl={false}
          fullscreenControl={false}
          onClick={(e) => e.detail.latLng && pick(e.detail.latLng.lat, e.detail.latLng.lng)}
          style={{ width: '100%', height: '100%' }}
        >
          {position && (
            <AdvancedMarker
              position={position}
              draggable
              onDragEnd={(e) => e.latLng && pick(e.latLng.lat(), e.latLng.lng())}
            />
          )}
        </Map>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : position ? (
        <p className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
          <MapPinIcon className="size-4 text-primary" />
          {value.lat}, {value.long}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{t('spots.form.mapHint')}</p>
    </fieldset>
  )
}

function ManualPicker({
  onChange,
  manualFields,
  unavailable = false,
}: LocationPickerProps & { unavailable?: boolean }) {
  const { t } = useTranslation()

  return (
    <fieldset className="grid gap-3">
      <Legend onLocate={(lat, lng) => onChange(toCoordinates(lat, lng))} />
      {unavailable && (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {t('spots.form.mapUnavailable')}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">{manualFields}</div>
      <p className="text-sm text-muted-foreground">{t('spots.form.locationHint')}</p>
    </fieldset>
  )
}

function Legend({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const { t } = useTranslation()

  return (
    <legend className="mb-2 flex w-full items-center justify-between gap-2 text-sm font-semibold">
      {t('spots.form.location')}
      <UseMyLocationButton onLocate={onLocate} />
    </legend>
  )
}

/** Reads the device location — easiest when the owner is standing at the spot */
function UseMyLocationButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const { t } = useTranslation()
  const [isLocating, setIsLocating] = useState(false)

  const locate = () => {
    // Missing outside secure contexts (plain http on anything but localhost)
    if (!('geolocation' in navigator)) {
      toast.error(t('spots.form.locationError'))
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false)
        onLocate(coords.latitude, coords.longitude)
      },
      () => {
        setIsLocating(false)
        toast.error(t('spots.form.locationError'))
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-primary"
      disabled={isLocating}
      onClick={locate}
    >
      {isLocating ? <Loader2Icon className="animate-spin" /> : <LocateFixedIcon />}
      {t('spots.form.useMyLocation')}
    </Button>
  )
}
