import Heading from '@/components/heading'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Inertia } from '@inertiajs/inertia'
import { Head, Link, router } from '@inertiajs/react'
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Clock as ClockIcon,
  History,
  Info,
  Tag,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'My Bookings', href: '/bookings' }]

interface Booking {
  service_order_id: number
  order_status: string
  order_date: string
  order_type: string
  services: string
  total_amount: number
  payment_method?: string
  created_at: string
}

interface PaginatedLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  links: PaginatedLink[]
}

interface BookingsProps {
  bookings: PaginatedResponse<Booking>
  filters: {
    status: string
    per_page: number
  }
}

export default function Bookings({
  bookings = {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 9,
    total: 0,
    links: [],
  } as PaginatedResponse<Booking>,
  filters = { status: 'all', per_page: 9 },
}: BookingsProps) {
  const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all')
  const [perPage, setPerPage] = useState(filters?.per_page || 9)

  // Navigation handlers
  const handlePageChange = (url: string) => {
    router.get(
      url,
      {},
      {
        preserveState: true,
        preserveScroll: true,
      },
    )
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    router.get('/bookings', { status, per_page: perPage }, { preserveState: true, replace: true })
  }

  const handlePerPageChange = (val: string) => {
    const newPerPage = Number(val)
    setPerPage(newPerPage)
    router.get(
      '/bookings',
      { status: selectedStatus, per_page: newPerPage },
      { preserveState: true, replace: true },
    )
  }

  // View Details modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [isCancelClosing, setIsCancelClosing] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setModalOpen(true)
    setIsClosing(false)
  }

  const closeModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setSelectedBooking(null)
      setModalOpen(false)
      setIsClosing(false)
    }, 400)
  }

  const openCancelModal = (booking: Booking) => {
    setBookingToCancel(booking)
    setCancelModalOpen(true)
    setIsCancelClosing(false)
  }

  const closeCancelModal = () => {
    setIsCancelClosing(true)
    setTimeout(() => {
      setBookingToCancel(null)
      setCancelModalOpen(false)
      setIsCancelClosing(false)
    }, 400)
  }

  const confirmCancel = () => {
    if (!bookingToCancel) return

    Inertia.post(
      `/bookings/cancel/${bookingToCancel.service_order_id}`,
      {},
      {
        onSuccess: () => {
          toast.success('Booking cancelled successfully!')
          closeCancelModal()
          if (
            selectedBooking &&
            selectedBooking.service_order_id === bookingToCancel.service_order_id
          ) {
            closeModal()
          }
        },
        onError: () => {
          toast.error('Failed to cancel booking')
        },
      },
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: AlertCircle,
          variant: 'warning' as const,
          label: 'Pending',
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
        }
      case 'in_progress':
        return {
          icon: ClockIcon,
          variant: 'info' as const,
          label: 'Service In Progress',
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
        }
      case 'completed':
        return {
          icon: CheckCircle,
          variant: 'success' as const,
          label: 'Completed',
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
        }
      case 'cancelled':
        return {
          icon: X,
          variant: 'destructive' as const,
          label: 'Cancelled',
          color: 'text-rose-500',
          bg: 'bg-rose-500/10',
        }
      default:
        return {
          icon: ClockIcon,
          variant: 'secondary' as const,
          label: status.toUpperCase(),
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
        }
    }
  }

  const canCancel = (status: string) => !['in_progress', 'completed', 'cancelled'].includes(status)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="My Bookings" />

      <div className="flex h-full flex-1 flex-col gap-8 rounded-xl p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Heading
            title="My Bookings"
            description="Keep track of your vehicle's care history and upcoming sessions."
          />

          {/* Status Filter Control */}
          <div className="flex w-full overflow-x-auto rounded-2xl bg-secondary/30 p-1 md:w-auto">
            {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map(
              (status) => {
                const isActive = status === selectedStatus
                const displayLabel =
                  status === 'all'
                    ? 'All'
                    : status === 'in_progress'
                      ? 'In Progress'
                      : status.charAt(0).toUpperCase() + status.slice(1)

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all md:px-6 md:py-2.5 md:text-sm ${
                      isActive
                        ? 'scale-105 bg-highlight text-black shadow-lg shadow-highlight/20'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }`}
                  >
                    {displayLabel}
                  </button>
                )
              },
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-white shadow-2xl dark:bg-card/50">
          <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {bookings.data.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {bookings.data.map((b, index) => {
                  const config = getStatusConfig(b.order_status)
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={b.service_order_id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/10 bg-white transition-all duration-500 animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-2 hover:border-highlight/20 hover:shadow-2xl dark:bg-muted/5"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                      {/* Status Accent Bar */}
                      <div
                        className={`absolute top-0 left-0 h-1.5 w-full ${config.bg.replace('/10', '')} opacity-80`}
                      />

                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.bg} ${config.color}`}
                          >
                            <StatusIcon className="h-6 w-6" />
                          </div>
                          <Badge
                            variant={config.variant}
                            className="px-3 py-1 font-bold tracking-wider uppercase"
                          >
                            {config.label}
                          </Badge>
                        </div>

                        <div className="mb-6 flex-1 text-left">
                          <h4 className="mb-2 text-xl leading-tight font-black text-foreground transition-all">
                            {b.services || 'General Service'}
                          </h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground/80">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CalendarDays className="h-4 w-4 text-highlight" />
                              {new Date(b.order_date).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <Clock className="h-4 w-4 text-highlight" />
                              {new Date(b.order_date).toLocaleTimeString('en-PH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between border-t border-muted/20 pt-5">
                          <div className="space-y-1 text-left">
                            <p className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">
                              Total
                            </p>
                            <p className="text-2xl font-black text-foreground">
                              ₱{b.total_amount.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openModal(b)}
                              className="h-10 rounded-xl px-4 font-black hover:bg-secondary/50"
                            >
                              Details
                            </Button>
                            {canCancel(b.order_status) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openCancelModal(b)}
                                className="h-10 rounded-xl px-4 font-black"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 rounded-full bg-secondary/30 p-8 text-muted-foreground/50">
                  <History className="h-16 w-16" />
                </div>
                <h3 className="mb-2 text-2xl font-black text-foreground">No bookings found</h3>
                <p className="mb-8 max-w-md text-muted-foreground font-medium">
                  {selectedStatus === 'all'
                    ? "You haven't made any bookings yet. Ready to give your car some love?"
                    : `You don't have any bookings with status "${selectedStatus}".`}
                </p>
                <Link href="/services">
                  <Button className="h-14 rounded-2xl bg-highlight px-8 font-black text-black shadow-lg shadow-highlight/20 transition-all hover:scale-105 active:scale-95">
                    Book A Service Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Pagination Bar */}
          {bookings.data.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-6 px-10 py-8 md:flex-row border-t border-border/20 bg-muted/10">
              <div className="flex items-center gap-5">
                <span className="text-xs font-black tracking-widest text-muted-foreground/60 uppercase">Rows per page</span>
                <Select
                  value={perPage.toString()}
                  onValueChange={handlePerPageChange}
                >
                  <SelectTrigger className="h-10 w-[80px] rounded-xl border-border/40 bg-white font-black dark:bg-card">
                    <SelectValue placeholder={perPage} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 bg-white font-bold dark:bg-card">
                    {[6, 9, 12, 15, 30].map((pageSize) => (
                      <SelectItem
                        key={pageSize}
                        value={pageSize.toString()}
                        className="rounded-lg transition-colors hover:bg-secondary text-foreground"
                      >
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs font-bold text-muted-foreground/40">
                  Displaying {bookings.data.length} of {bookings.total} records
                </span>
              </div>

              <Pagination
                links={bookings.links}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* View Details Modal */}
        {modalOpen && selectedBooking && (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'bg-black/60 backdrop-blur-md'}`}
          >
            <div
              className={`relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-sidebar-border bg-background p-0 shadow-2xl transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
            >
              {/* Modal Header/Glow */}
              <div
                className={`absolute top-0 left-0 h-1.5 w-full ${getStatusConfig(selectedBooking.order_status).bg.replace('/10', '')}`}
              />

              <div className="p-8 md:p-10">
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 rounded-full bg-secondary/80 p-2.5 text-muted-foreground transition-all hover:rotate-90 hover:bg-secondary hover:text-foreground active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-8 flex items-center gap-5">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl ${getStatusConfig(selectedBooking.order_status).bg} ${getStatusConfig(selectedBooking.order_status).color}`}
                  >
                    {(() => {
                      const { icon: Icon } = getStatusConfig(selectedBooking.order_status)
                      return <Icon className="h-8 w-8" />
                    })()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground">Booking Details</h3>
                    <p className="text-xs font-black tracking-widest text-muted-foreground/40 uppercase">
                      ID #{selectedBooking.service_order_id.toString().padStart(5, '0')}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground/40 uppercase text-left">
                        <Tag className="h-3.5 w-3.5" /> Services
                      </div>
                      <p className="text-sm leading-snug font-bold text-foreground text-left">
                        {selectedBooking.services}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground/40 uppercase text-left">
                        <Calendar className="h-3.5 w-3.5" /> Date & Time
                      </div>
                      <p className="text-sm font-bold text-foreground text-left">
                        {new Date(selectedBooking.order_date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-b border-muted/20 pb-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground/40 uppercase text-left">
                        <History className="h-3.5 w-3.5" /> Requested At
                      </div>
                      <p className="text-sm font-bold text-foreground text-left">
                        {new Date(selectedBooking.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground/40 uppercase text-left">
                        <Info className="h-3.5 w-3.5" /> Order Type
                      </div>
                      <p className="text-sm font-bold text-foreground text-left">
                        {selectedBooking.order_type === 'W' ? 'Walk-in' : 'Reservation'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-[2rem] border border-border/50 bg-muted/40 p-6 shadow-inner dark:bg-muted/10">
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] font-black tracking-widest text-muted-foreground/80 uppercase">
                        Total Amount
                      </p>
                      <p className="text-4xl font-black text-foreground leading-none">
                        ₱{selectedBooking.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={getStatusConfig(selectedBooking.order_status).variant}
                      className="px-5 py-2 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-black/10"
                    >
                      {getStatusConfig(selectedBooking.order_status).label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    className="h-14 flex-1 rounded-2xl border-2 border-primary/20 font-black transition-all hover:bg-primary/5 active:scale-95"
                  >
                    Close
                  </Button>
                  {canCancel(selectedBooking.order_status) && (
                    <Button
                      variant="destructive"
                      className="h-14 flex-1 rounded-2xl font-black transition-transform active:scale-95"
                      onClick={() => openCancelModal(selectedBooking)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelModalOpen && bookingToCancel && (
          <div
            className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${isCancelClosing ? 'opacity-0' : 'bg-black/80 backdrop-blur-xl'}`}
          >
            <div
              className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-background p-8 text-center shadow-2xl transition-all duration-300 ${isCancelClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500">
                <AlertCircle className="h-10 w-10" />
              </div>

              <h3 className="mb-2 text-2xl font-black text-foreground text-center">Cancel Booking?</h3>
              <p className="mb-8 text-muted-foreground text-center">
                This will remove your reservation for{' '}
                <span className="font-bold text-foreground">{bookingToCancel.services}</span>. This
                action cannot be undone.
              </p>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={closeCancelModal}
                  className="h-14 flex-1 rounded-2xl font-black transition-transform active:scale-95"
                >
                  No, Keep it
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmCancel}
                  className="h-14 flex-1 rounded-2xl font-black shadow-lg shadow-rose-500/20 transition-transform hover:bg-rose-600 active:scale-95"
                >
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
