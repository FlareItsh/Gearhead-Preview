import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissions } from '@/hooks/use-permissions'
import axios from 'axios'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SupplyOption {
  supply_id: number
  supply_name: string
  unit: string
  base_unit?: string | null
}

interface RetailRow {
  supply_id: number | null
  quantity_needed: string
}

interface ExistingRetail {
  supply_id: number
  quantity_needed: number | string
}

interface ServiceRetailDrawerProps {
  variantId: number
  variantSize: string
  open: boolean
  onClose: () => void
}

export default function ServiceRetailDrawer({
  variantId,
  variantSize,
  open,
  onClose,
}: ServiceRetailDrawerProps) {
  const { hasPermission } = usePermissions()
  const [supplies, setSupplies] = useState<SupplyOption[]>([])
  const [retailRows, setRetailRows] = useState<RetailRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    void fetchSupplies()
    void fetchExistingRetails()
  }, [open, variantId])

  const fetchSupplies = async () => {
    try {
      const { data } = await axios.get<SupplyOption[]>('/api/supplies?all=1')
      setSupplies(data)
    } catch (error) {
      console.error('Failed to load supplies', error)
      toast.error('Failed to load supplies')
    }
  }

  const fetchExistingRetails = async () => {
    setLoadingRows(true)

    try {
      const { data } = await axios.get<ExistingRetail[]>(
        `/api/services/variants/${variantId}/retails`,
      )
      setRetailRows(
        data.map((retail) => ({
          supply_id: retail.supply_id,
          quantity_needed: retail.quantity_needed.toString(),
        })),
      )
    } catch (error) {
      console.error('Failed to load existing retails', error)
      toast.error('Failed to load service retails')
    } finally {
      setLoadingRows(false)
    }
  }

  const addRow = () => {
    setRetailRows((rows) => [...rows, { supply_id: null, quantity_needed: '' }])
  }

  const updateRow = (index: number, field: keyof RetailRow, value: RetailRow[keyof RetailRow]) => {
    setRetailRows((rows) =>
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    )
  }

  const removeRow = (index: number) => {
    setRetailRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))
  }

  const getBaseUnit = (supplyId: number | null): string => {
    const supply = supplies.find((item) => item.supply_id === supplyId)

    return supply?.base_unit || supply?.unit || 'units'
  }

  const handleSubmit = async () => {
    if (!hasPermission('edit_service')) {
      toast.error('Insufficient permissions')
      return
    }

    const selectedSupplyIds = new Set<number>()

    for (const row of retailRows) {
      if (!row.supply_id || Number(row.quantity_needed) <= 0) {
        toast.error('All rows must have a supply and a positive quantity')
        return
      }

      if (selectedSupplyIds.has(row.supply_id)) {
        toast.error('Each supply can only be added once')
        return
      }

      selectedSupplyIds.add(row.supply_id)
    }

    setLoading(true)

    try {
      await axios.post(`/api/services/variants/${variantId}/retails`, {
        retails: retailRows.map((row) => ({
          supply_id: row.supply_id,
          quantity_needed: parseFloat(row.quantity_needed),
        })),
      })
      toast.success('Service retails saved')
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save service retails')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent className="w-full max-w-2xl rounded-lg border border-white/20 bg-background/85 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Configure Retails for {variantSize}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingRows ? (
            <div className="rounded-md border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Loading recipe...
            </div>
          ) : (
            retailRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_140px_88px_44px]"
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium">Supply</label>
                  <Select
                    value={row.supply_id?.toString() ?? ''}
                    onValueChange={(value) => updateRow(index, 'supply_id', Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supply" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplies.map((supply) => (
                        <SelectItem
                          key={supply.supply_id}
                          value={supply.supply_id.toString()}
                        >
                          {supply.supply_name} ({supply.base_unit || supply.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={row.quantity_needed}
                    onChange={(event) => updateRow(index, 'quantity_needed', event.target.value)}
                  />
                </div>

                <div className="pb-2 text-xs font-medium text-muted-foreground">
                  {getBaseUnit(row.supply_id)}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeRow(index)}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}

          <Button
            variant="outline"
            onClick={addRow}
            type="button"
          >
            Add Supply
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="highlight"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Retails'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
