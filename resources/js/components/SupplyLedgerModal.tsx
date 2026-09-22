import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { Calendar, FileDown, History, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface LedgerEntry {
  date: string
  type: 'Purchase' | 'Pullout'
  supplier_name: string | null
  employee_name: string | null
  qty_in: number
  qty_out: number
  reference_no: string | number
}

interface SupplyLedgerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplyId: number | null
  supplyName: string | null
}

export default function SupplyLedgerModal({
  open,
  onOpenChange,
  supplyId,
  supplyName,
}: SupplyLedgerModalProps) {
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [summary, setSummary] = useState({ current_stock: 0, forwarded_balance: 0 })
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Set default date range (First of month to Today)
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const formatLocal = (date: Date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    setStartDate(formatLocal(firstDay))
    setEndDate(formatLocal(now))
  }, [])

  useEffect(() => {
    if (open && supplyId) {
      loadLedger()
    }
  }, [open, supplyId, startDate, endDate])

  const loadLedger = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/supplies/${supplyId}/ledger`, {
        params: {
          start_date: startDate || null,
          end_date: endDate || null,
        },
      })
      setLedger(res.data.entries)
      setSummary({
        current_stock: res.data.current_stock,
        forwarded_balance: res.data.forwarded_balance,
      })
    } catch (err) {
      console.error('Failed to load ledger:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-scroll to bottom when data is loaded or modal opens
  useEffect(() => {
    if (open && !loading && ledger.length > 0) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    }
  }, [open, loading, ledger])

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    // Ensure the date string is treated as UTC if it doesn't have a timezone suffix
    const utcDateString = dateString.includes('Z') || dateString.includes('+')
      ? dateString
      : dateString.replace(' ', 'T') + 'Z'

    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(utcDateString))
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // 1. Company Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30) // Dark Slate
    doc.text('GEARHEAD CARWASH', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Official Inventory Transaction Report', pageWidth / 2, 26, { align: 'center' })

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
    doc.text(`Product Name:`, 14, 46)
    doc.setFont('helvetica', 'bold')
    doc.text(supplyName || 'N/A', 45, 46)

    doc.setFont('helvetica', 'normal')
    doc.text(`Period Range:`, 14, 52)
    doc.setFont('helvetica', 'bold')
    doc.text(`${startDate} to ${endDate}`, 45, 52)

    doc.setFont('helvetica', 'normal')
    doc.text(`Forwarded Balance:`, 14, 58)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(245, 158, 11)
    doc.text(`${summary.forwarded_balance} Units`, 45, 58)

    // Right Side Info
    const rightSideX = pageWidth - 60
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated Date:`, rightSideX, 46)
    doc.text(new Date().toLocaleDateString('en-PH', { dateStyle: 'long' }), rightSideX + 30, 46)
    doc.text(`Generated Time:`, rightSideX, 52)
    doc.text(new Date().toLocaleTimeString('en-PH'), rightSideX + 30, 52)

    // 3. Transactions Table
    const tableData = ledger.map(entry => [
      formatDate(entry.date),
      entry.type,
      entry.supplier_name || '-',
      entry.employee_name || '-',
      entry.qty_in > 0 ? `+${entry.qty_in}` : '-',
      entry.qty_out > 0 ? `-${entry.qty_out}` : '-',
      entry.reference_no || '-'
    ])

    autoTable(doc, {
      startY: 68,
      head: [['Date & Time', 'Type', 'Supplier', 'Employee', 'Qty In', 'Qty Out', 'Reference']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'right' },
      }
    })

    // 4. Report Summary Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFillColor(255, 248, 230) // Very Light Yellow
    doc.rect(14, finalY, pageWidth - 28, 12, 'F')

    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(`ENDING INVENTORY / TOTAL STOCKS:`, 18, finalY + 8)
    doc.setTextColor(245, 158, 11)
    doc.text(`${summary.current_stock} UNITS`, pageWidth - 45, finalY + 8, { align: 'right' })

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
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
    }

    doc.save(`GEARHEAD_LEDGER_${supplyName?.replace(/\s+/g, '_')}_${startDate}.pdf`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="flex max-h-[95vh] flex-col overflow-hidden bg-background p-0 sm:max-w-6xl border border-border shadow-2xl">
        {/* Header Section with Integrated Filters */}
        <div className="border-b bg-muted p-6 pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                <History className="h-7 w-7 text-yellow-500" />
                Supply <span className="text-yellow-500">Ledger</span>
              </DialogTitle>
              <DialogDescription className="text-sm font-medium">
                Inventory history for <span className="text-foreground font-bold">{supplyName}</span>
              </DialogDescription>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-background p-3 shadow-sm">
              <div className="space-y-1.5">
                <Label
                  htmlFor="startDate"
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Calendar className="h-3 w-3" /> From Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-[160px] border-border/60 bg-muted/20 text-xs focus:ring-yellow-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="endDate"
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Calendar className="h-3 w-3" /> To Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-[160px] border-border/60 bg-muted/20 text-xs focus:ring-yellow-500"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={loading || ledger.length === 0}
                className="h-9 border-yellow-500/50 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white dark:text-yellow-400 dark:hover:bg-yellow-500 dark:hover:text-background"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export Now
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 gap-4 border-b bg-background px-6 py-4">
          <div className="flex flex-col rounded-lg border border-border/50 bg-muted/20 p-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Forwarded Balance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {summary.forwarded_balance}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Units</span>
            </div>
          </div>
          <div className="flex flex-col rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
              Total Stocks Now
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                {summary.current_stock}
              </span>
              <span className="text-xs font-medium text-yellow-600/70 dark:text-yellow-400/70">
                Units
              </span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 flex flex-col px-6 pb-6 pt-0 min-h-0 overflow-hidden">
          <div
            ref={scrollRef}
            className="mt-4 flex-1 overflow-y-auto rounded-xl border border-border bg-card shadow-sm custom-scrollbar"
          >
            {loading ? (
              <div className="flex h-[400px] flex-col items-center justify-center gap-3">
                <div className="relative h-12 w-12 text-yellow-500">
                  <Loader2 className="h-12 w-12 animate-spin" />
                  <History className="absolute inset-0 m-auto h-5 w-5 opacity-50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Refreshing records...</p>
              </div>
            ) : ledger.length > 0 ? (
              <Table className="relative min-w-full border-separate border-spacing-0">
                <TableHeader className="sticky top-0 z-20">
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="sticky top-0 z-30 w-[200px] bg-muted/95 backdrop-blur-md font-bold text-foreground border-b">Date & Time</TableHead>
                    <TableHead className="sticky top-0 z-30 w-[120px] bg-muted/95 backdrop-blur-md font-bold text-foreground text-center border-b">Type</TableHead>
                    <TableHead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md font-bold text-foreground border-b">Supplier</TableHead>
                    <TableHead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md font-bold text-foreground border-b">Employee</TableHead>
                    <TableHead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-center font-bold text-foreground border-b">Qty In</TableHead>
                    <TableHead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-center font-bold text-foreground border-b">Qty Out</TableHead>
                    <TableHead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-md text-right font-bold text-foreground border-b">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry, index) => (
                    <TableRow
                      key={index}
                      className="group border-b border-border/30 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="py-4 font-medium">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge
                          className={`rounded-full border-none px-3 py-1 font-semibold ${
                            entry.type === 'Purchase'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : entry.type === 'Return'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">
                        {entry.supplier_name || ''}
                      </TableCell>
                      <TableCell className="py-4 text-muted-foreground">
                        {entry.employee_name || ''}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        {entry.qty_in > 0 ? (
                          <div className="inline-flex items-center gap-1 rounded-md bg-emerald-500/5 px-2 py-1 text-emerald-600 dark:text-emerald-400">
                            <span className="text-xs font-bold">+</span>
                            <span className="text-sm font-black">{entry.qty_in}</span>
                          </div>
                        ) : ''}
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        {entry.qty_out > 0 ? (
                          <div className="inline-flex items-center gap-1 rounded-md bg-rose-500/5 px-2 py-1 text-rose-600 dark:text-rose-400">
                            <span className="text-xs font-bold">-</span>
                            <span className="text-sm font-black">{entry.qty_out}</span>
                          </div>
                        ) : ''}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        {entry.type === 'Purchase' && entry.reference_no && (
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
                            {entry.reference_no}
                          </code>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-[400px] flex-col items-center justify-center space-y-3 p-12 text-center">
                <div className="rounded-full bg-muted p-6">
                  <History className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">No Records Found</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    No transactions match your current filters. Try adjusting your date range or selecting another item.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Gearhead Inventory Management System
          </p>
          <Badge
            variant="outline"
            className="border-border/60 text-[10px] font-normal"
          >
            {ledger.length} Record{ledger.length !== 1 ? 's' : ''} Listed
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
