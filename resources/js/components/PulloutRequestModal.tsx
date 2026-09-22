import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import axios from 'axios'
import { Package, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface Supply {
  supply_id: number
  supply_name: string
  unit: string
  quantity_stock: number
  supply_type: 'consumables' | 'supply'
}

interface ServiceOrder {
  service_order_detail_id: number
  service_order_id: number
  service_name: string
  employee_name: string // The backend returns "First Last"
  employee_id: number
  order_date: string
  bay_number?: string
  customer_name?: string
  size: string
}

interface PulloutDetail {
  supply_id: number
  quantity: number
}

interface PulloutRequestModalProps {
  supplies: Supply[]
  onSuccess?: () => void
}

export default function PulloutRequestModal({ supplies, onSuccess }: PulloutRequestModalProps) {
  const [open, setOpen] = useState(false)
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [selectedServiceOrder, setSelectedServiceOrder] = useState('')
  const [pulloutDetails, setPulloutDetails] = useState<PulloutDetail[]>([])
  const [newDetail, setNewDetail] = useState<PulloutDetail>({
    supply_id: 0,
    quantity: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [supplySearch, setSupplySearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLDivElement>(null)

  // Derived state for the selected order details
  const activeOrder = serviceOrders.find(
    (so) => so.service_order_detail_id.toString() === selectedServiceOrder,
  )

  useEffect(() => {
    if (open) {
      loadServiceOrders()
    } else {
      // Reset state on close
      setSelectedServiceOrder('')
      setPulloutDetails([])
      setNewDetail({ supply_id: 0, quantity: 0 })
      setErrors({})
      setSupplySearch('')
    }
  }, [open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadServiceOrders = async () => {
    try {
      const response = await axios.get('/api/pullout-requests')
      // Ensure we map and filter if necessary, though backend should handle filtering
      setServiceOrders(response.data.activeServiceOrders || [])
    } catch (error) {
      console.error('Failed to load service orders:', error)
      toast.error('Failed to load active service orders.')
    }
  }

  const handleAddDetail = () => {
    const validationErrors: Record<string, string> = {}

    if (!newDetail.supply_id) {
      validationErrors.supply = 'Please select a supply'
    }
    if (newDetail.quantity <= 0) {
      validationErrors.quantity = 'Quantity must be greater than 0'
    }

    const selectedSupply = supplies.find((s) => s.supply_id === newDetail.supply_id)
    if (selectedSupply && newDetail.quantity > selectedSupply.quantity_stock) {
      validationErrors.quantity = `Only ${selectedSupply.quantity_stock} ${selectedSupply.unit} available`
    }

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setPulloutDetails([...pulloutDetails, { ...newDetail }])
    setNewDetail({ supply_id: 0, quantity: 0 })
    setSupplySearch('')
    setErrors({})
    toast.success('Item added to request list')
  }

  const handleRemoveDetail = (index: number) => {
    setPulloutDetails(pulloutDetails.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const validationErrors: Record<string, string> = {}

    if (!selectedServiceOrder) {
      validationErrors.serviceOrder = 'Please select a service order'
    }
    if (pulloutDetails.length === 0) {
      validationErrors.details = 'Please add at least one supply'
    }

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      const selectedOrder = serviceOrders.find(
        (so) => so.service_order_detail_id.toString() === selectedServiceOrder,
      )

      if (!selectedOrder) {
        throw new Error('Service order not found')
      }

      await axios.post('/api/pullout-requests', {
        employee_id: selectedOrder.employee_id,
        service_order_detail_id: selectedOrder.service_order_detail_id,
        supplies: pulloutDetails,
      })

      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
      toast.success('Pullout request submitted successfully!')
    } catch (error) {
      console.error('Failed to create pullout request:', error)
      const err = error as { response?: { data?: { message?: string } } }
      setErrors({
        submit: err.response?.data?.message || 'Failed to create pullout request',
      })
      toast.error('Failed to submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant="highlight"
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Pullout Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Create <span className="black:text-highlight text-yellow-400">Pullout Request</span>
          </DialogTitle>
          <DialogDescription>Request supplies/materials for an active service.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* SECTION 1: Service Selection */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Active Service</Label>
              <Select
                value={selectedServiceOrder}
                onValueChange={setSelectedServiceOrder}
              >
                <SelectTrigger className="h-14 w-full border border-border bg-background text-base text-foreground">
                  <SelectValue placeholder="Choose a service order..." />
                </SelectTrigger>
                <SelectContent className="border border-border bg-background text-foreground">
                  {serviceOrders.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No active services found.
                    </div>
                  ) : (
                    serviceOrders.map((so) => (
                      <SelectItem
                        key={so.service_order_detail_id}
                        value={so.service_order_detail_id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <span className="black:text-highlight font-semibold text-yellow-400">
                            {so.bay_number ? `Bay ${so.bay_number}` : 'Bay ?'}
                          </span>
                          <span className="text-muted-foreground">|</span>
                          <span className="font-medium">{so.employee_name}</span>
                          <span className="text-muted-foreground">|</span>
                          <span>
                            {so.service_name} ({so.size})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.serviceOrder && (
                <p className="text-sm font-medium text-destructive">{errors.serviceOrder}</p>
              )}
            </div>

            {/* Employee / Service Info Card */}
            {activeOrder && (
              <Card className="border-highlight/50 bg-highlight/5 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-xl font-bold text-white">
                    {activeOrder.employee_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Assigned Technician
                    </p>
                    <p className="text-lg font-bold text-foreground">{activeOrder.employee_name}</p>
                  </div>
                  <div className="mx-2 hidden h-8 w-px bg-border sm:block"></div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Customer
                    </p>
                    <p className="text-sm font-medium">{activeOrder.customer_name}</p>
                  </div>
                  <div className="mx-2 hidden h-8 w-px bg-border sm:block"></div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Service Size
                    </p>
                    <p className="black:text-highlight text-sm font-medium text-yellow-400">
                      {activeOrder.size}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="my-2 h-px bg-border/50" />

          {/* SECTION 2: Supplies */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Requested Supplies</Label>

            <div className="rounded-xl border border-border bg-background p-5 shadow-sm">
              <div className="flex flex-col gap-4">
                {/* Supply Search - Full Width */}
                <div
                  ref={inputRef}
                  className="relative w-full"
                >
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Item Name</Label>
                  <div className="relative">
                    <Package className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search supply..."
                      className="h-10 w-full pl-9"
                      value={supplySearch}
                      onChange={(e) => {
                        setSupplySearch(e.target.value)
                        setShowSuggestions(true)
                        setNewDetail((prev) => ({ ...prev, supply_id: 0 }))
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      disabled={!selectedServiceOrder}
                    />
                  </div>
                  {/* Suggestions Dropdown */}
                  {showSuggestions && supplySearch && (
                    <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-background text-foreground shadow-md">
                      {supplies
                        .filter(
                          (s) =>
                            s.quantity_stock > 0 &&
                            s.supply_name.toLowerCase().includes(supplySearch.toLowerCase()),
                        )
                        .map((supply) => (
                          <Button
                            key={supply.supply_id}
                            variant="ghost"
                            className="h-auto w-full justify-start rounded-none px-3 py-2 font-normal"
                            onClick={() => {
                              setNewDetail((prev) => ({ ...prev, supply_id: supply.supply_id }))
                              setSupplySearch(supply.supply_name)
                              setShowSuggestions(false)
                            }}
                          >
                            <div className="flex w-full justify-between">
                              <span>{supply.supply_name}</span>
                              <Badge
                                variant="outline"
                                className="text-xs font-normal"
                              >
                                {supply.quantity_stock} {supply.unit} left
                              </Badge>
                            </div>
                          </Button>
                        ))}
                      {supplies.filter(
                        (s) =>
                          s.quantity_stock > 0 &&
                          s.supply_name.toLowerCase().includes(supplySearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No items found.
                        </div>
                      )}
                    </div>
                  )}
                  {errors.supply && (
                    <p className="mt-1 text-xs text-destructive">{errors.supply}</p>
                  )}
                </div>

                <div className="grid grid-cols-[1fr,auto] items-end gap-4">
                  {/* Quantity Input */}
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      className="h-10 w-full"
                      placeholder="Qty"
                      value={newDetail.quantity || ''}
                      onChange={(e) =>
                        setNewDetail((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      disabled={!selectedServiceOrder}
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Add Button */}
                  <Button
                    onClick={handleAddDetail}
                    variant="secondary"
                    className="h-10 px-8"
                    disabled={!selectedServiceOrder}
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
            {/* List of Added Supplies */}
            {pulloutDetails.length > 0 ? (
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted dark:bg-muted/50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pulloutDetails.map((detail, i) => {
                      const supply = supplies.find((s) => s.supply_id === detail.supply_id)
                      return (
                        <tr
                          key={i}
                          className="hover:bg-muted/30 dark:hover:bg-muted/10"
                        >
                          <td className="px-4 py-3 font-medium">{supply?.supply_name}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="secondary"
                              className="font-mono"
                            >
                              {detail.quantity} {supply?.unit}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveDetail(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground dark:bg-muted/10">
                <Package className="mb-2 h-8 w-8 opacity-20" />
                <p>No items added yet.</p>
                <p className="text-xs">Search and add supplies above.</p>
              </div>
            )}
            {errors.details && (
              <p className="text-center text-sm font-medium text-destructive">{errors.details}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="highlight"
            onClick={handleSubmit}
            disabled={loading || pulloutDetails.length === 0}
            className="min-w-[140px]"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
