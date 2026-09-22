import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, PackageOpen } from 'lucide-react'

interface Supply {
  supply_id: number
  supply_name: string
  quantity_stock: string | number
  unit: string
  reorder_point: number | null
}

interface LowStockTableProps {
  supplies: Supply[]
}

export function LowStockTable({ supplies }: LowStockTableProps) {
  if (supplies.length === 0) {
    return (
      <div className="py-12 text-center">
        <PackageOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-lg font-medium text-muted-foreground">Stock levels are healthy</p>
        <p className="text-sm text-muted-foreground">No items are currently running low.</p>
      </div>
    )
  }

  const getStatusInfo = (qty: number | string, reorder: number | null) => {
    const quantity = Number(qty)
    const reorderPoint = Number(reorder)
    if (quantity === 0) return { status: 'No Stock', variant: 'destructive' as const }
    if (quantity <= reorderPoint) return { status: 'Low Stock', variant: 'warning' as const }
    return { status: 'In Stock', variant: 'success' as const }
  }

  return (
    <div className="custom-scrollbar overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-center">Stock Level</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {supplies.map((item) => {
            const { status, variant } = getStatusInfo(item.quantity_stock, item.reorder_point)
            return (
              <TableRow key={item.supply_id}>
                <TableCell className="font-medium">{item.supply_name}</TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-foreground">{Number(item.quantity_stock)}</span>{' '}
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={variant}
                    className="items-center gap-1 shadow-sm"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {status}
                  </Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
