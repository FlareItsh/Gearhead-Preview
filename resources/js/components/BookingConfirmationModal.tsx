import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PendingBooking } from '@/lib/pendingBooking'
import { Clock, DollarSign, Phone, User } from 'lucide-react'

interface BookingConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  booking: PendingBooking | null
  isLoading?: boolean
  onProceedToSignup?: () => void
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  booking,
  isLoading = false,
  onProceedToSignup,
}: BookingConfirmationModalProps) {
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
          <DialogTitle className="text-xl">Booking Confirmed</DialogTitle>
          <DialogDescription>Your carwash reservation details</DialogDescription>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Date & Time
              </label>
              <p className="text-sm font-medium text-foreground">
                {booking.date}
                <br />
                {booking.time}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Duration
              </label>
              <p className="text-sm font-medium text-foreground">{totalDuration} mins</p>
            </div>
          </div>

          {/* Customer Info */}
          {booking.guestInfo && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Your Information</h3>
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium text-foreground">{booking.guestInfo.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{booking.guestInfo.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total Price */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 dark:bg-muted/50">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4" />
              Total Amount
            </span>
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
              Back
            </Button>
            <Button
              variant="highlight"
              onClick={onProceedToSignup}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : 'Create Account to Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
