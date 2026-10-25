import {
  Building2Icon,
  CalendarDaysIcon,
  CarIcon,
  CompassIcon,
  HouseIcon,
  ShieldCheckIcon,
  SquareParkingIcon,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  key: 'home' | 'findSpot' | 'mySpots' | 'myCars' | 'bookings' | 'buildings' | 'myBuilding'
  icon: LucideIcon
  /** Omitted until the page exists — the item shows a "coming soon" toast instead */
  to?: '/home' | '/find' | '/spots' | '/cars' | '/bookings' | '/buildings' | '/building/$buildingId'
  /** Shown only to admins, or only to building admins (who get their building as `buildingId`) */
  audience?: 'admin' | 'buildingAdmin'
}

export const navItems: NavItem[] = [
  { key: 'home', icon: HouseIcon, to: '/home' },
  { key: 'findSpot', icon: CompassIcon, to: '/find' },
  { key: 'mySpots', icon: SquareParkingIcon, to: '/spots' },
  { key: 'myCars', icon: CarIcon, to: '/cars' },
  { key: 'bookings', icon: CalendarDaysIcon, to: '/bookings' },
  { key: 'buildings', icon: Building2Icon, to: '/buildings', audience: 'admin' },
  {
    key: 'myBuilding',
    icon: ShieldCheckIcon,
    to: '/building/$buildingId',
    audience: 'buildingAdmin',
  },
]
