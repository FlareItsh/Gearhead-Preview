import { Badge } from '@/components/ui/badge'
import { CalendarDays, Percent, Sparkles, Tag, Timer } from 'lucide-react'
import React from 'react'

interface Discount {
  discount_id: number
  name: string
  type: 'percentage' | 'fixed'
  value: string | number
  valid_from: string | null
  valid_to: string | null
  is_active: boolean
}

interface PromotionCardProps {
  discount: Discount
}

const PromotionCard: React.FC<PromotionCardProps> = ({ discount }) => {
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className={`group relative overflow-hidden rounded-[2.5rem] border p-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${
      isActive 
        ? 'border-highlight/30 bg-gradient-to-br from-highlight/10 via-background to-highlight/5 shadow-highlight/10' 
        : 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-background to-blue-500/5 shadow-blue-500/10'
    }`}>
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] transition-all duration-700 group-hover:scale-150 ${
        isActive ? 'bg-highlight/20' : 'bg-blue-500/20'
      }`} />

      <div className="relative z-10 p-8">
        <div className="flex items-start justify-between">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
            isActive ? 'bg-highlight text-black' : 'bg-blue-500 text-white'
          }`}>
            {discount.type === 'percentage' ? <Percent className="h-7 w-7" /> : <Tag className="h-7 w-7" />}
          </div>
          <Badge className={`px-4 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-md ${
            isActive ? 'bg-highlight text-black hover:bg-highlight/90' : 'bg-blue-500 text-white hover:bg-blue-500/90'
          }`}>
            {isActive ? 'Active Promo' : 'Upcoming Promo'}
          </Badge>
        </div>

        <div className="mt-8 space-y-2">
          <h3 className="text-3xl font-black tracking-tighter text-foreground uppercase">
            {discount.name}
          </h3>
          <p className={`text-4xl font-black tracking-tighter italic ${isActive ? 'text-highlight' : 'text-blue-500'}`}>
            {formatValue()}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/10 pt-6">
          <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
            <div className={`rounded-lg p-2 ${isActive ? 'bg-highlight/10 text-highlight' : 'bg-blue-500/10 text-blue-500'}`}>
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">Validity Period</p>
              <p className="text-foreground transition-colors group-hover:text-highlight">
                {validFrom ? formatDate(validFrom) : 'Now'} — {validTo ? formatDate(validTo) : 'Unlimited'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
             <div className={`rounded-lg p-2 ${isActive ? 'bg-highlight/10 text-highlight' : 'bg-blue-500/10 text-blue-500'}`}>
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">Status</p>
              <p className="text-foreground">
                {isActive ? 'Available Today!' : `Starts in ${Math.ceil((validFrom!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days`}
              </p>
            </div>
          </div>
        </div>

        {isActive && (
          <div className="mt-8 flex items-center gap-2 rounded-2xl bg-highlight/5 p-4 text-xs font-bold text-highlight border border-highlight/10">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Apply this discount at checkout for instant savings!
          </div>
        )}
      </div>
    </div>
  )
}

export default PromotionCard
