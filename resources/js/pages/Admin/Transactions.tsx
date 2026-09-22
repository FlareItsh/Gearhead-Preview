import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CreditCard, Download, Eye, PhilippinePeso, Search } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/use-permissions'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Transactions',
    href: '/transactions',
  },
]

interface Transaction {
  payment_id: number
  date: string
  customer: string
  services: string
  amount: number
  payment_method: string
  gcash_reference: string | null
  gcash_screenshot: string | null
  status: string
  is_point_redeemed: boolean
  type: 'income'
  employee: string
}

interface SupplyPurchase {
  supply_purchase_id: number
  purchase_date: string
  purchase_reference: string
  supplier_name: string
  supplies: string
  total_amount: number
  status: string
  type: 'expense'
}

interface Stats {
  total_revenue: number
  total_expenses: number
  profit: number
  total_payments: number
  cash_transactions: number
  gcash_transactions: number
  total_expenses_count: number
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

interface TransactionsProps {
  // We can treat props as optional or as initial data if provided from server,
  // but we are fetching client-side mostly.
  transactions?: Transaction[]
  stats?: Stats
}

// Professional PHP currency formatter (₱2,000.00)
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const TransactionRow = memo(({ item }: { item: Transaction | SupplyPurchase }) => {
  const isTransaction = 'payment_id' in item
  const isIncome = isTransaction
  const amount = isTransaction ? item.amount : (item.total_amount ?? 0)

  const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'default'> =
    {
      completed: 'success',
      pending: 'warning',
      in_progress: 'info',
      cancelled: 'destructive',
    }

  const formatDate = (dateString: string) => dateString.split(' ')[0]

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')

  const renderSuppliesAsBullets = (suppliesString: string) => {
    const supplies = suppliesString
      .split(', ')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'N/A')

    if (supplies.length === 0) {
      return <span className="text-xs text-muted-foreground">No supplies</span>
    }

    return (
      <ul className="list-inside list-disc space-y-1 text-sm">
        {supplies.map((supply, index) => (
          <li
            key={index}
            className="text-muted-foreground"
          >
            {supply}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">
      <td className="p-4 text-sm text-foreground">
        {formatDate(isTransaction ? item.date : item.purchase_date)}
      </td>
      <td className="p-4 text-sm text-foreground">
        {isTransaction ? item.customer : item.supplier_name}
      </td>
      {isTransaction && (
        <td className="p-4 text-sm text-foreground">{(item as Transaction).employee}</td>
      )}
      <td className="max-w-xs p-4 text-sm">
        {isTransaction ? item.services : renderSuppliesAsBullets(item.supplies)}
      </td>
      <td
        className={`translate-x-2 p-4 text-right text-sm font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
      >
        {isIncome ? '+' : '-'}
        {formatMoney(amount)}
      </td>
      <td className="p-4">
        {isTransaction ? (
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {item.payment_method}
            </span>
            {item.gcash_reference && (
              <span className="text-xs text-muted-foreground">Ref: {item.gcash_reference}</span>
            )}
            {item.gcash_screenshot && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => window.open(`/${item.gcash_screenshot}`, '_blank')}
                      className="flex w-fit items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-3 w-3" />
                      <span>{item.gcash_screenshot.split('/').pop()}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-primary text-primary-foreground"
                  >
                    View GCash Receipt
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {item.purchase_reference && item.purchase_reference !== 'N/A' ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {item.purchase_reference}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">N/A</span>
            )}
          </div>
        )}
      </td>
      <td className="p-4 text-center">
        <Badge variant={statusVariants[item.status] || 'default'}>
          {formatStatus(item.status)}
        </Badge>
      </td>
    </tr>
  )
})

export default function Transactions({ transactions }: TransactionsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { hasPermission } = usePermissions()
  const [isLoading, setIsLoading] = useState(true)
  const [financialData, setFinancialData] = useState<Stats>({
    total_revenue: 0,
    total_expenses: 0,
    profit: 0,
    total_payments: 0,
    cash_transactions: 0,
    gcash_transactions: 0,
    total_expenses_count: 0,
  })
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [paymentsData, setPaymentsData] = useState<PaginatedResponse<Transaction> | null>(null)
  const [expensesData, setExpensesData] = useState<PaginatedResponse<SupplyPurchase> | null>(null)

  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments')
  const [perPage, setPerPage] = useState(10)

  // Format date range helper function
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

  // Set default date range: current month to date
  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const today = new Date(year, month, now.getDate())

    const format = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    setStartDate(format(firstDay))
    setEndDate(format(today))
  }, [])

  // Load Data
  // Load Data
  const loadData = async (url?: string) => {
    if (!startDate || !endDate) return

    setIsLoading(true)
    try {
      const params: any = {
        start_date: startDate,
        end_date: endDate,
        per_page: perPage,
        search: searchQuery,
      }

      let finalUrl = url
      const finalParams = { ...params }

      if (url) {
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) finalParams.page = page
        // Reset base URL based on tab to avoid appending params to an already full URL
        finalUrl =
          activeTab === 'payments' ? '/api/payments/list' : '/api/supply-purchases/detailed'
      } else {
        finalUrl =
          activeTab === 'payments' ? '/api/payments/list' : '/api/supply-purchases/detailed'
      }

      if (activeTab === 'payments') {
        const res = await axios.get(finalUrl!, { params: finalParams })
        setPaymentsData(res.data)
      } else {
        const res = await axios.get(finalUrl!, { params: finalParams })

        // Map expenses if needed
        const mappedExpenses = res.data.data.map((p: any) => ({
          supply_purchase_id: p.supply_purchase_id,
          purchase_date: p.purchase_date,
          purchase_reference: p.purchase_reference,
          supplier_name: p.supplier_name,
          supplies: p.supplies,
          total_amount: p.total_amount,
          status: p.status,
          type: 'expense',
        }))

        setExpensesData({
          ...res.data,
          data: mappedExpenses,
        })
      }
    } catch (err) {
      console.error('Failed to load transactions', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load Summary (Separate effect, only on date range)
  useEffect(() => {
    if (!startDate || !endDate) return

    axios
      .get('/api/payments/summary', {
        params: { start_date: startDate, end_date: endDate },
      })
      .then((res) => {
        setFinancialData({
          total_revenue: res.data.total_amount || 0,
          total_expenses: res.data.total_expenses || 0,
          profit: res.data.profit || 0,
          total_payments: res.data.total_payments || 0,
          cash_transactions: res.data.cash_transactions || 0,
          gcash_transactions: res.data.gcash_transactions || 0,
          total_expenses_count: res.data.total_expenses_count || 0,
        })
      })
      .catch((err) => console.error('Summary error', err))
  }, [startDate, endDate])

  // Reload list when tab/date/search/perPage changes
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 500)
    return () => clearTimeout(timer)
  }, [startDate, endDate, activeTab, searchQuery, perPage])

  const handlePageChange = (url: string) => {
    loadData(url)
  }

  // Handle Export (fetch all data for date range)
  const handleExport = async () => {
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        search: searchQuery,
      } // No per_page = All data

      let dataToExport: (Transaction | SupplyPurchase)[] = []

      if (activeTab === 'payments') {
        const res = await axios.get('/api/payments/list', { params })
        dataToExport = res.data
      } else {
        const res = await axios.get('/api/supply-purchases/detailed', { params })
        dataToExport = res.data.map((p: any) => ({
          supply_purchase_id: p.supply_purchase_id,
          purchase_date: p.purchase_date,
          purchase_reference: p.purchase_reference,
          supplier_name: p.supplier_name,
          supplies: p.supplies,
          total_amount: p.total_amount,
          status: p.status,
          type: 'expense',
        }))
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()

      const totalAmount = dataToExport.reduce(
        (sum, item) => sum + ('amount' in item ? item.amount : item.total_amount),
        0,
      )

      const title = activeTab === 'payments' ? 'PAYMENT HISTORY REPORT' : 'SUPPLY PURCHASES REPORT'

      // 1. Company Header
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 30, 30)
      doc.text('GEARHEAD CARWASH', pageWidth / 2, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Official ${title}`, pageWidth / 2, 26, { align: 'center' })

      // Horizontal Line
      doc.setDrawColor(245, 158, 11) // Brand Yellow
      doc.setLineWidth(1)
      doc.line(14, 30, pageWidth - 14, 30)

      // 2. Report Information
      doc.setFontSize(10)
      doc.setTextColor(50, 50, 50)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORT DETAILS', 14, 40)

      doc.setFont('helvetica', 'normal')
      doc.text(`Report Type:`, 14, 46)
      doc.setFont('helvetica', 'bold')
      doc.text(activeTab === 'payments' ? 'Sales Revenue' : 'Procurement Expenses', 45, 46)

      doc.setFont('helvetica', 'normal')
      doc.text(`Period Range:`, 14, 52)
      doc.setFont('helvetica', 'bold')
      doc.text(`${startDate} to ${endDate}`, 45, 52)

      // Right Side Info
      const rightSideX = pageWidth - 60
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated Date:`, rightSideX, 46)
      doc.text(new Date().toLocaleDateString('en-PH', { dateStyle: 'long' }), rightSideX + 30, 46)

      const tableData = dataToExport.map((item) => {
        const isTx = 'payment_id' in item
        const amount = isTx ? (item as Transaction).amount : (item as SupplyPurchase).total_amount
        return [
          isTx
            ? (item as Transaction).date.split(' ')[0]
            : (item as SupplyPurchase).purchase_date.split(' ')[0],
          isTx ? (item as Transaction).customer : (item as SupplyPurchase).supplier_name,
          isTx ? (item as Transaction).services : (item as SupplyPurchase).supplies,
          amount.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          isTx
            ? (item as Transaction).payment_method
            : (item as SupplyPurchase).purchase_reference || 'N/A',
          item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
        ]
      })

      autoTable(doc, {
        head: [
          [
            'Date',
            activeTab === 'payments' ? 'Customer' : 'Supplier',
            activeTab === 'payments' ? 'Services' : 'Supplies',
            'Amount',
            activeTab === 'payments' ? 'Payment Method' : 'Reference',
            'Status',
          ],
        ],
        body: tableData,
        startY: 60,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 30, 30],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      })

      // 4. Report Summary Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFillColor(255, 248, 230) // Very Light Yellow
      doc.rect(14, finalY, pageWidth - 28, 12, 'F')

      doc.setFontSize(12)
      doc.setTextColor(30, 30, 30)
      doc.setFont('helvetica', 'bold')
      doc.text(`TOTAL SUMMARY (${activeTab.toUpperCase()}):`, 18, finalY + 8)
      doc.setTextColor(245, 158, 11)
      doc.text(
        `PHP ${totalAmount.toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        pageWidth - 45,
        finalY + 8,
        { align: 'right' },
      )

      // 5. Signature Section
      const sigY = finalY + 35
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.setFont('helvetica', 'normal')

      // Prepared By
      doc.line(14, sigY, 70, sigY)
      doc.text('Prepared By / Date', 14, sigY + 5)

      // Approved By
      doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY)
      doc.text('Approved By / Date', pageWidth - 70, sigY + 5)

      // Page Numbers
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center',
        })
      }

      doc.save(
        `${activeTab === 'payments' ? 'payments' : 'expenses'}-report-${
          new Date().toISOString().split('T')[0]
        }.pdf`,
      )
    } catch (error) {
      console.error('Export failed', error)
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Transactions" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl bg-background p-4">
        {/* Header + Date Picker */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
            <p className="text-sm text-muted-foreground">Track financial records and payments</p>
          </div>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue / Expenses - Dynamic based on active tab */}
          <div className="group relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">
                {activeTab === 'payments' ? 'Total Revenue' : 'Total Expenses'}
              </h4>
              <PhilippinePeso className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-40 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-green-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-green-300 dark:bg-green-900/20">
                  {formatMoney(
                    activeTab === 'payments'
                      ? financialData.total_revenue
                      : financialData.total_expenses,
                  )}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Total Transactions - Dynamic based on active tab */}
          <div className="group relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Total Transactions</h4>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-28 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-yellow-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-yellow-200 dark:bg-yellow-900/20">
                  {activeTab === 'payments'
                    ? financialData.total_payments
                    : financialData.total_expenses_count}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* Cash Payments */}
          <div className="group relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Cash Payments</h4>
              <PhilippinePeso className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-28 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-blue-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-blue-200 dark:bg-blue-900/20">
                  {financialData.cash_transactions}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>

          {/* GCash Payments */}
          <div className="group relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 shadow-sm transition-all duration-200 hover:border-highlight/50 hover:shadow-md dark:border-sidebar-border dark:hover:border-highlight/50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">GCash Payments</h4>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-12 w-28 animate-pulse rounded-full bg-muted" />
              </div>
            ) : (
              <div className="text-center">
                <span className="inline-block rounded-full bg-purple-100 px-6 py-3 text-3xl font-bold text-foreground group-hover:bg-purple-300 dark:bg-purple-900/20">
                  {financialData.gcash_transactions}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{formatDateRange(startDate, endDate)}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="border border-sidebar-border/70 bg-background text-foreground">
          <CardContent className="p-0">
            {/* Header */}
            <div className="border-b border-border/50 p-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {activeTab === 'payments' ? 'Payment History' : 'Supply Purchases'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Total:{' '}
                      <span className="font-semibold">
                        {activeTab === 'payments'
                          ? paymentsData?.total || 0
                          : expensesData?.total || 0}
                      </span>{' '}
                      {activeTab === 'payments' ? 'payments' : 'purchases'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={activeTab === 'payments' ? 'highlight' : 'outline'}
                      onClick={() => setActiveTab('payments')}
                      className="gap-2"
                    >
                      Payments
                    </Button>
                    <Button
                      variant={activeTab === 'expenses' ? 'highlight' : 'outline'}
                      onClick={() => setActiveTab('expenses')}
                      className="gap-2"
                    >
                      Expenses
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 pl-9 sm:w-40"
                    />
                  </div>
                  {hasPermission('export_transactions_pdf') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleExport}
                            variant="secondary"
                            className="gap-2 whitespace-nowrap"
                          >
                            <Download className="h-4 w-4" />
                            Export PDF
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-primary text-primary-foreground">
                          Download transactions as PDF
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: Scrollable Table */}
            <div className="hidden lg:block">
              <div className="custom-scrollbar max-h-[65vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <TableRow className="border-b border-border/50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">
                        {activeTab === 'payments' ? 'Customer' : 'Supplier'}
                      </TableHead>
                      {activeTab === 'payments' && (
                        <TableHead className="font-semibold">Assigned Employee</TableHead>
                      )}
                      <TableHead className="font-semibold">
                        {activeTab === 'payments' ? 'Services' : 'Supplies'}
                      </TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">
                        {activeTab === 'payments' ? 'Payment Method' : 'Reference'}
                      </TableHead>
                      <TableHead className="text-center font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTab === 'payments' ? (
                      isLoading && !paymentsData ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-12 text-center"
                          >
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : (
                        paymentsData?.data.map((item) => (
                          <TransactionRow
                            key={'payment_id' in item ? item.payment_id : String(Math.random())}
                            item={item}
                          />
                        ))
                      )
                    ) : isLoading && !expensesData ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-12 text-center"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : (
                      expensesData?.data.map((item) => (
                        <TransactionRow
                          key={
                            'supply_purchase_id' in item
                              ? item.supply_purchase_id
                              : String(Math.random())
                          }
                          item={item}
                        />
                      ))
                    )}

                    {!isLoading &&
                      ((activeTab === 'payments' && paymentsData?.data.length === 0) ||
                        (activeTab === 'expenses' && expensesData?.data.length === 0)) && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="py-32 text-center"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Search className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No {activeTab === 'payments' ? 'payment' : 'expense'} records found
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile: Responsive Cards */}
            <div className="block space-y-4 p-4 lg:hidden">
              {activeTab === 'payments'
                ? paymentsData?.data.map((item) => {
                    const isTransaction = true
                    const isIncome = true
                    const amount = item.amount
                    const dateStr = item.date.split(' ')[0]
                    return (
                      <div
                        key={item.payment_id}
                        className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                      >
                        {/* ... Mobile card content ... */}
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{item.customer}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+{formatMoney(amount)}</p>
                          </div>
                        </div>
                        {/* Reduced mobile implementation for brevity, following desktop style */}
                        <div className="border-t border-border/40 pt-4 text-sm">
                          <p className="mb-2 text-muted-foreground">Services</p>
                          <p className="mb-3 text-foreground">{item.services}</p>
                        </div>
                        <div className="border-t border-border/40 pt-4 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-muted-foreground">Payment Method</p>
                              <p className="font-medium text-foreground">{item.payment_method}</p>
                            </div>
                            <Badge
                              variant={
                                item.status === 'completed'
                                  ? 'success'
                                  : item.status === 'pending'
                                    ? 'warning'
                                    : 'destructive'
                              }
                            >
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })
                : expensesData?.data.map((item) => {
                    const isTransaction = false
                    const isIncome = false
                    const amount = item.total_amount
                    const dateStr = item.purchase_date.split(' ')[0]
                    return (
                      <div
                        key={item.supply_purchase_id}
                        className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{item.supplier_name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">-{formatMoney(amount)}</p>
                          </div>
                        </div>
                        <div className="border-t border-border/40 pt-4 text-sm">
                          <p className="mb-2 text-muted-foreground">Supplies</p>
                          <p className="mb-3 text-foreground">{item.supplies}</p>
                        </div>
                      </div>
                    )
                  })}
            </div>

            {/* Pagination */}
            {activeTab === 'payments' && paymentsData && (
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
                  links={paymentsData.links}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
            {activeTab === 'expenses' && expensesData && (
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
                  links={expensesData.links}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
