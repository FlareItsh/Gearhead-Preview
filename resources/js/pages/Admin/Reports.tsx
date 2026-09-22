import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { BarChart3, PhilippinePeso, Repeat2, TrendingUp } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Reports', href: '/reports' }]

const areaChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-5)' },
  profit: { label: 'Profit', color: 'var(--chart-2)' },
} satisfies ChartConfig

const barChartConfig: ChartConfig = {
  bookings: { label: 'Bookings', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

const monthlyRevenueChartConfig: ChartConfig = {
  revenue: { label: 'Monthly Revenue', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig

export default function Reports() {
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [topServices, setTopServices] = useState<
    { service: string; size: string; value: number; label: string }[]
  >([])
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<
    Array<{ month: string; revenue: number }>
  >([])

  // Metric states
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalExpenses, setTotalExpenses] = useState<number>(0)
  const [totalProfit, setTotalProfit] = useState<number>(0)
  const [averageBookingValue, setAverageBookingValue] = useState<number>(0)
  const [retentionRate, setRetentionRate] = useState<number>(0)

  // Helper function to format date range
  const formatDateRange = (start: string, end: string): string => {
    if (!start || !end) return ''
    const startObj = new Date(start)
    const endObj = new Date(end)

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }

    const startFormatted = formatDate(startObj)
    const endFormatted = formatDate(endObj)

    return `${startFormatted} - ${endFormatted}`
  }

  // Full source data + visible slice for zoom
  const [sourceAreaData, setSourceAreaData] = useState<
    Array<{
      date: string
      revenue: number
      expenses: number
      profit: number
    }>
  >([])
  const [brushIndices, setBrushIndices] = useState<[number, number] | null>(null)
  const [mouseX, setMouseX] = useState<number>(0)
  const [chartContainerWidth, setChartContainerWidth] = useState<number>(0)

  const [isLoading, setIsLoading] = useState(true)

  // Dynamic month-to-date
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

  // Fetch data + live refresh
  useEffect(() => {
    if (!startDate || !endDate) return

    const fetchData = () => {
      Promise.allSettled([
        axios.get('/api/services/top-with-size', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/payments/summary', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/payments/financial-summary', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/payments/average-booking-value', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/payments/retention-rate', {
          params: { start_date: startDate, end_date: endDate },
        }),
      ]).finally(() => setIsLoading(false))

      axios
        .get('/services/top-with-size', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then((res) => {
          const mapped = res.data.map(
            (item: { service_name: string; size: string; total_bookings: number }) => ({
              service: item.service_name,
              size: item.size || 'N/A',
              value: item.total_bookings || 0,
              label: `${item.service_name} (${item.size || 'N/A'})`,
            }),
          )
          setTopServices(mapped)
        })

      Promise.all([
        axios.get('/api/payments/summary', {
          params: { start_date: startDate, end_date: endDate },
        }),
        axios.get('/api/supply-purchases/detailed', {
          params: { start_date: startDate, end_date: endDate },
        }),
      ])
        .then(([summaryRes, purchasesRes]) => {
          const revenue = summaryRes.data.total_amount || 0
          const totalExpensesAmount = purchasesRes.data.reduce(
            (sum: number, item: { total_amount?: number }) => sum + (item.total_amount || 0),
            0,
          )
          const profit = revenue - totalExpensesAmount

          setTotalRevenue(revenue)
          setTotalExpenses(totalExpensesAmount)
          setTotalProfit(profit)
        })
        .catch(() => {
          setTotalExpenses(0)
        })

      axios
        .get('/api/payments/financial-summary', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then((res) => {
          setSourceAreaData(res.data)
        })
        .catch(() => setSourceAreaData([]))

      axios
        .get('/payments/average-booking-value', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then((res) => {
          setAverageBookingValue(res.data.average_booking_value || 0)
        })
        .catch(() => setAverageBookingValue(0))

      axios
        .get('/payments/retention-rate', {
          params: { start_date: startDate, end_date: endDate },
        })
        .then((res) => {
          setRetentionRate(res.data.retention_rate || 0)
        })
        .catch(() => setRetentionRate(0))
    }

    fetchData()
    const interval = setInterval(fetchData, 180000)
    return () => clearInterval(interval)
  }, [startDate, endDate])

  // Fetch monthly revenue data
  useEffect(() => {
    if (!selectedYear) return

    axios
      .get('/api/payments/monthly-revenue', {
        params: { year: parseInt(selectedYear) },
      })
      .then((res) => {
        setMonthlyRevenueData(res.data)
      })
      .catch(() => setMonthlyRevenueData([]))
  }, [selectedYear])

  const zoomChart = useCallback(
    (direction: 'in' | 'out', cursorX?: number) => {
      setBrushIndices((prevIndices) => {
        if (sourceAreaData.length === 0) return prevIndices

        const start = prevIndices?.[0] ?? 0
        const end = prevIndices?.[1] ?? sourceAreaData.length - 1
        const range = end - start

        // Calculate cursor position ratio (0 to 1) within chart
        let cursorRatio = 0.5 // Default to center
        if (cursorX !== undefined && chartContainerWidth > 0) {
          cursorRatio = Math.max(0, Math.min(1, cursorX / chartContainerWidth))
        }

        const cursorIndex = start + Math.floor(range * cursorRatio)

        if (direction === 'in') {
          const newRange = Math.max(Math.floor(range * 0.7), 2)
          // Position new range so cursor stays at same relative position
          const cursorOffsetInNewRange = Math.floor(newRange * cursorRatio)
          const newStart = Math.max(0, cursorIndex - cursorOffsetInNewRange)
          const newEnd = Math.min(sourceAreaData.length - 1, newStart + newRange)
          return [newStart, newEnd]
        } else {
          const newRange = Math.min(Math.ceil(range / 0.7), sourceAreaData.length - 1)
          // Position new range so cursor stays at same relative position
          const cursorOffsetInNewRange = Math.floor(newRange * cursorRatio)
          const newStart = Math.max(0, cursorIndex - cursorOffsetInNewRange)
          const newEnd = Math.min(sourceAreaData.length - 1, newStart + newRange)
          return [newStart, newEnd]
        }
      })
    },
    [sourceAreaData.length, chartContainerWidth],
  )

  const panChart = useCallback(
    (direction: 'left' | 'right') => {
      setBrushIndices((prevIndices) => {
        if (sourceAreaData.length === 0 || !prevIndices) return prevIndices

        const [start, end] = prevIndices
        const range = end - start
        const shift = Math.floor(range * 0.2)

        if (direction === 'left') {
          const newStart = Math.max(0, start - shift)
          const newEnd = Math.min(sourceAreaData.length - 1, newStart + range)
          return [newStart, newEnd]
        } else {
          const newEnd = Math.min(sourceAreaData.length - 1, end + shift)
          const newStart = Math.max(0, newEnd - range)
          return [newStart, newEnd]
        }
      })
    },
    [sourceAreaData.length],
  )

  // Handle mouse wheel zoom and keyboard shortcuts
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Shift + Scroll: Zoom in/out
      if (e.shiftKey) {
        e.preventDefault()
        const chartContainer = document.querySelector('[class*="h-96"]') as HTMLElement
        if (chartContainer?.contains(e.target as Node)) {
          const rect = chartContainer.getBoundingClientRect()
          const cursorXRelative = (e.clientX - rect.left) * (chartContainerWidth / rect.width)
          zoomChart(e.deltaY > 0 ? 'out' : 'in', cursorXRelative)
        }
      }
      // Ctrl + Scroll: Pan left/right
      else if (e.ctrlKey) {
        e.preventDefault()
        const chartContainer = document.querySelector('[class*="h-96"]') as HTMLElement
        if (chartContainer?.contains(e.target as Node)) {
          panChart(e.deltaY > 0 ? 'left' : 'right')
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const chartContainer = document.querySelector('[class*="h-96"]') as HTMLElement
      if (chartContainer?.contains(e.target as Node)) {
        const rect = chartContainer.getBoundingClientRect()
        setMouseX(e.clientX - rect.left)
        setChartContainerWidth(rect.width)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys: Pan
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        panChart(e.key === 'ArrowLeft' ? 'left' : 'right')
      }
      // +/- or =/- keys: Zoom
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomChart('in', mouseX)
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomChart('out', mouseX)
      }
      // R key: Reset zoom
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setBrushIndices(null)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [zoomChart, panChart, mouseX, chartContainerWidth])

  const barChartData = useMemo(
    () =>
      topServices.map((s) => ({
        label: s.label,
        value: s.value,
      })),
    [topServices],
  )

  const AreaLegend = memo((props: { payload?: Array<{ color?: string; value: string }> }) => (
    <div className="flex flex-wrap justify-center gap-4 text-sm text-foreground">
      {props.payload?.map((entry, i: number) => (
        <div
          key={i}
          className="flex items-center gap-2"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  ))

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Reports" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between">
          <Heading
            title="Reports"
            description="Visual insights for management"
          />
          <div className="flex w-full items-center justify-center gap-2 md:w-fit lg:w-fit">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Revenue Card */}
          <div className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md sm:h-56 lg:h-64 dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Total Revenue</h4>
              <PhilippinePeso className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-green-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-green-300 dark:bg-green-900/20">
                  ₱{Number(totalRevenue).toLocaleString()}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Total Expenses Card */}
          <div className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md sm:h-56 lg:h-64 dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Total Expenses</h4>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-red-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-red-300 dark:bg-red-900/20">
                  ₱{Number(totalExpenses).toLocaleString()}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Total Profit Card */}
          <div className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md sm:h-56 lg:h-64 dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Net Profit</h4>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-blue-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-blue-300 dark:bg-blue-900/20">
                  ₱{Number(totalProfit).toLocaleString()}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Average Booking Value Card */}
          <div className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md sm:h-56 lg:h-64 dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Avg Booking Value</h4>
              <PhilippinePeso className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-purple-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-purple-300 dark:bg-purple-900/20">
                  ₱
                  {Number(averageBookingValue).toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Customer Retention Rate Card */}
          <div className="group relative flex h-48 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md sm:h-56 lg:h-64 dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Retention Rate</h4>
              <Repeat2 className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-orange-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-orange-300 dark:bg-orange-900/20">
                  {Number(retentionRate).toLocaleString('en-US', { maximumFractionDigits: 1 })}%
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-8 bg-background">
          {/* Financial Trend - Zoomable, Beautiful Brush */}
          <div className="w-full rounded-xl border border-sidebar-border/70 p-6">
            <HeadingSmall
              title="Financial Trend"
              description="Revenue, expenses, and profit over time • Drag to zoom • Use brush below"
            />

            {isLoading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-highlight" />
              </div>
            ) : sourceAreaData.length === 0 ? (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                <p className="text-lg">No financial data available</p>
              </div>
            ) : (
              <ChartContainer
                config={areaChartConfig}
                className="h-96 w-full"
              >
                <AreaChart
                  data={sourceAreaData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    {['revenue', 'expenses', 'profit'].map((key) => (
                      <linearGradient
                        key={key}
                        id={key}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={areaChartConfig[key].color}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={areaChartConfig[key].color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    ))}
                  </defs>

                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />

                  <Area
                    dataKey="revenue"
                    type="monotone"
                    stroke={areaChartConfig.revenue.color}
                    fill="url(#revenue)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1, fill: areaChartConfig.revenue.color }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="expenses"
                    type="monotone"
                    stroke={areaChartConfig.expenses.color}
                    fill="url(#expenses)"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 3, strokeWidth: 1, fill: areaChartConfig.expenses.color }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                  <Area
                    dataKey="profit"
                    type="monotone"
                    stroke={areaChartConfig.profit.color}
                    fill="url(#profit)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1, fill: areaChartConfig.profit.color }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />

                  <Brush
                    dataKey="date"
                    height={48}
                    stroke="var(--muted-foreground)"
                    fill="var(--background)"
                    travellerWidth={16}
                    gap={8}
                    startIndex={brushIndices?.[0]}
                    endIndex={brushIndices?.[1]}
                    onChange={(e: { startIndex?: number; endIndex?: number }) => {
                      if (e.startIndex !== undefined && e.endIndex !== undefined) {
                        setBrushIndices([e.startIndex, e.endIndex])
                      }
                    }}
                    onMouseUp={() => {
                      // Preserve zoom state
                    }}
                    style={{
                      transition: 'all 0.2s ease-out',
                    }}
                  >
                    <AreaChart margin={{ top: 8, bottom: 8 }}>
                      <Area
                        dataKey="revenue"
                        type="monotone"
                        stroke={areaChartConfig.revenue.color}
                        fillOpacity={0.25}
                        strokeWidth={1.5}
                      />
                      <Area
                        dataKey="expenses"
                        type="monotone"
                        stroke={areaChartConfig.expenses.color}
                        fillOpacity={0.25}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                      <Area
                        dataKey="profit"
                        type="monotone"
                        stroke={areaChartConfig.profit.color}
                        fillOpacity={0.25}
                        strokeWidth={1.5}
                      />
                    </AreaChart>
                  </Brush>

                  <Legend content={AreaLegend} />
                </AreaChart>
              </ChartContainer>
            )}
          </div>

          {/* Monthly Revenue by Year */}
          <div className="w-full rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <HeadingSmall
                  title="Monthly Revenue Trends"
                  description="Revenue trends by month"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Year:</span>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min={2000}
                  max={new Date().getFullYear()}
                  className="w-[120px]"
                  placeholder="Year"
                />
              </div>
            </div>

            {monthlyRevenueData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                <p className="text-lg">No revenue data for selected year</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ChartContainer
                  config={monthlyRevenueChartConfig}
                  className="h-80 w-full"
                >
                  <BarChart
                    data={monthlyRevenueData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <YAxis
                      domain={[0, (d: number) => Math.max(d * 1.3, d + 10000)]}
                      tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(v) => [`₱${(v as number).toLocaleString()}`]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar
                      dataKey="revenue"
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={false}
                    >
                      {monthlyRevenueData.map((entry, index) => {
                        const monthColors = [
                          'oklch(72% 0.26 30)', // Jan - warm red
                          'oklch(75% 0.28 55)', // Feb
                          'oklch(78% 0.22 85)', // Mar
                          'oklch(80% 0.25 130)', // Apr - spring green
                          'oklch(76% 0.24 170)', // May
                          'oklch(74% 0.27 200)', // Jun - cyan
                          'oklch(70% 0.29 240)', // Jul - blue
                          'oklch(68% 0.26 270)', // Aug - purple
                          'oklch(73% 0.25 300)', // Sep
                          'oklch(77% 0.23 330)', // Oct - magenta
                          'oklch(75% 0.24 10)', // Nov
                          'oklch(70% 0.28 330)', // Dec - festive
                        ]
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={monthColors[index % monthColors.length]}
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </div>

          {/* Service Distribution */}
          <div className="w-full rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
            <HeadingSmall
              title="Service Distribution"
              description="Most booked services with size"
            />

            {isLoading ? (
              <div className="flex h-80 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-highlight" />
              </div>
            ) : barChartData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-muted-foreground">
                <p className="text-lg">No booking data</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ChartContainer
                  config={barChartConfig}
                  className="h-80 w-full"
                >
                  <BarChart
                    data={barChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <YAxis
                      domain={[0, (d: number) => Math.max(d * 1.3, d + 15)]}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltipContent />}
                      formatter={(v) => [`${v} bookings`]}
                    />
                    <Bar
                      dataKey="value"
                      radius={[12, 12, 0, 0]}
                      isAnimationActive={false}
                    >
                      {barChartData.map((_, i) => {
                        const colors = [
                          'oklch(65% 0.25 280)',
                          'oklch(70% 0.22 200)',
                          'oklch(75% 0.20 150)',
                          'oklch(80% 0.25 90)',
                          'oklch(72% 0.28 50)',
                          'oklch(68% 0.24 320)',
                          'oklch(78% 0.18 240)',
                          'oklch(82% 0.22 20)',
                        ]
                        return (
                          <Cell
                            key={i}
                            fill={colors[i % colors.length]}
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ChartContainer>

                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4">
                  {barChartData.map((entry, i) => {
                    const colors = [
                      'oklch(65% 0.25 280)',
                      'oklch(70% 0.22 200)',
                      'oklch(75% 0.20 150)',
                      'oklch(80% 0.25 90)',
                      'oklch(72% 0.28 50)',
                      'oklch(68% 0.24 320)',
                      'oklch(78% 0.18 240)',
                      'oklch(82% 0.22 20)',
                    ]
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="h-4 w-10 rounded-full shadow-sm ring-1 ring-foreground/10"
                          style={{
                            backgroundColor: colors[i % colors.length],
                          }}
                        />
                        <span className="max-w-[220px] truncate text-sm font-medium text-foreground/90">
                          {entry.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
