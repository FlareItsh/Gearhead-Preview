import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PendingBooking } from '@/lib/pendingBooking'
import { Clock, Loader2 } from 'lucide-react'

interface DashboardBookingConfirmationProps {
  isOpen: boolean
  onClose: () => void
  booking: PendingBooking | null
  isLoading?: boolean
  onConfirm?: () => void
}

export default function DashboardBookingConfirmation({
  isOpen,
  onClose,
  booking,
  isLoading = false,
  onConfirm,
}: DashboardBookingConfirmationProps) {
  if (!booking) return null

  const totalDuration = booking.services.reduce(
    (sum, s) => sum + (s.selectedVariant.estimated_duration || 0),
    0,
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Confirm Your Booking</DialogTitle>
          <DialogDescription>Your carwash reservation is ready to be saved</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Services */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Services</h3>
            <div className="space-y-1 rounded-lg bg-muted/50 p-3">
              {booking.services.map((service, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm"
                >
                  <span className="text-foreground">
                    {service.service_name} - {service.selectedVariant.size}
                  </span>
                  <span className="font-medium">
                    ₱{Number(service.selectedVariant.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled for</p>
                <p className="text-sm font-semibold text-foreground">
                  {booking.date} at {booking.time}
                </p>
                <p className="text-xs text-muted-foreground">Duration: ~{totalDuration} minutes</p>
              </div>
            </div>
          </div>

          {/* Total Price */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 dark:bg-muted/50">
            <span className="text-sm font-medium text-foreground">Total Amount</span>
            <span className="text-lg font-bold text-foreground">
              ₱{booking.totalPrice.toLocaleString()}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="highlight"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
