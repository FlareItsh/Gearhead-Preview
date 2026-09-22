import { Button } from '@/components/ui/button'
import { router } from '@inertiajs/react'
import axios from 'axios'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface AddQueueModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddQueueModal({ isOpen, onClose, onSuccess }: AddQueueModalProps) {
  const [step, setStep] = useState<'initial' | 'booking'>('initial')
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('initial')
      fetchTodayBookings()
    }
  }, [isOpen])

  const fetchTodayBookings = async () => {
    setIsLoading(true)
    try {
      const res = await axios.get('/api/service-orders/today-bookings')
      setTodayBookings(res.data || [])
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      toast.error('Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectBooking = async (booking: any) => {
    setIsSubmitting(true)
    try {
      await axios.post('/api/queues/reservation', {
        service_order_id: booking.service_order_id,
      })
      toast.success('Reservation added to queue!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to add reservation to queue:', error)
      toast.error('Failed to process request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWalkIn = () => {
    router.visit('/registry/queue/select-services')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative mx-4 w-full max-w-2xl transform rounded-2xl border border-border bg-background p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          {step === 'initial' ? 'Add to Queue' : 'Select from Reservations'}
        </h2>

        {step === 'initial' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => setStep('booking')}
              className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-border p-8 transition-all hover:border-highlight hover:bg-muted/30 active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl transition-transform group-hover:scale-110 dark:bg-blue-900/30">
                📅
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Reservations</h3>
                <p className="mt-1 text-sm text-muted-foreground">For clients with prior booking</p>
              </div>
            </button>

            <button
              onClick={handleWalkIn}
              className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-border p-8 transition-all hover:border-highlight hover:bg-muted/30 active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl transition-transform group-hover:scale-110 dark:bg-orange-900/30">
                🚶
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">Walk-in Service</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create new order now</p>
              </div>
            </button>
          </div>
        )}

        {step === 'booking' && (
          <div className="space-y-4">
            <div className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                  <p>Loading reservations...</p>
                </div>
              ) : todayBookings.filter(b => !b.is_queued).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-lg font-medium">No reservations found today</p>
                </div>
              ) : (
                todayBookings
                  .filter((b) => !b.is_queued)
                  .map((booking) => (
                  <button
                    key={booking.service_order_id}
                    onClick={() => handleSelectBooking(booking)}
                    disabled={isSubmitting}
                    className="group w-full rounded-xl border border-border p-4 text-left transition-all hover:border-highlight hover:bg-muted/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground group-hover:text-highlight transition-colors">
                            {booking.customer_name}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {booking.services}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-highlight">
                          ₱{parseFloat(booking.total).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(booking.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setStep('initial')} disabled={isSubmitting}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
