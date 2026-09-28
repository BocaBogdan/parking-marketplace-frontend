import {
  CalendarDaysIcon,
  CarIcon,
  CompassIcon,
  HouseIcon,
  SquareParkingIcon,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  key: 'home' | 'findSpot' | 'mySpots' | 'myCars' | 'bookings'
  icon: LucideIcon
  /** Omitted until the page exists — the item shows a "coming soon" toast instead */
  to?: '/home' | '/spots'
}

export const navItems: NavItem[] = [
  { key: 'home', icon: HouseIcon, to: '/home' },
  { key: 'findSpot', icon: CompassIcon },
  { key: 'mySpots', icon: SquareParkingIcon, to: '/spots' },
  { key: 'myCars', icon: CarIcon },
  { key: 'bookings', icon: CalendarDaysIcon },
]
