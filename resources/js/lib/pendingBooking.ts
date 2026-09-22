/**
 * Utility for managing pending booking data in localStorage
 * This allows guests to proceed through signup/login before confirming their booking
 */

export interface PendingBooking {
  services: Array<{
    service_name: string
    selectedVariant: {
      service_variant: number
      size: string
      price: number
      estimated_duration: number
    }
  }>
  date: string
  time: string
  guestInfo: {
    name: string
    email: string
    phone: string
  } | null
  totalPrice: number
}

const STORAGE_KEY = 'gearhead_pending_booking'

export function savePendingBooking(booking: PendingBooking): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(booking))
}

export function getPendingBooking(): PendingBooking | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function clearPendingBooking(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasPendingBooking(): boolean {
  return !!getPendingBooking()
}
