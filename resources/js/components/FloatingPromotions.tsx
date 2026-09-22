import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Percent, Sparkles, Tag, X } from 'lucide-react'
import React, { useState } from 'react'

interface Discount {
  discount_id: number
  name: string
  type: 'percentage' | 'fixed'
  value: string | number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
}

interface FloatingPromotionsProps {
  discounts?: Discount[]
}

const FloatingPromotions: React.FC<FloatingPromotionsProps> = ({ discounts = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible || !discounts || discounts.length === 0) return null

  const discount = discounts[currentIndex]
  const now = new Date()
  const validFrom = discount.valid_from ? new Date(discount.valid_from) : null
  const validTo = discount.valid_to ? new Date(discount.valid_to) : null

  const isUpcoming = validFrom && validFrom > now
  const isActive = !isUpcoming && (!validTo || validTo >= now)

  const formatValue = () => {
    if (discount.type === 'percentage') {
      return `${Number(discount.value)}% OFF`
    }
    return `₱${Number(discount.value).toLocaleString()} OFF`
  }

  const nextPromo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % discounts.length)
  }

  const prevPromo = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + discounts.length) % discounts.length)
  }

  return (
    <div className="fixed right-6 top-24 z-50 w-[calc(100%-3rem)] max-w-[320px] duration-700 animate-in fade-in slide-in-from-top-10">
      <div
        className={`group relative overflow-hidden rounded-[2rem] border p-1 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
          isActive
            ? 'border-highlight/30 bg-gradient-to-br from-highlight/10 via-background to-highlight/5 shadow-highlight/20'
            : 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-background to-blue-500/5 shadow-blue-500/20'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 z-20 rounded-full bg-background/50 p-1.5 text-muted-foreground backdrop-blur-md transition-all hover:bg-background hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Background Glow */}
        <div
          className={`absolute -top-20 -right-20 h-48 w-48 rounded-full blur-[80px] transition-all duration-700 group-hover:scale-125 ${
            isActive ? 'bg-highlight/20' : 'bg-blue-500/20'
          }`}
        />

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:rotate-12 ${
                isActive ? 'bg-highlight text-black' : 'bg-blue-500 text-white'
              }`}
            >
              {discount.type === 'percentage' ? (
                <Percent className="h-5 w-5" />
              ) : (
                <Tag className="h-5 w-5" />
              )}
            </div>
            <Badge
              className={`px-2.5 py-0.5 text-[8px] font-black tracking-widest uppercase shadow-sm ${
                isActive
                  ? 'bg-highlight text-black hover:bg-highlight/90'
                  : 'bg-blue-500 text-white hover:bg-blue-500/90'
              }`}
            >
              {isActive ? 'Active Promo' : 'Upcoming'}
            </Badge>
          </div>

          <div className="mt-5 space-y-1">
            <h3 className="text-lg leading-none font-black tracking-tighter text-foreground uppercase">
              {discount.name}
            </h3>
            <p
              className={`text-3xl font-black tracking-tighter italic ${isActive ? 'text-highlight' : 'text-blue-500'}`}
            >
              {formatValue()}
            </p>
          </div>

          {isActive && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-highlight/10 bg-highlight/5 p-3 text-[10px] font-bold text-highlight">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Claim this discount now!
            </div>
          )}

          {discounts.length > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-border/10 pt-4">
              <div className="flex gap-1.5">
                {discounts.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'w-6 bg-highlight' : 'w-1.5 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-highlight/10 hover:text-highlight"
                  onClick={prevPromo}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-highlight/10 hover:text-highlight"
                  onClick={nextPromo}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FloatingPromotions
