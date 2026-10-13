import {
  Building2Icon,
  CalendarDaysIcon,
  CarIcon,
  CompassIcon,
  HouseIcon,
  SquareParkingIcon,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  key: 'home' | 'findSpot' | 'mySpots' | 'myCars' | 'bookings' | 'buildings'
  icon: LucideIcon
  /** Omitted until the page exists — the item shows a "coming soon" toast instead */
  to?: '/home' | '/find' | '/spots' | '/cars' | '/bookings' | '/buildings'
  /** Shown only to users with the ADMIN role */
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { key: 'home', icon: HouseIcon, to: '/home' },
  { key: 'findSpot', icon: CompassIcon, to: '/find' },
  { key: 'mySpots', icon: SquareParkingIcon, to: '/spots' },
  { key: 'myCars', icon: CarIcon, to: '/cars' },
  { key: 'bookings', icon: CalendarDaysIcon, to: '/bookings' },
  { key: 'buildings', icon: Building2Icon, to: '/buildings', adminOnly: true },
]
