import Heading from '@/components/heading'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { Check, Clock, Search, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Bookings', href: '/admin/bookings' }]

interface Booking {
  service_order_id: number
  customer_name: string
  service_names: string
  order_date: string
  total_price: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
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

export default function AdminBookings() {
  const [bookingsData, setBookingsData] = useState<PaginatedResponse<Booking> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  >('All')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortValue, setSortValue] = useState('earliest')
  const [isLoading, setIsLoading] = useState(true)
  const [perPage, setPerPage] = useState(10)

  // Set dynamic dates (month-to-date)
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const day = now.getDate()

    const firstDay = new Date(year, month, 1)
    const todayLocal = new Date(year, month, day)

    const formatLocal = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    setStartDate(formatLocal(firstDay))
    setEndDate(formatLocal(todayLocal))
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      const timer = setTimeout(() => {
        loadBookings()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [startDate, endDate, searchValue, statusFilter, perPage, sortValue])

  const loadBookings = async (url?: string) => {
    try {
      setIsLoading(true)
      const endpoint = url || '/api/service-orders/bookings'
      const sortParams = (
        {
          earliest: { sort_by: 'order_date', sort_order: 'asc' },
          newest: { sort_by: 'order_date', sort_order: 'desc' },
          name_asc: { sort_by: 'customer_name', sort_order: 'asc' },
          price_desc: { sort_by: 'total_price', sort_order: 'desc' },
        } as const
      )[sortValue as keyof typeof sortParams] || { sort_by: 'order_date', sort_order: 'asc' }

      const params: any = {
        ...sortParams,
        per_page: perPage,
        search: searchValue,
        start_date: startDate,
        end_date: endDate,
        status: statusFilter === 'All' ? null : statusFilter,
      }

      let finalUrl = endpoint
      const finalParams = { ...params }

      if (url) {
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) finalParams.page = page
        // Ensure we keep using the base endpoint if the pagination link is full absolute URL which might point to wrong host if not careful,
        // but axios handles relative URLs well.
        // Laravel pagination links usually return full URL.
        // We can just use the URL provided by Laravel, but we MUST merge our current filters.
        // Actually, if we use the full URL from Laravel, it has page param.
        // We just need to attach our current filters as well.
        finalUrl = url
      } else {
        finalUrl = '/api/service-orders/bookings'
      }

      // If finalUrl is absolute, axios works. Params will be appended.
      // Important: duplicate params? url might have ?page=2. finalParams has page=2.
      // Whatever, axios handles it.

      const res = await axios.get(finalUrl, { params: finalParams })
      setBookingsData(res.data)
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (url: string) => {
    loadBookings(url)
  }

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge variant="info">
            <Check className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        )
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const renderServiceBullets = (serviceNames: string) => {
    if (!serviceNames) return <span className="text-muted-foreground">No service</span>
    const services = serviceNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return (
      <ul className="list-inside list-disc space-y-1 text-sm">
        {services.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Bookings" />
      <div className="flex flex-col gap-6 p-6">
        {/* Heading */}
        <div className="flex items-center justify-between">
          <Heading
            title="Bookings"
            description="Manage and track customer bookings"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px]"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
        </div>

        {/* Search & Filter */}
        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="flex flex-col gap-4 pt-5 pb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search</h2>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-medium text-muted-foreground">Sort by:</span>
                <Select
                  value={sortValue}
                  onValueChange={setSortValue}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="earliest">Earliest Booking</SelectItem>
                    <SelectItem value="newest">Newest Booking</SelectItem>
                    <SelectItem value="name_asc">Customer Name (A-Z)</SelectItem>
                    <SelectItem value="price_desc">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Filter */}
        <div className="flex w-full rounded-2xl bg-secondary p-1">
          {(['All', 'pending', 'in_progress', 'completed', 'cancelled'] as const).map((s) => {
            const isActive = statusFilter === s
            const displayLabel =
              s === 'All'
                ? 'All'
                : s === 'in_progress'
                  ? 'In Progress'
                  : s.charAt(0).toUpperCase() + s.slice(1)

            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${isActive ? 'bg-highlight text-black shadow-sm' : 'text-foreground/70'}`}
              >
                {displayLabel}
              </button>
            )
          })}
        </div>
        {/* Booking List */}
        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="p-0">
            {/* Header */}
            <div className="border-b border-border/50 px-6 pt-5 pb-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Booking List</h2>
                <p className="text-sm text-muted-foreground">
                  Total Bookings: {bookingsData?.total || 0}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-highlight" />
              </div>
            ) : !bookingsData || bookingsData.data.length === 0 ? (
              <div className="py-32 text-center text-muted-foreground">
                No bookings found for the selected filters.
              </div>
            ) : (
              <>
                {/* Desktop: Scrollable Table with Sticky Header */}
                <div className="hidden lg:block">
                  <div className="custom-scrollbar max-h-[65vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <TableRow className="border-b border-border/50">
                          <TableHead className="font-semibold">Customer</TableHead>
                          <TableHead className="font-semibold">Services</TableHead>
                          <TableHead className="font-semibold">Date & Time</TableHead>
                          <TableHead className="font-semibold">Requested At</TableHead>
                          <TableHead className="text-right font-semibold">Price</TableHead>
                          <TableHead className="text-center font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookingsData.data.map((b) => (
                          <TableRow
                            key={b.service_order_id}
                            className="border-b border-border/30 transition-colors hover:bg-muted/40"
                          >
                            <TableCell className="font-medium">{b.customer_name}</TableCell>
                            <TableCell className="max-w-xs">
                              {renderServiceBullets(b.service_names)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(b.order_date)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(b.created_at)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₱{Number(b.total_price).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(b.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile: Responsive Cards */}
                <div className="block space-y-4 p-4 lg:hidden">
                  {bookingsData.data.map((b) => (
                    <div
                      key={b.service_order_id}
                      className="rounded-xl border border-border/60 p-5 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{b.customer_name}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(b.order_date)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Requested: {formatDateTime(b.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            ₱{Number(b.total_price).toLocaleString()}
                          </p>
                          <div className="mt-2">{getStatusBadge(b.status)}</div>
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-3">
                        <p className="mb-2 text-sm font-medium text-foreground/90">Services:</p>
                        <div className="space-y-1 text-sm">
                          {renderServiceBullets(b.service_names)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {bookingsData && (
                  <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-border/50 p-4 sm:flex-row">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Rows per page</span>
                      <Select
                        value={perPage.toString()}
                        onValueChange={(v) => setPerPage(Number(v))}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={perPage} />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 25, 50, 100].map((pageSize) => (
                            <SelectItem
                              key={pageSize}
                              value={pageSize.toString()}
                            >
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination
                      links={bookingsData.links}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
