import Heading from '@/components/heading'
import PulloutRequestModal from '@/components/PulloutRequestModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ChevronDownIcon, Download, Edit2, History, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import Pagination from '@/components/Pagination'
import SupplyLedgerModal from '@/components/SupplyLedgerModal'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Inventory', href: '/inventory' }]

interface Supply {
  supply_id: number
  supply_name: string
  unit: string
  purchase_unit?: string | null
  base_unit?: string | null
  conversion_factor?: number | string | null
  quantity_stock: number
  reorder_point: number
  supply_type: 'consumables' | 'supply'
}

interface Supplier {
  supplier_id: number
  first_name: string
  middle_name: string
  last_name: string
  phone_number: string
  email: string
}

interface PurchaseDetail {
  supply_id: number
  quantity: number
  conversion_factor?: number
  unit_price: number
  purchase_date: string
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

export default function InventoryPage() {
  const [suppliesData, setSuppliesData] = useState<PaginatedResponse<Supply> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const { hasPermission } = usePermissions()
  const [filter, setFilter] = useState<'All' | 'supply' | 'consumables'>('All')
  const [showAddItem, setShowAddItem] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {})
  const [newItem, setNewItem] = useState({
    supply_name: '',
    unit: '',
    purchase_unit: '',
    base_unit: '',
    conversion_factor: 1,
    reorder_point: 0,
    quantity_stock: 0,
    supply_type: 'supply' as const,
  })
  const [editItem, setEditItem] = useState<Supply | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [allSupplies, setAllSupplies] = useState<Supply[]>([])

  // Purchase states
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [purchaseReference, setPurchaseReference] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetail[]>([])
  const [newDetail, setNewDetail] = useState<Omit<PurchaseDetail, 'purchase_date'>>({
    supply_id: 0,
    quantity: 0,
    conversion_factor: 1,
    unit_price: 0,
  })

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [addItemErrors, setAddItemErrors] = useState<Record<string, string>>({})
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({})
  const [detailError, setDetailError] = useState('')

  // Supplier states
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    phone_number: '',
    email: '',
  })
  const [supplierErrors, setSupplierErrors] = useState<Record<string, string>>({})

  // Ledger state
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [selectedLedgerItem, setSelectedLedgerItem] = useState<{ id: number; name: string } | null>(
    null,
  )

  useEffect(() => {
    loadSupplies()
  }, [filter, perPage])

  useEffect(() => {
    loadSuppliers()
    loadAllSupplies()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSupplies()
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const loadSupplies = async (url?: string) => {
    try {
      const endpoint = url || '/api/supplies'
      const params: any = {
        per_page: perPage,
        search: searchValue,
        type: filter === 'All' ? null : filter,
      }

      // If passing a full URL (pagination link), we don't need to append params again if they are already there,
      // but usually Laravel pagination links include page param. We should merge our filters.
      // However, creating a new URL object is safer.

      let finalUrl = endpoint
      const finalParams = { ...params }

      if (url) {
        // If we have a URL, extract the page and use base endpoint with our current filters
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) finalParams.page = page
        finalUrl = '/api/supplies'
      }

      const res = await axios.get(finalUrl, { params: finalParams })
      setSuppliesData(res.data)
    } catch (err) {
      console.error('Failed to fetch supplies:', err)
    }
  }

  const loadSuppliers = async () => {
    try {
      const res = await axios.get('/api/suppliers')
      setAllSuppliers(res.data)
    } catch (err) {
      console.error('Failed to fetch suppliers:', err)
    }
  }

  const loadAllSupplies = async () => {
    try {
      const res = await axios.get('/api/supplies?all=1')
      setAllSupplies(res.data)
    } catch (err) {
      console.error('Failed to fetch all supplies:', err)
    }
  }
  const handleAddDetail = () => {
    if (newDetail.supply_id === 0 || newDetail.quantity === 0 || newDetail.unit_price === 0) {
      setDetailError('Please fill in all fields')
      return
    }
    setPurchaseDetails((prev) => [...prev, { ...newDetail, purchase_date: purchaseDate }])
    setDetailError('')
    setNewDetail({
      supply_id: 0,
      quantity: 0,
      conversion_factor: 1,
      unit_price: 0,
    })
  }

  const handleRemoveDetail = (index: number) => {
    setPurchaseDetails((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmitPurchase = async () => {
    const errors: Record<string, string> = {}

    if (!selectedSupplier) {
      errors.supplier = 'Please select a supplier'
    }
    if (purchaseDetails.length === 0) {
      errors.items = 'Please add at least one item'
    }

    setPurchaseErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      const purchaseRes = await axios.post('/api/supply-purchases', {
        supplier_id: parseInt(selectedSupplier),
        purchase_date: purchaseDate,
        purchase_reference: purchaseReference,
      })

      const purchaseId = purchaseRes.data.supply_purchase_id

      for (const detail of purchaseDetails) {
        const factor = detail.conversion_factor || 1
        const qtyBase = detail.quantity * factor

        await axios.post('/api/supply-purchase-details', {
          supply_purchase_id: purchaseId,
          supply_id: detail.supply_id,
          quantity: detail.quantity,
          conversion_factor: factor,
          quantity_base: qtyBase,
          unit_price: detail.unit_price,
          purchase_date: detail.purchase_date,
        })

        // Stock is tracked in purchase units; quantity_base is kept for base-unit reporting.
        await axios.post(`/api/supplies/${detail.supply_id}/increment-stock`, {
          quantity: detail.quantity,
        })
      }

      await loadSupplies()
      setShowPurchaseModal(false)
      setSelectedSupplier('')
      setPurchaseReference('')
      setPurchaseDetails([])
      setPurchaseErrors({})
      setNewDetail({
        supply_id: 0,
        quantity: 0,
        conversion_factor: 1,
        unit_price: 0,
      })
      setSuccessMessage('Purchase recorded successfully!')
      setShowSuccessModal(true)
      toast.success('Purchase recorded successfully!')
    } catch (err) {
      console.error('Failed to record purchase:', err)
      toast.error('Failed to record purchase')
      alert('Error recording purchase')
    }
  }

  const handleAddItem = () => {
    const errors: Record<string, string> = {}

    if (!newItem.supply_name.trim()) {
      errors.supply_name = 'Item name is required'
    }
    if (!newItem.unit.trim()) {
      errors.unit = 'Unit is required'
    }

    setAddItemErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    setConfirmMessage(`Add "${newItem.supply_name}" to inventory?`)
    setOnConfirmAction(() => async () => {
      try {
        await axios.post('/api/supplies', newItem)
        loadSupplies()
        setShowAddItem(false)
        setNewItem({
          supply_name: '',
          unit: '',
          purchase_unit: '',
          base_unit: '',
          conversion_factor: 1,
          reorder_point: 0,
          quantity_stock: 0,
          supply_type: 'supply',
        })
        setAddItemErrors({})
        toast.success('Item added successfully!')
        loadAllSupplies()
      } catch (err) {
        console.error(err)
        toast.error('Failed to add item')
      }
    })
    setConfirmOpen(true)
  }

  const handleCancelAddItem = () => {
    if (newItem.supply_name || newItem.unit || newItem.reorder_point > 0) {
      setConfirmMessage('Cancel? Your changes will be lost.')
      setOnConfirmAction(() => () => setShowAddItem(false))
      setConfirmOpen(true)
    } else {
      setShowAddItem(false)
    }
  }

  const handleConfirm = async () => {
    await onConfirmAction()
    setConfirmOpen(false)
  }

  const handleAddSupplier = async () => {
    const errors: Record<string, string> = {}

    if (!newSupplier.first_name.trim()) {
      errors.first_name = 'First name is required'
    }
    if (!newSupplier.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }
    if (!newSupplier.phone_number.trim()) {
      errors.phone_number = 'Phone number is required'
    }
    if (!newSupplier.email.trim()) {
      errors.email = 'Email is required'
    }

    setSupplierErrors(errors)
    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      const res = await axios.post('/api/suppliers', newSupplier)
      setAllSuppliers((prev) => [...prev, res.data])
      setShowAddSupplier(false)
      setNewSupplier({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone_number: '',
        email: '',
      })
      setSupplierErrors({})
      setSuccessMessage('Supplier added successfully!')
      setShowSuccessModal(true)
      toast.success('Supplier added successfully!')
      await loadSuppliers()
    } catch (err) {
      console.error('Failed to add supplier:', err)
      toast.error('Failed to add supplier')
      alert('Error adding supplier')
    }
  }

  const handleSaveEdit = async () => {
    if (!editItem) return
    try {
      await axios.put(`/supplies/${editItem.supply_id}`, editItem)
      loadSupplies()
      setShowEditModal(false)
      setEditItem(null)
      toast.success('Item updated successfully!')
      loadAllSupplies()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update item')
    }
  }
  const getStatusInfo = (supply: Supply) => {
    const qty = Number(supply.quantity_stock)
    const reorder = Number(supply.reorder_point)
    if (qty === 0) return { status: 'No Stock', variant: 'destructive' as const }
    if (qty <= reorder) return { status: 'Low Stock', variant: 'warning' as const }
    return { status: 'In Stock', variant: 'success' as const }
  }

  const openEditModal = (supply: Supply) => {
    setEditItem({ ...supply })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setTimeout(() => setEditItem(null), 300)
  }

  const openLedger = (supply: Supply) => {
    setSelectedLedgerItem({ id: supply.supply_id, name: supply.supply_name })
    setShowLedgerModal(true)
  }

  const downloadPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()

    // 1. Company Header
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30) // Dark Slate
    doc.text('GEARHEAD CARWASH', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Official Inventory Stock Report', pageWidth / 2, 26, { align: 'center' })

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
    doc.text(`Category Filter:`, 14, 46)
    doc.setFont('helvetica', 'bold')
    doc.text(filter === 'All' ? 'Full Inventory' : filter.toUpperCase(), 45, 46)

    doc.setFont('helvetica', 'normal')
    doc.text(`Total Items:`, 14, 52)
    doc.setFont('helvetica', 'bold')
    doc.text(`${suppliesData?.total || 0} Registered Items`, 45, 52)

    // Right Side Info
    const rightSideX = pageWidth - 60
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated Date:`, rightSideX, 46)
    doc.text(new Date().toLocaleDateString('en-PH', { dateStyle: 'long' }), rightSideX + 30, 46)

    const tableData = (suppliesData?.data || []).map((s) => [
      s.supply_name,
      s.unit,
      s.quantity_stock.toString(),
      s.reorder_point.toString(),
      s.supply_type.charAt(0).toUpperCase() + s.supply_type.slice(1),
    ])

    autoTable(doc, {
      head: [['Item Name', 'Unit', 'Stock Level', 'Reorder Level', 'Item Type']],
      body: tableData,
      startY: 60,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        2: { halign: 'center', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    })

    // 4. Report Summary Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFillColor(255, 248, 230) // Very Light Yellow
    doc.rect(14, finalY, pageWidth - 28, 12, 'F')

    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.text(`SUMMARY:`, 18, finalY + 8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Inventory scan complete. Total of ${suppliesData?.total || 0} items analyzed.`,
      45,
      finalY + 8,
    )

    // 5. Signature Section
    const sigY = finalY + 35
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.setFont('helvetica', 'normal')

    // Prepared By
    doc.line(14, sigY, 70, sigY)
    doc.text('Inventory Manager / Date', 14, sigY + 5)

    // Approved By
    doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY)
    doc.text('Operations Head / Date', pageWidth - 70, sigY + 5)

    // Page Numbers
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
        align: 'center',
      })
    }

    doc.save(`GEARHEAD_INVENTORY_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <Heading
            title="Inventory"
            description="Track supplies and materials"
          />
          <div className="flex gap-3">
            {hasPermission('export_inventory_pdf') && (
              <Button
                onClick={downloadPDF}
                variant="secondary"
              >
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            )}

            <Dialog
              open={showAddItem}
              onOpenChange={setShowAddItem}
            >
              {hasPermission('add_inventory_item') && (
                <DialogTrigger asChild>
                  <Button variant="highlight">+ Add Item</Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    Add <span className="text-yellow-400 dark:text-highlight">Item</span>
                  </DialogTitle>
                  <DialogDescription>Record a new inventory item.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium">Item Name</label>
                    <Input
                      placeholder="e.g., Engine Oil"
                      value={newItem.supply_name}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          supply_name: e.target.value,
                        })
                      }
                    />
                    {addItemErrors.supply_name && (
                      <p className="mt-1 text-sm text-red-500">{addItemErrors.supply_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Purchase Unit</label>
                    <Input
                      placeholder="e.g., Gallon, Bottle"
                      value={newItem.purchase_unit}
                      onChange={(e) => {
                        const val = e.target.value
                        setNewItem({
                          ...newItem,
                          purchase_unit: val,
                          unit: val,
                        })
                      }}
                    />
                    {addItemErrors.unit && (
                      <p className="mt-1 text-sm text-red-500">{addItemErrors.unit}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Base Unit (Stocking Unit)</label>
                    <Input
                      placeholder="e.g., Milliliter, Piece"
                      value={newItem.base_unit}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          base_unit: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Conversion Factor</label>
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="1"
                      value={newItem.conversion_factor}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          conversion_factor: parseFloat(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      How many Base Units are in one Purchase Unit?
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reorder Level</label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={newItem.reorder_point === 0 ? '' : newItem.reorder_point}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '' || parseInt(val) >= 0) {
                          setNewItem({
                            ...newItem,
                            reorder_point: val === '' ? 0 : parseInt(val),
                          })
                        }
                      }}
                      onKeyDown={(e) => ['-', 'e', 'E'].includes(e.key) && e.preventDefault()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={handleCancelAddItem}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="highlight"
                    onClick={handleAddItem}
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* PURCHASE MODAL */}
            <Dialog
              open={showPurchaseModal}
              onOpenChange={setShowPurchaseModal}
            >
              {hasPermission('add_inventory_purchase') && (
                <DialogTrigger asChild>
                  <Button variant="highlight">+ Add Purchase</Button>
                </DialogTrigger>
              )}
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>
                    Record <span className="text-yellow-400 dark:text-highlight">Purchase</span>
                  </DialogTitle>
                  <DialogDescription>Add supplies from a supplier</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">Supplier</label>
                      <Select
                        value={selectedSupplier}
                        onValueChange={setSelectedSupplier}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose supplier..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allSuppliers.map((s) => (
                            <SelectItem
                              key={s.supplier_id}
                              value={s.supplier_id.toString()}
                            >
                              {s.first_name} {s.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {purchaseErrors.supplier && (
                        <p className="mt-1 text-sm text-red-500">{purchaseErrors.supplier}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Reference (Optional)</label>
                      <Input
                        placeholder="INV-001, PO-2025-001..."
                        value={purchaseReference}
                        onChange={(e) => setPurchaseReference(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Purchase Date</label>
                      <Input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Add Items</label>
                    <div className="mt-3 rounded-lg border bg-muted/30 p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {/* SUPPLY - FULL WIDTH FIX */}
                        <div className="w-full">
                          <label className="text-xs font-medium">Supply</label>
                          <Select
                            value={
                              newDetail.supply_id === 0 ? undefined : newDetail.supply_id.toString()
                            }
                            onValueChange={(v) => {
                              const supply = allSupplies.find(
                                (item) => item.supply_id === parseInt(v),
                              )

                              setNewDetail({
                                ...newDetail,
                                supply_id: parseInt(v),
                                conversion_factor: Number(supply?.conversion_factor) || 1,
                              })
                            }}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Select supply..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allSupplies.map((s) => (
                                <SelectItem
                                  key={s.supply_id}
                                  value={s.supply_id.toString()}
                                >
                                  {s.supply_name} ({s.purchase_unit || s.unit} to{' '}
                                  {s.base_unit || s.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* QUANTITY */}
                        <div className="w-full">
                          <label className="text-xs font-medium">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            className="h-9"
                            value={newDetail.quantity === 0 ? '' : newDetail.quantity}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || parseFloat(val) >= 0) {
                                setNewDetail({
                                  ...newDetail,
                                  quantity: val === '' ? 0 : parseFloat(val),
                                })
                              }
                            }}
                            onKeyDown={(e) => ['-', 'e', 'E'].includes(e.key) && e.preventDefault()}
                          />
                        </div>

                        {/* UNIT PRICE */}
                        <div className="w-full">
                          <label className="text-xs font-medium">Unit Price</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="h-9"
                            value={newDetail.unit_price === 0 ? '' : newDetail.unit_price}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === '' || parseFloat(val) >= 0) {
                                setNewDetail({
                                  ...newDetail,
                                  unit_price: val === '' ? 0 : parseFloat(val),
                                })
                              }
                            }}
                            onKeyDown={(e) => ['-', 'e', 'E'].includes(e.key) && e.preventDefault()}
                          />
                        </div>
                      </div>

                      <Button
                        className="mt-4 w-full"
                        variant="highlight"
                        onClick={handleAddDetail}
                      >
                        Add to List
                      </Button>
                    </div>
                    {detailError && <p className="mt-2 text-sm text-red-500">{detailError}</p>}

                    {purchaseDetails.length > 0 && (
                      <div className="mt-4 max-h-64 overflow-y-auto rounded border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left">Item</th>
                              <th className="px-3 py-2 text-center">Qty</th>
                              <th className="px-3 py-2 text-center">Price</th>
                              <th className="px-3 py-2 text-center">Total</th>
                              <th className="px-3 py-2 text-center"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseDetails.map((d, i) => {
                              const supply = allSupplies.find((s) => s.supply_id === d.supply_id)
                              const total = d.quantity * d.unit_price
                              return (
                                <tr
                                  key={i}
                                  className="border-t"
                                >
                                  <td className="px-3 py-2">{supply?.supply_name || '—'}</td>
                                  <td className="px-3 py-2 text-center">{d.quantity}</td>
                                  <td className="px-3 py-2 text-right">
                                    ₱{d.unit_price.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    ₱{total.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => handleRemoveDetail(i)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {purchaseDetails.length > 0 && (
                      <div className="mt-4 border-t pt-3 text-right">
                        <div className="text-lg font-bold">
                          Total: ₱
                          {purchaseDetails
                            .reduce((sum, d) => sum + d.quantity * d.unit_price, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                  {purchaseErrors.items && (
                    <p className="text-sm text-red-500">{purchaseErrors.items}</p>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPurchaseModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="highlight"
                    onClick={handleSubmitPurchase}
                  >
                    Record Purchase
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* PULLOUT REQUEST MODAL */}
            {hasPermission('pullout_inventory_request') && (
              <PulloutRequestModal
                supplies={allSupplies}
                onSuccess={loadSupplies}
              />
            )}

            {/* ADD SUPPLIER MODAL */}
            <Dialog
              open={showAddSupplier}
              onOpenChange={setShowAddSupplier}
            >
              {hasPermission('add_inventory_supplier') && (
                <DialogTrigger asChild>
                  <Button variant="highlight">+ Add Supplier</Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    Add <span className="text-yellow-400 dark:text-highlight">Supplier</span>
                  </DialogTitle>
                  <DialogDescription>Add a new supplier to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        placeholder="John"
                        value={newSupplier.first_name}
                        onChange={(e) =>
                          setNewSupplier({
                            ...newSupplier,
                            first_name: e.target.value,
                          })
                        }
                      />
                      {supplierErrors.first_name && (
                        <p className="mt-1 text-sm text-red-500">{supplierErrors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Middle Name (Optional)</label>
                      <Input
                        placeholder="M."
                        value={newSupplier.middle_name}
                        onChange={(e) =>
                          setNewSupplier({
                            ...newSupplier,
                            middle_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      placeholder="Doe"
                      value={newSupplier.last_name}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          last_name: e.target.value,
                        })
                      }
                    />
                    {supplierErrors.last_name && (
                      <p className="mt-1 text-sm text-red-500">{supplierErrors.last_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                      placeholder="09123456789"
                      value={newSupplier.phone_number}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          phone_number: e.target.value,
                        })
                      }
                    />
                    {supplierErrors.phone_number && (
                      <p className="mt-1 text-sm text-red-500">{supplierErrors.phone_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="supplier@example.com"
                      value={newSupplier.email}
                      onChange={(e) =>
                        setNewSupplier({
                          ...newSupplier,
                          email: e.target.value,
                        })
                      }
                    />
                    {supplierErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{supplierErrors.email}</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowAddSupplier(false)
                      setNewSupplier({
                        first_name: '',
                        middle_name: '',
                        last_name: '',
                        phone_number: '',
                        email: '',
                      })
                      setSupplierErrors({})
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="highlight"
                    onClick={handleAddSupplier}
                  >
                    Add Supplier
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search & Filter */}
        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="flex flex-col gap-4 pt-5 pb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="dark:bg-background-dark dark:text-foreground-dark dark:border-border-dark flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20"
                  >
                    {filter === 'All' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="dark:bg-background-dark dark:border-border-dark rounded-md border border-border bg-background shadow-md"
                >
                  {[
                    { label: 'All Items', value: 'All' },
                    { label: 'Supply', value: 'supply' },
                    { label: 'Consumables', value: 'consumables' },
                  ].map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setFilter(option.value as 'All' | 'supply' | 'consumables')}
                      className="dark:text-foreground-dark rounded-md text-foreground hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20"
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search supplies..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply List Table */}
        <Card className="bg-background text-foreground">
          <CardContent className="p-0">
            <div className="border-b px-6 pt-5 pb-6">
              <h2 className="text-lg font-semibold">Supply List</h2>
              <p className="text-sm text-muted-foreground">
                {suppliesData?.total || 0} item
                {suppliesData?.total !== 1 && 's'}
              </p>
            </div>

            {(suppliesData?.data || []).length === 0 ? (
              <div className="py-24 text-center text-muted-foreground">No supplies found.</div>
            ) : (
              <>
                {/* Desktop: Scrollable Table */}
                <div className="hidden lg:block">
                  <div className="custom-scrollbar max-h-[65vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-center">Reorder</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(suppliesData?.data || []).map((supply) => {
                          const { status, variant } = getStatusInfo(supply)
                          return (
                            <TableRow key={supply.supply_id}>
                              <TableCell className="font-medium">{supply.supply_name}</TableCell>
                              <TableCell className="text-center font-bold">
                                {supply.quantity_stock}
                              </TableCell>
                              <TableCell>{supply.unit}</TableCell>
                              <TableCell className="text-center">{supply.reorder_point}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={variant}>{status}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {hasPermission('edit_inventory_item') && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(supply)}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-primary text-primary-foreground">
                                          Edit Item
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openLedger(supply)}
                                          className="text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                                        >
                                          <History className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-primary text-primary-foreground">
                                        View Item Ledger
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile: Responsive Cards */}
                <div className="block space-y-4 p-4 lg:hidden">
                  {(suppliesData?.data || []).map((supply) => {
                    const { status, variant } = getStatusInfo(supply)
                    return (
                      <div
                        key={supply.supply_id}
                        className="rounded-xl border border-border/60 p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{supply.supply_name}</h3>
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Stock:</span>
                                <span className="font-bold text-foreground">
                                  {supply.quantity_stock}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Unit:</span>
                                <span className="text-foreground">{supply.unit}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reorder:</span>
                                <span className="text-foreground">{supply.reorder_point}</span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span>Status:</span>
                                <Badge variant={variant}>{status}</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            {hasPermission('view_inventory_ledger') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-highlight hover:text-black"
                                      onClick={() => openLedger(supply)}
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-primary text-primary-foreground">
                                    View Item History
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {hasPermission('edit_inventory_item') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-highlight hover:text-black"
                                      onClick={() => openEditModal(supply)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-primary text-primary-foreground">
                                    Edit Item
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {hasPermission('delete_inventory_item') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 hover:border-red-500 hover:bg-red-500 hover:text-white"
                                      onClick={() => {
                                        setConfirmMessage(
                                          `Are you sure you want to delete "${supply.supply_name}"?`,
                                        )
                                        setOnConfirmAction(() => async () => {
                                          try {
                                            await axios.delete(`/api/supplies/${supply.supply_id}`)
                                            loadSupplies()
                                            toast.success('Item deleted successfully!')
                                            loadAllSupplies()
                                          } catch (err) {
                                            console.error(err)
                                            toast.error('Failed to delete item')
                                          }
                                        })
                                        setConfirmOpen(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-destructive text-destructive-foreground">
                                    Delete Item
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* PAGINATION */}
        {suppliesData && (
          <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => setPerPage(Number(v))}
              >
                <SelectTrigger className="h-8 w-[70px] border border-border bg-background text-foreground shadow-sm hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20">
                  <SelectValue placeholder={perPage} />
                </SelectTrigger>

                <SelectContent className="border border-border bg-background text-foreground shadow-md">
                  {[5, 10, 25, 50, 100].map((pageSize) => (
                    <SelectItem
                      key={pageSize}
                      value={pageSize.toString()}
                      className="text-foreground hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20"
                    >
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Pagination
              links={suppliesData.links}
              onPageChange={loadSupplies}
            />
          </div>
        )}

        {/* EDIT MODAL */}
        <Dialog
          open={showEditModal}
          onOpenChange={closeEditModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Item Name</label>
                  <Input
                    value={editItem.supply_name}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        supply_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Purchase Unit</label>
                  <Input
                    value={editItem.purchase_unit || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setEditItem({
                        ...editItem,
                        purchase_unit: val,
                        unit: val,
                      })
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Base Unit (Stocking Unit)</label>
                  <Input
                    value={editItem.base_unit || ''}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        base_unit: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Conversion Factor</label>
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    value={editItem.conversion_factor || 1}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        conversion_factor: parseFloat(e.target.value) || 1,
                      })
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    How many Base Units are in one Purchase Unit?
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Stock</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editItem.quantity_stock}
                    disabled
                    className="bg-muted text-muted-foreground opacity-70"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reorder Level</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editItem.reorder_point}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || parseInt(val) >= 0) {
                        setEditItem({
                          ...editItem,
                          reorder_point: val === '' ? 0 : parseInt(val),
                        })
                      }
                    }}
                    onKeyDown={(e) => ['-', 'e', 'E'].includes(e.key) && e.preventDefault()}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={closeEditModal}
              >
                Cancel
              </Button>
              <Button
                variant="highlight"
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation & Success Modals */}
        <Dialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm</DialogTitle>
            </DialogHeader>
            <p className="py-4 text-center">{confirmMessage}</p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
              >
                No
              </Button>
              <Button
                variant="highlight"
                onClick={handleConfirm}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">Success</DialogTitle>
            </DialogHeader>
            <p className="py-4 text-center">{successMessage}</p>
            <DialogFooter>
              <Button
                variant="highlight"
                onClick={() => setShowSuccessModal(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* LEDGER MODAL */}
        <SupplyLedgerModal
          open={showLedgerModal}
          onOpenChange={setShowLedgerModal}
          supplyId={selectedLedgerItem?.id || null}
          supplyName={selectedLedgerItem?.name || null}
        />
      </div>
    </AppLayout>
  )
}
