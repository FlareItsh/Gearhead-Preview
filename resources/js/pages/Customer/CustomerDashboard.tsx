import DashboardBookingConfirmation from '@/components/DashboardBookingConfirmation'
import FloatingPromotions from '@/components/FloatingPromotions'
import FloatingReview from '@/components/FloatingReview'
import HeadingSmall from '@/components/heading-small'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { clearPendingBooking, getPendingBooking, type PendingBooking } from '@/lib/pendingBooking'
import type { SharedData } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  HandCoins,
  History,
  Star,
  Timer,
  Wrench,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { route } from 'ziggy-js'

const CustomerDashboard: React.FC = () => {
  const pageProps = usePage().props as unknown as SharedData & {
    paymentsCount?: number
    totalSpent?: number
    discounts?: any[]
  }
  const { auth } = pageProps
  const firstName = auth?.user?.first_name ?? auth?.user?.name ?? 'there'
  const paymentsCount = pageProps.paymentsCount ?? 0
  const totalSpent = pageProps.totalSpent ?? 0

  const loyaltyThreshold = pageProps.loyaltyThreshold ?? 9
  const loyaltyProgress = paymentsCount % loyaltyThreshold
  const loyaltyTarget = loyaltyThreshold
  const progressPercentage = (loyaltyProgress / loyaltyTarget) * 100

  const [upcomingBookings, setUpcomingBookings] = useState<
    Array<{
      service_order_id: string | number
      service_names: string
      order_date: string
      order_type: string
      total_amount: string | number
      status: string
    }>
  >([])
  const [payments, setPayments] = useState<
    Array<{
      payment_id: string | number
      services: string
      date: string
      amount: string | number
      payment_status: string
    }>
  >([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    const fetchData = () => {
      axios
        .get(route('payments.user'))
        .then((res) => setPayments(res.data?.paginated?.data || []))
        .catch((err) => console.error('Payments error:', err))

      axios
        .get(route('bookings.upcoming'))
        .then((res) => setUpcomingBookings(res.data))
        .catch((err) => console.error('Upcoming bookings error:', err))
    }

    const pending = getPendingBooking()
    if (pending) {
      setPendingBooking(pending)
      setShowConfirmation(true)
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const recentPayments = [...payments]
    .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())
    .slice(0, 5)

  const handleConfirmBooking = async () => {
    if (!pendingBooking || isConfirming) return
    setIsConfirming(true)
    try {
      const timeString = pendingBooking.time
      let hour = 0,
        minute = 0
      const timeMatch = timeString.match(/(\d+):(\d+)/)
      if (timeMatch) {
        hour = parseInt(timeMatch[1]) || 0
        minute = parseInt(timeMatch[2]) || 0
      }
      if (timeString.includes('PM') && hour < 12) hour += 12
      else if (timeString.includes('AM') && hour === 12) hour = 0

      const hours = String(hour).padStart(2, '0')
      const minutes = String(minute).padStart(2, '0')
      const orderDate = `${pendingBooking.date} ${hours}:${minutes}`

      await axios.post('/api/bookings/book', {
        order_date: orderDate,
        variant_ids: pendingBooking.services.map((s) => s.selectedVariant.service_variant),
      })

      clearPendingBooking()
      setPendingBooking(null)
      setShowConfirmation(false)
      toast.success('Booking confirmed successfully!')

      const res = await axios.get(route('bookings.upcoming'))
      setUpcomingBookings(res.data)
    } catch (error: any) {
      console.error('Failed to confirm booking:', error)
      const message = error.response?.data?.message || 'Failed to confirm booking. Please try again.'
      toast.error(message)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <>
      <DashboardBookingConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        booking={pendingBooking}
        isLoading={isConfirming}
        onConfirm={handleConfirmBooking}
      />

      <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-4 duration-700 animate-in fade-in slide-in-from-bottom-4 md:p-6 lg:p-8">
        <FloatingPromotions discounts={pageProps.discounts} />
        {pageProps.auth.user.role === 'customer' && <FloatingReview />}
        {/* --- Hero Section --- */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-muted/20 shadow-xl transition-all duration-700">
          <div className="absolute inset-0 z-0">
            <img
              src="/images/dashboard-hero.png"
              alt="Premium Car Care"
              className="h-full w-full object-cover opacity-30 mix-blend-overlay dark:opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col gap-4 px-8 py-10 md:max-w-3xl md:px-12 md:py-14">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Welcome back, <span className="text-highlight italic">{firstName}!</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground/80 md:text-base">
                Ready to make your machine shine today?
              </p>
            </div>

            <div className="mt-2 flex flex-wrap gap-4">
              <Link href="/services">
                <Button className="h-12 bg-highlight px-8 text-base font-black text-black shadow-lg shadow-highlight/20 transition-all hover:scale-105">
                  <CalendarDays className="mr-2 h-4 w-4" /> Book Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <div className="grid gap-6 md:grid-cols-12">
          {/* Loyalty Progress Card - Takes more space */}
          <div className="relative col-span-12 overflow-hidden rounded-[2.5rem] border border-border/50 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-8 dark:bg-card">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-2xl font-black text-foreground">
                  <Star className="h-6 w-6 fill-highlight text-highlight" />
                  Loyalty Rewards
                </h4>
                <p className="text-sm font-medium text-muted-foreground/80">
                  Every {loyaltyThreshold}th wash is on us!
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-foreground">{loyaltyProgress}</span>
                <span className="text-xl font-bold text-muted-foreground/40">
                  {' '}
                  / {loyaltyTarget}
                </span>
              </div>
            </div>

            <div className="relative h-5 w-full overflow-hidden rounded-full bg-secondary shadow-inner">
              <div
                className="h-full bg-highlight shadow-lg transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className={`mt-8 grid gap-3`} style={{ gridTemplateColumns: `repeat(${loyaltyThreshold}, minmax(0, 1fr))` }}>
              {Array.from({ length: loyaltyThreshold }).map((_, i) => (
                <div
                  key={i}
                  className={`flex h-10 items-center justify-center rounded-xl border-2 transition-all ${
                    i < loyaltyProgress
                      ? 'border-highlight/50 bg-highlight/20 text-highlight shadow-sm'
                      : 'border-dashed border-muted-foreground/20 text-muted-foreground/20'
                  }`}
                >
                  <Wrench className={`h-5 w-5 ${i < loyaltyProgress ? 'animate-bounce' : ''}`} />
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm font-bold text-highlight text-muted-foreground/70 italic">
              ✨ {loyaltyTarget - loyaltyProgress} more bookings until your next reward!
            </p>
          </div>

          {/* Quick Stats Column */}
          <div className="col-span-12 flex flex-col gap-4 md:col-span-4">
            <div className="group flex flex-1 items-center gap-4 rounded-[2.5rem] border border-border/40 bg-white p-6 transition-all hover:-translate-y-1 hover:border-highlight/50 hover:shadow-xl dark:bg-card">
              <div className="rounded-2xl bg-blue-500/10 p-4 text-blue-500 transition-all group-hover:scale-110">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="mb-1 text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
                  Total Services
                </p>
                <h3 className="text-3xl font-black text-foreground">{paymentsCount}</h3>
              </div>
            </div>

            <div className="group flex flex-1 items-center gap-4 rounded-[2.5rem] border border-border/40 bg-white p-6 transition-all hover:-translate-y-1 hover:border-highlight/50 hover:shadow-xl dark:bg-card">
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-500 transition-all group-hover:scale-110">
                <HandCoins className="h-6 w-6" />
              </div>
              <div>
                <p className="mb-1 text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
                  Total Spent
                </p>
                <h3 className="text-3xl font-black text-foreground">
                  ₱{totalSpent.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* --- Desktop Two-Column Activity --- */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Upcoming Bookings - Main Column */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <HeadingSmall
                title="Upcoming Appointments"
                description="Your upcoming car care sessions"
              />
              <Link href="/bookings">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-highlight"
                >
                  Manage <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <div
                    key={String(booking.service_order_id)}
                    className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-highlight/50 hover:shadow-2xl dark:bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-highlight/10 text-highlight transition-all group-hover:scale-110 group-hover:rotate-6">
                          <Timer className="h-7 w-7" />
                        </div>
                        <div>
                          <h5 className="text-xl leading-tight font-black text-foreground">
                            {booking.service_names || 'Carwash Service'}
                          </h5>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-muted-foreground/70 transition-colors group-hover:text-foreground">
                            <CalendarDays className="h-4 w-4 text-highlight" />
                            {new Date(String(booking.order_date)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          booking.status === 'pending'
                            ? 'warning'
                            : booking.status === 'in_progress'
                              ? 'info'
                              : booking.status === 'completed'
                                ? 'success'
                                : 'destructive'
                        }
                        className="px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm"
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-4">
                      <div className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
                        Estimate:
                        <span className="ml-2 text-lg font-black tracking-normal text-foreground normal-case">
                          ₱{Number(booking.total_amount).toLocaleString()}
                        </span>
                      </div>
                      <span className="rounded-xl bg-secondary px-3 py-1.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        {booking.order_type === 'R' ? 'Reservation' : 'Walk-in'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-12 text-center">
                  <div className="mb-3 rounded-full bg-secondary p-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No upcoming bookings</p>
                  <Link
                    href="/services"
                    className="mt-2 font-bold text-highlight hover:underline"
                  >
                    Book a service now
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent History - Sidebar Column */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <HeadingSmall
                title="Recent Activity"
                description="Completed services"
              />
              <History className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment) => (
                  <div
                    key={String(payment.payment_id)}
                    className="group relative flex flex-col rounded-[2rem] border border-border/40 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-highlight/30 hover:shadow-xl dark:bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 transition-all group-hover:scale-105">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h6 className="text-base leading-none leading-tight font-black tracking-tighter text-foreground uppercase">
                          {payment.services || 'General Service'}
                        </h6>
                        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-muted-foreground/70">
                          <History className="h-3 w-3" />
                          {new Date(String(payment.date)).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-4">
                      <span className="rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        Status: Completed
                      </span>
                      <span className="text-xl font-black tracking-tighter text-foreground antialiased">
                        ₱{Number(payment.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-white/50 py-12 text-center dark:bg-card/50">
                  <p className="text-sm font-medium text-muted-foreground">
                    No recent activity found.
                  </p>
                </div>
              )}

              {recentPayments.length > 0 && (
                <Link
                  href="/bookings?status=completed"
                  className="group mt-4 flex items-center justify-center gap-1 text-sm font-bold text-muted-foreground transition-colors hover:text-highlight"
                >
                  View full history{' '}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CustomerDashboard
