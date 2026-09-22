import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Phone, User } from 'lucide-react'
import { useState } from 'react'

interface GuestInfo {
  name: string
  email: string
  phone: string
}

interface GuestBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (guestInfo: GuestInfo) => void
  isLoading?: boolean
}

export default function GuestBookingModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: GuestBookingModalProps) {
  const [formData, setFormData] = useState<GuestInfo>({
    name: '',
    email: '',
    phone: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10,}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Valid phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
      setFormData({ name: '', email: '', phone: '' })
      setErrors({})
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Complete Your Booking</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please provide your information to finalize your carwash reservation
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="flex items-center gap-2 text-foreground"
            >
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={isLoading}
              className={errors.name ? 'border-red-500 dark:border-red-400' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 dark:text-red-400">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 text-foreground"
            >
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              disabled={isLoading}
              className={errors.email ? 'border-red-500 dark:border-red-400' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="flex items-center gap-2 text-foreground"
            >
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+63 9XX XXX XXXX"
              disabled={isLoading}
              className={errors.phone ? 'border-red-500 dark:border-red-400' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.phone}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="highlight"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : 'Continue Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
