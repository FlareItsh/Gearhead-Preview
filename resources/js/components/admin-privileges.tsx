import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const PRIVILEGES = [
  {
    id: 'view_dashboard',
    label: 'View Dashboard',
    children: [{ id: 'add_queue', label: 'Add Queue' }],
  },
  {
    id: 'view_registry',
    label: 'View Registry',
    children: [
      { id: 'start_service', label: 'Start Service' },
      { id: 'view_queue', label: 'View Queue' },
    ],
  },
  { id: 'view_bookings', label: 'View Bookings' },
  {
    id: 'view_bays',
    label: 'View Bays',
    children: [
      { id: 'edit_bay', label: 'Edit Bay' },
      { id: 'delete_bay', label: 'Delete Bay' },
      { id: 'add_bay', label: 'Add Bay' },
    ],
  },
  {
    id: 'view_services',
    label: 'View Services',
    children: [
      { id: 'add_service', label: 'Add Service' },
      { id: 'edit_service', label: 'Edit Service' },
    ],
  },
  {
    id: 'view_inventory',
    label: 'View Inventory',
    children: [
      { id: 'export_inventory_pdf', label: 'Export PDF' },
      { id: 'add_inventory_item', label: 'Add Item' },
      { id: 'add_inventory_purchase', label: 'Add Purchase' },
      { id: 'pullout_inventory_request', label: 'Pullout Request' },
      { id: 'add_inventory_supplier', label: 'Add Supplier' },
      { id: 'edit_inventory_item', label: 'Edit Item' },
    ],
  },
  {
    id: 'view_pullout_requests',
    label: 'View Pullout Requests',
    children: [
      { id: 'approve_pullout_request', label: 'Approve Request' },
      { id: 'mark_return_pullout', label: 'Mark Return' },
    ],
  },
  {
    id: 'view_users',
    label: 'View Users',
    children: [{ id: 'edit_user', label: 'Edit Customer/User' }],
  },
  {
    id: 'view_employees',
    label: 'View Employees',
    children: [
      { id: 'add_employee', label: 'Add Employee' },
      { id: 'edit_employee', label: 'Edit Employee' },
      { id: 'delete_employee', label: 'Delete Employee' },
      { id: 'view_commissions', label: 'View Commissions' },
      { id: 'view_wallet', label: 'View E-Wallet' },
      { id: 'manage_payouts', label: 'Manage Payouts' },
    ],
  },
  {
    id: 'view_transactions',
    label: 'View Transactions',
    children: [{ id: 'export_transactions_pdf', label: 'Export PDF' }],
  },
  { id: 'view_reports', label: 'View Reports' },
  {
    id: 'manage_settings',
    label: 'Manage System Settings',
    children: [
      { id: 'manage_loyalty', label: 'Loyalty Points' },
      { id: 'manage_gcash', label: 'GCash Info' },
      { id: 'manage_discounts', label: 'Global Discounts' },
    ],
  },
]

interface AdminPrivilegesProps {
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
}

export function AdminPrivileges({ selectedPermissions, onChange }: AdminPrivilegesProps) {
  const togglePermission = (id: string, checked: boolean) => {
    let newPermissions = [...selectedPermissions]

    if (checked) {
      if (!newPermissions.includes(id)) {
        newPermissions.push(id)
      }

      // If checking a parent, check all its children
      const parentPrivilege = PRIVILEGES.find((p) => p.id === id)
      if (parentPrivilege && parentPrivilege.children) {
        parentPrivilege.children.forEach((child) => {
          if (!newPermissions.includes(child.id)) {
            newPermissions.push(child.id)
          }
        })
      }

      // If checking a child, ensure the parent is also checked
      const parent = PRIVILEGES.find((p) => p.children?.some((c) => c.id === id))
      if (parent && !newPermissions.includes(parent.id)) {
        newPermissions.push(parent.id)
      }
    } else {
      // Unchecking logic
      newPermissions = newPermissions.filter((p) => p !== id)

      // If unchecking a parent, uncheck all its children
      const parentPrivilege = PRIVILEGES.find((p) => p.id === id)
      if (parentPrivilege && parentPrivilege.children) {
        const childIds = parentPrivilege.children.map((c) => c.id)
        newPermissions = newPermissions.filter((p) => !childIds.includes(p))
      }
    }

    onChange(newPermissions)
  }

  return (
    <div className="grid gap-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
          Access Control List
        </h3>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          Scroll for more
        </p>
      </div>
      <div className="custom-scrollbar grid max-h-[400px] grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2 lg:max-h-[500px]">
        {PRIVILEGES.map((privilege) => (
          <div
            key={privilege.id}
            className="space-y-3 rounded-xl border border-border/50 bg-muted/5 p-4 transition-all hover:border-highlight/30 hover:bg-muted/10 shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                id={privilege.id}
                checked={selectedPermissions.includes(privilege.id)}
                onCheckedChange={(checked) => togglePermission(privilege.id, checked as boolean)}
                className="data-[state=checked]:bg-highlight data-[state=checked]:border-highlight"
              />
              <Label
                htmlFor={privilege.id}
                className="text-sm font-bold leading-none tracking-tight text-foreground cursor-pointer"
              >
                {privilege.label}
              </Label>
            </div>
            {privilege.children && (
              <div className="ml-7 grid grid-cols-1 gap-2.5 border-l border-border/50 pl-4 py-1">
                {privilege.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center space-x-2.5 group/item"
                  >
                    <Checkbox
                      id={child.id}
                      checked={selectedPermissions.includes(child.id)}
                      onCheckedChange={(checked) =>
                        togglePermission(child.id, checked as boolean)
                      }
                      className="h-3.5 w-3.5 data-[state=checked]:bg-highlight/80 data-[state=checked]:border-highlight/80"
                    />
                    <Label
                      htmlFor={child.id}
                      className="text-[13px] font-medium leading-none text-muted-foreground cursor-pointer transition-colors group-hover/item:text-foreground"
                    >
                      {child.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
