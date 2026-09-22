import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useForm } from '@inertiajs/react'
import { LoaderCircle, Star } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { route } from 'ziggy-js'

export default function FloatingReview() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const { data, setData, post, processing, reset, errors } = useForm({
    rating: 5,
    comment: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('reviews.store'), {
      onSuccess: () => {
        setIsOpen(false)
        reset()
        toast.success('Thank you! Your review has been submitted for moderation.')
        setIsDismissed(true) // Don't show again in this session
      },
      onError: () => {
        toast.error('Failed to submit review. Please try again.')
      },
    })
  }

  if (isDismissed) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <div
          className={`mb-2 rounded-xl border border-border bg-white p-3 shadow-xl transition-all duration-300 dark:bg-card ${
            isHovered && !isOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
          }`}
        >
          <p className="whitespace-nowrap text-xs font-black tracking-widest text-foreground uppercase">
            Leave a review now!
          </p>
        </div>

        <div
          className="relative transition-transform duration-200 active:scale-95"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Button
            onClick={() => setIsOpen(true)}
            variant="highlight"
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl shadow-highlight/40"
          >
            <Star className="h-6 w-6 fill-current text-black" />
          </Button>
        </div>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-highlight text-highlight" />
              Share Your Experience
            </DialogTitle>
            <DialogDescription>
              We'd love to hear what you think of Gearhead!
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 py-4"
          >
            <div className="space-y-3 text-center">
              <Label className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                Overall Rating
              </Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setData('rating', star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= data.rating
                          ? 'fill-highlight text-highlight'
                          : 'fill-muted/20 text-muted/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="comment"
                className="text-xs font-black tracking-widest text-muted-foreground uppercase"
              >
                Your Review
              </Label>
              <textarea
                id="comment"
                value={data.comment}
                onChange={(e) => setData('comment', e.target.value)}
                placeholder="Tell us about your experience..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
              {errors.comment && <p className="text-xs text-destructive">{errors.comment}</p>}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Maybe later
              </Button>
              <Button
                type="submit"
                variant="highlight"
                disabled={processing}
              >
                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
