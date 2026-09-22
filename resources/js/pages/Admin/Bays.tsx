import Heading from '@/components/heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { Edit2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/use-permissions'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Bays', href: '/bays' }]

interface Bay {
  bay_id: number
  bay_number: number
  status: 'available' | 'occupied' | 'maintenance'
  bay_type: 'Normal' | 'Underwash'
  created_at?: string
  updated_at?: string
}

export default function Bays() {
  const [bays, setBays] = useState<Bay[]>([])
  const [loading, setLoading] = useState(true)
  const { hasPermission } = usePermissions()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Form state for add
  const [addForm, setAddForm] = useState({
    bay_number: '',
    bay_type: 'Normal',
  })

  // Form state for edit
  const [editForm, setEditForm] = useState<Bay | null>(null)
  const [editBayForm, setEditBayForm] = useState({
    bay_number: '',
    bay_type: 'Normal' as 'Normal' | 'Underwash',
    status: 'available' as 'available' | 'occupied' | 'maintenance',
  })

  // Delete confirmation state
  const [bayToDelete, setBayToDelete] = useState<Bay | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadBays()
  }, [])

  const loadBays = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/bays/list')
      setBays(res.data)
    } catch (err) {
      console.error('Failed to fetch bays:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBay = async () => {
    const errors: Record<string, string> = {}

    if (!addForm.bay_number) {
      errors.bay_number = 'Bay number is required'
    }
    if (!addForm.bay_type) {
      errors.bay_type = 'Bay type is required'
    }

    setAddErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setSubmitting(true)
      await axios.post('/api/bays', {
        bay_number: parseInt(addForm.bay_number),
        bay_type: addForm.bay_type,
        status: 'available',
      })

      setShowAddModal(false)
      setAddForm({ bay_number: '', bay_type: 'Normal' })
      setAddErrors({})
      await loadBays()
      toast.success('Bay added successfully!')
    } catch (err) {
      const error = err as unknown as {
        response?: { data?: { errors: Record<string, string> } }
      }
      if (error.response?.data?.errors) {
        setAddErrors(error.response.data.errors)
      } else {
        setAddErrors({ submit: 'Failed to add bay' })
      }
      toast.error('Failed to add bay')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (bay: Bay) => {
    setEditForm(bay)
    setEditBayForm({
      bay_number: bay.bay_number.toString(),
      bay_type: bay.bay_type,
      status: bay.status,
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditBay = async () => {
    if (!editForm) return

    const errors: Record<string, string> = {}

    if (!editBayForm.bay_number) {
      errors.bay_number = 'Bay number is required'
    } else if (parseInt(editBayForm.bay_number) < 0) {
      errors.bay_number = 'Bay number cannot be negative'
    }
    if (!editBayForm.bay_type) {
      errors.bay_type = 'Bay type is required'
    }
    if (!editBayForm.status) {
      errors.status = 'Status is required'
    }

    setEditErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setSubmitting(true)
      await axios.put(`/bays/${editForm.bay_id}`, {
        bay_number: parseInt(editBayForm.bay_number),
        bay_type: editBayForm.bay_type,
        status: editBayForm.status,
      })

      setShowEditModal(false)
      setEditForm(null)
      setEditErrors({})
      await loadBays()
      toast.success('Bay updated successfully!')
    } catch (err) {
      const error = err as unknown as {
        response?: { data?: { errors: Record<string, string> } }
      }
      if (error.response?.data?.errors) {
        setEditErrors(error.response.data.errors)
      } else {
        setEditErrors({ submit: 'Failed to update bay' })
      }
      toast.error('Failed to update bay')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (bay: Bay) => {
    setBayToDelete(bay)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!bayToDelete) return

    try {
      setSubmitting(true)
      await axios.delete(`/bays/${bayToDelete.bay_id}`)
      setShowDeleteModal(false)
      setBayToDelete(null)
      await loadBays()
      toast.success('Bay deleted successfully!')
    } catch (err) {
      console.error('Failed to delete bay:', err)
      toast.error('Failed to delete bay')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'success'
      case 'occupied':
        return 'warning'
      case 'maintenance':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'occupied':
        return 'Occupied'
      case 'maintenance':
        return 'Under Maintenance'
      default:
        return status
    }
  }

  const getNextBayNumber = () => {
    if (bays.length === 0) return 1
    const maxNumber = Math.max(...bays.map((b) => b.bay_number))
    return maxNumber + 1
  }

  const handleOpenAddModal = () => {
    const nextNumber = getNextBayNumber()
    setAddForm({
      bay_number: nextNumber.toString(),
      bay_type: 'Normal',
    })
    setAddErrors({})
    setShowAddModal(true)
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Bays" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Bay Management"
            description="Manage carwash bays and their availability"
          />
          <Dialog
            open={showAddModal}
            onOpenChange={(open) => {
              if (open) {
                handleOpenAddModal()
              } else {
                setShowAddModal(false)
              }
            }}
          >
            {hasPermission('add_bay') && (
              <DialogTrigger asChild>
                <Button variant="highlight">+ Add Bay</Button>
              </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Add New <span className="font-semibold text-yellow-400 black:text-highlight">Bay</span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Bay Number */}
                <div className="grid gap-2">
                  <Label htmlFor="bay_number">Bay Number</Label>
                  <Input
                    id="bay_number"
                    type="number"
                    placeholder="e.g., 1"
                    value={addForm.bay_number}
                    readOnly
                    min={0}
                  />
                  {addErrors.bay_number && (
                    <p className="text-sm text-red-500">{addErrors.bay_number}</p>
                  )}
                </div>

                {/* Bay Type */}
                <div className="grid gap-2">
                  <Label htmlFor="bay_type">Bay Type</Label>
                  <Select
                    value={addForm.bay_type}
                    onValueChange={(value) =>
                      setAddForm({
                        ...addForm,
                        bay_type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Underwash">Underwash</SelectItem>
                    </SelectContent>
                  </Select>
                  {addErrors.bay_type && (
                    <p className="text-sm text-red-500">{addErrors.bay_type}</p>
                  )}
                </div>

                {addErrors.submit && <p className="text-sm text-red-500">{addErrors.submit}</p>}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="highlight"
                  onClick={handleAddBay}
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Bay'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bays Grid */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading bays...</div>
        ) : bays.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No bays found. Click "Add Bay" to create one.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bays.map((bay) => {
              const isAvailable = bay.status === 'available'
              const isOccupied = bay.status === 'occupied'
              const isMaintenance = bay.status === 'maintenance'

              return (
                <Card
                  key={bay.bay_id}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl',
                    isAvailable &&
                      'border-green-200/50 bg-green-50/30 dark:border-green-900/50 dark:bg-green-950/20',
                    isOccupied &&
                      'border-orange-200/50 bg-orange-50/40 dark:border-orange-900/50 dark:bg-orange-950/30',
                    isMaintenance &&
                      'border-red-200/50 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/30',
                  )}
                >
                  {/* Optional glowing top border accent */}
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 h-1 transition-all duration-500',
                      isAvailable && 'bg-gradient-to-r from-green-400 to-emerald-500',
                      isOccupied && 'bg-gradient-to-r from-orange-400 to-amber-500',
                      isMaintenance && 'bg-gradient-to-r from-red-500 to-rose-600',
                    )}
                  />

                  <CardContent className="px-10 py-5">
                    <div className="mb-5 flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground">
                          Bay #{bay.bay_number}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bay.bay_type === 'Underwash' ? 'Underwash Bay' : 'Standard Bay'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <Badge variant={getStatusVariant(bay.status)}>
                        {getStatusLabel(bay.status)}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-3">
                      {hasPermission('edit_bay') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1">
                                <Button
                                  onClick={() => openEditModal(bay)}
                                  variant="highlight"
                                  className="h-11 w-full border-border/70 font-medium"
                                  disabled={isOccupied}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit Bay
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {isOccupied && (
                              <TooltipContent>
                                <p>Occupied bays cannot be edited.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {hasPermission('delete_bay') && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1">
                                <Button
                                  onClick={() => handleDeleteClick(bay)}
                                  variant="destructive"
                                  className="h-11 w-full font-medium"
                                  disabled={isOccupied}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {isOccupied && (
                              <TooltipContent>
                                <p>Occupied bays cannot be deleted.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog
          open={showEditModal}
          onOpenChange={setShowEditModal}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit <span className="font-semibold text-yellow-400 black:text-highlight">Bay</span>
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Bay Number */}
              <div className="grid gap-2">
                <Label htmlFor="edit_bay_number">Bay Number</Label>
                <Input
                  id="edit_bay_number"
                  type="number"
                  placeholder="e.g., 1"
                  value={editBayForm.bay_number}
                  onChange={(e) =>
                    setEditBayForm({
                      ...editBayForm,
                      bay_number: e.target.value,
                    })
                  }
                />
                {editErrors.bay_number && (
                  <p className="text-sm text-red-500">{editErrors.bay_number}</p>
                )}
              </div>

              {/* Bay Type */}
              <div className="grid gap-2">
                <Label htmlFor="edit_bay_type">Bay Type</Label>
                <Select
                  value={editBayForm.bay_type}
                  onValueChange={(value) =>
                    setEditBayForm({
                      ...editBayForm,
                      bay_type: value as 'Normal' | 'Underwash',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Underwash">Underwash</SelectItem>
                  </SelectContent>
                </Select>
                {editErrors.bay_type && (
                  <p className="text-sm text-red-500">{editErrors.bay_type}</p>
                )}
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={editBayForm.status}
                  onValueChange={(value) =>
                    setEditBayForm({
                      ...editBayForm,
                      status: value as 'available' | 'occupied' | 'maintenance',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {editErrors.status && <p className="text-sm text-red-500">{editErrors.status}</p>}
              </div>

              {editErrors.submit && <p className="text-sm text-red-500">{editErrors.submit}</p>}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="highlight"
                onClick={handleEditBay}
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Update Bay'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Bay</DialogTitle>
            </DialogHeader>
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="font-semibold">Bay #{bayToDelete?.bay_number}</span>? This action
              cannot be undone.
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
