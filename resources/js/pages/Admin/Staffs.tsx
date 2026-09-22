import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
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
import { Label } from '@/components/ui/label'
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
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { ChevronDownIcon, Landmark, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// ---------- Interfaces ----------
interface BreadcrumbItem {
  title: string
  href: string
}

interface Staff {
  id: number
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  address: string
  status: 'Active' | 'Inactive' | 'Absent'
  assignedStatus: 'available' | 'assigned' | 'on_leave'
  dateHired: string
  role: 'Admin' | 'Employee'
  commissionPercentage: number
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

// ---------- Breadcrumbs ----------
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Staff Management', href: '/staffs' }]

export default function Staffs() {
  const [staffData, setStaffData] = useState<PaginatedResponse<Staff> | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive' | 'Absent'>('All')
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const { hasPermission } = usePermissions()

  // Add / Edit Form state
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    address: '',
    commissionPercentage: '',
  })
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    address: '',
    status: 'Active' as Staff['status'],
    commissionPercentage: '',
  })

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null)

  // Financial ledger modal state
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [selectedStaffIdForLedger, setSelectedStaffIdForLedger] = useState<number | null>(null)
  const [ledgerStartDate, setLedgerStartDate] = useState<string>('')
  const [ledgerEndDate, setLedgerEndDate] = useState<string>('')
  const [ledgerData, setLedgerData] = useState<{
    employee: string
    commission_percentage: number
    total_earned: number
    total_paid: number
    balance: number
    payouts: any[]
    orders: any[]
    total_commission: number
  } | null>(null)
  const [loadingLedger, setLoadingLedger] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    payout_date: new Date().toISOString().split('T')[0],
    remarks: '',
  })
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false)
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([])
  const [showBatchPayoutModal, setShowBatchPayoutModal] = useState(false)
  const [batchRows, setBatchRows] = useState<
    { employee_id: number; name: string; balance: number; amount: string }[]
  >([])
  const [batchPayoutDate, setBatchPayoutDate] = useState(new Date().toISOString().split('T')[0])
  const [batchRemarks, setBatchRemarks] = useState('')
  const [loadingBatchBalances, setLoadingBatchBalances] = useState(false)
  const [isSubmittingBatchPayout, setIsSubmittingBatchPayout] = useState(false)

  // Helper to get current month range
  const getCurrentMonthRange = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const format = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    return { start: format(firstDay), end: format(lastDay) }
  }

  // Load Staffs
  const loadStaffs = async (url?: string) => {
    try {
      setLoading(true)
      const endpoint = url || '/api/employees/list'
      const params: any = {
        per_page: perPage,
        search: search,
        status: filter === 'All' ? null : filter,
      }

      let finalUrl = endpoint
      const finalParams = { ...params }
      if (url) {
        finalUrl = url
        // Ensure parameters are maintained if url doesn't have them,
        // but typically pagination links have page only.
        const urlObj = new URL(url)
        if (urlObj.searchParams.has('page')) {
          finalParams.page = urlObj.searchParams.get('page')
        }
      }

      const res = await axios.get(finalUrl, { params: finalParams })

      // Map API response (snake_case) to Staff interface (camelCase)
      const mappedData: Staff[] = res.data.data.map((s: any) => ({
        id: s.employee_id,
        firstName: s.first_name,
        lastName: s.last_name,
        middleName: s.middle_name || '',
        phone: s.phone_number,
        address: s.address,
        status: s.status,
        assignedStatus: s.assigned_status,
        dateHired: s.date_hired,
        role: s.role || 'Employee',
        commissionPercentage: s.commission_percentage || 0,
      }))

      setStaffData({
        ...res.data,
        data: mappedData,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to load staff list')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (url: string) => {
    loadStaffs(url)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStaffs()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, filter, perPage])

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 11)

  const resetAddForm = () =>
    setAddForm({
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      address: '',
      commissionPercentage: '',
    })

  const resetEditForm = () => {
    setEditingStaff(null)
    setEditForm({
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      address: '',
      status: 'Active',
      commissionPercentage: '',
    })
  }

  // ---------- CRUD Handlers ----------
  // ---------- CRUD Handlers ----------
  const handleAdd = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.phone) return

    try {
      await axios.post('/api/staffs', addForm)

      resetAddForm()
      toast.success('Staff added successfully!')
      loadStaffs() // Reload list (first page or current? searching active?)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add staff')
    }
  }

  const openEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setEditForm({
      ...staff,
      middleName: staff.middleName ?? '',
      commissionPercentage: staff.commissionPercentage.toString(),
    })
  }

  const handleUpdate = async () => {
    if (!editingStaff) return
    try {
      await axios.put(`/staffs/${editingStaff.id}`, editForm)

      resetEditForm()
      toast.success('Staff updated successfully!')
      loadStaffs() // Reload list
    } catch (error) {
      console.error(error)
      toast.error('Failed to update staff')
    }
  }

  const handleDelete = (id: number) => {
    setDeletingStaffId(id)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingStaffId) return
    try {
      await axios.delete(`/staffs/${deletingStaffId}`)
      toast.success('Staff deleted successfully!')
      loadStaffs() // Reload list
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete staff')
    } finally {
      setShowDeleteModal(false)
      setDeletingStaffId(null)
    }
  }

  const formatCurrency = (amount?: number) =>
    `₱${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const getStaffName = (staff: Staff) => {
    const middleInitial = staff.middleName?.trim() ? `${staff.middleName.trim()[0]}. ` : ''

    return `${staff.firstName} ${middleInitial}${staff.lastName}`
  }

  const loadLedger = async () => {
    if (!selectedStaffIdForLedger) return

    try {
      setLoadingLedger(true)
      const res = await axios.get(`/api/staffs/${selectedStaffIdForLedger}/financial-ledger`, {
        params: {
          start_date: ledgerStartDate,
          end_date: ledgerEndDate,
        },
      })
      setLedgerData(res.data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load financial ledger')
    } finally {
      setLoadingLedger(false)
    }
  }

  const openLedger = async (id: number) => {
    const { start, end } = getCurrentMonthRange()
    setSelectedStaffIdForLedger(id)
    setLedgerStartDate(start)
    setLedgerEndDate(end)
    setShowLedgerModal(true)
    setPayoutForm({
      amount: '',
      payout_date: new Date().toISOString().split('T')[0],
      remarks: '',
    })
  }

  useEffect(() => {
    if (showLedgerModal && selectedStaffIdForLedger) {
      loadLedger()
    }
  }, [showLedgerModal, selectedStaffIdForLedger, ledgerStartDate, ledgerEndDate])

  const handleRecordPayout = async () => {
    if (!selectedStaffIdForLedger || !payoutForm.amount) return
    try {
      setIsSubmittingPayout(true)
      await axios.post(`/api/staffs/${selectedStaffIdForLedger}/payout`, payoutForm)
      toast.success('Payout recorded successfully')
      loadLedger()
      loadStaffs()
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.errors?.amount?.[0] ||
          'Failed to record payout',
      )
    } finally {
      setIsSubmittingPayout(false)
    }
  }

  const visibleStaffIds = staffData?.data.map((staff) => staff.id) || []
  const selectedVisibleStaffIds = selectedStaffIds.filter((id) => visibleStaffIds.includes(id))
  const allVisibleSelected =
    visibleStaffIds.length > 0 && selectedVisibleStaffIds.length === visibleStaffIds.length

  const toggleStaffSelection = (id: number) => {
    setSelectedStaffIds((current) =>
      current.includes(id) ? current.filter((staffId) => staffId !== id) : [...current, id],
    )
  }

  const toggleAllVisibleStaff = () => {
    setSelectedStaffIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleStaffIds.includes(id))
      }

      return Array.from(new Set([...current, ...visibleStaffIds]))
    })
  }

  const openBatchPayout = async () => {
    const selectedStaff =
      staffData?.data.filter((staff) => selectedStaffIds.includes(staff.id)) || []
    setShowBatchPayoutModal(true)
    setLoadingBatchBalances(true)

    try {
      const ledgers = await Promise.all(
        selectedStaff.map(async (staff) => {
          const response = await axios.get(`/api/staffs/${staff.id}/financial-ledger`)

          return {
            employee_id: staff.id,
            name: getStaffName(staff),
            balance: Number(response.data.balance || 0),
            amount: Number(response.data.balance || 0).toFixed(2),
          }
        }),
      )
      setBatchRows(ledgers)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load selected staff balances')
    } finally {
      setLoadingBatchBalances(false)
    }
  }

  const updateBatchAmount = (employeeId: number, amount: string) => {
    setBatchRows((current) =>
      current.map((row) => (row.employee_id === employeeId ? { ...row, amount } : row)),
    )
  }

  const totalBatchPayout = batchRows.reduce((total, row) => total + Number(row.amount || 0), 0)

  const handleBatchPayout = async () => {
    try {
      setIsSubmittingBatchPayout(true)
      await axios.post('/api/staffs/batch-payout', {
        payout_date: batchPayoutDate,
        remarks: batchRemarks,
        payouts: batchRows.map((row) => ({
          employee_id: row.employee_id,
          amount: row.amount,
        })),
      })
      toast.success('Batch payout recorded successfully')
      setShowBatchPayoutModal(false)
      setSelectedStaffIds([])
      setBatchRows([])
      setBatchRemarks('')
      loadStaffs()
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.errors?.payouts?.[0] ||
          'Failed to record batch payout',
      )
    } finally {
      setIsSubmittingBatchPayout(false)
    }
  }

  /* Removed filteredStaff memo */

  const getStatusVariant = (status: Staff['status']) => {
    switch (status) {
      case 'Active':
        return 'success'
      case 'Inactive':
        return 'destructive'
      case 'Absent':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const staffToDelete =
    deletingStaffId && staffData?.data ? staffData.data.find((s) => s.id === deletingStaffId) : null

  // ---------- JSX ----------
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Staff Management" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Staff Management"
            description="Manage employees and schedules"
          />

          {/*add modal*/}
          {hasPermission('add_employee') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="highlight">
                  <Plus className="h-4 w-4" /> Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Add{' '}
                    <span className="font-semibold text-yellow-400 dark:text-highlight">
                      Employee
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-3 py-2 text-foreground">
                  {/* first name */}
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={addForm.firstName}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/*last name*/}
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={addForm.lastName}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          lastName: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/*middle name*/}
                  <div>
                    <Label>Middle Name (optional)</Label>
                    <Input
                      value={addForm.middleName}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          middleName: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/*phone*/}
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={addForm.phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setAddForm({
                          ...addForm,
                          phone: formatted,
                        })
                      }}
                      maxLength={11}
                    />
                  </div>
                  {/*address*/}
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={addForm.address}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/* commission % */}
                  <div>
                    <Label>Commission Percentage (%)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={addForm.commissionPercentage}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          commissionPercentage: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-3">
                  <DialogClose asChild>
                    <Button
                      variant="secondary"
                      onClick={resetAddForm}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      variant="highlight"
                      onClick={handleAdd}
                    >
                      Save Employee
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* ... search ... */
        /* Keeping search card logic, it uses search state which is fine */}
        <Card className="border border-border/50 bg-background text-foreground shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between gap-4 text-foreground">
              <h2 className="text-lg font-bold tracking-tight">Search Employees</h2>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20">
                  {filter === 'All' ? 'Filter by: All Status' : `Status: ${filter}`}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-40 border border-border bg-background text-foreground shadow-md">
                  {['All', 'Active', 'Inactive', 'Absent'].map((f) => (
                    <DropdownMenuItem
                      key={f}
                      onClick={() => setFilter(f as typeof filter)}
                      className="cursor-pointer text-foreground hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20"
                    >
                      {f === 'All' ? 'All Status' : f}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-border/50 bg-background pl-10 text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/*staff_tbl*/}
        <Card className="border border-sidebar-border/70 bg-background">
          <CardContent className="p-4 text-foreground">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <HeadingSmall
                title="Staff List"
                description={`Total: ${staffData?.total || 0} employee${
                  (staffData?.total || 0) !== 1 ? 's' : ''
                }`}
              />
              {hasPermission('manage_payouts') && (
                <Button
                  variant="highlight"
                  size="sm"
                  onClick={openBatchPayout}
                  disabled={selectedStaffIds.length === 0}
                  className="gap-2 text-xs font-bold tracking-wider uppercase"
                >
                  <Landmark className="h-4 w-4" />
                  Batch Payout
                </Button>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center">Loading...</div>
            ) : !staffData || staffData.data.length === 0 ? (
              <div className="py-12 text-center">
                <p className="italic">
                  {search || filter !== 'All'
                    ? 'No employees match your search.'
                    : 'No employees yet. Click "Add Employee" to get started.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {hasPermission('manage_payouts') && (
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleAllVisibleStaff}
                              className="h-4 w-4 rounded border-border accent-highlight"
                              aria-label="Select all visible staff"
                            />
                          </TableHead>
                        )}
                        <TableHead>Name</TableHead>
                        <TableHead>Contact #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Hired</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffData.data.map((staff) => {
                        const middleInitial = staff.middleName?.trim()
                          ? `${staff.middleName.trim()[0]}.`
                          : ''
                        return (
                          <TableRow key={staff.id}>
                            {hasPermission('manage_payouts') && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedStaffIds.includes(staff.id)}
                                  onChange={() => toggleStaffSelection(staff.id)}
                                  className="h-4 w-4 rounded border-border accent-highlight"
                                  aria-label={`Select ${getStaffName(staff)}`}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              {staff.firstName} {middleInitial ? `${middleInitial} ` : ''}
                              {staff.lastName}
                            </TableCell>
                            <TableCell>{staff.phone}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(staff.status)}>{staff.status}</Badge>
                            </TableCell>
                            <TableCell>{staff.dateHired}</TableCell>
                            <TableCell>{staff.address}</TableCell>
                            <TableCell className="font-bold">{staff.role}</TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-3">
                                {/* Edit Modal (Dialog) */}
                                {hasPermission('edit_employee') && (
                                  <Dialog>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <DialogTrigger asChild>
                                            <button
                                              onClick={() => openEdit(staff)}
                                              className="text-foreground hover:text-foreground/80"
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </button>
                                          </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Edit Employee</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Edit{' '}
                                          <span className="font-semibold text-highlight">
                                            Employee
                                          </span>
                                        </DialogTitle>
                                      </DialogHeader>

                                      <div className="grid gap-3 py-2">
                                        {/* first name */}
                                        <div>
                                          <Label>First Name</Label>
                                          <Input
                                            value={editForm.firstName}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                firstName: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/*last name*/}
                                        <div>
                                          <Label>Last Name</Label>
                                          <Input
                                            value={editForm.lastName}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                lastName: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/*middle name*/}
                                        <div>
                                          <Label>Middle Name (optional)</Label>
                                          <Input
                                            value={editForm.middleName}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                middleName: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/*phone*/}
                                        <div>
                                          <Label>Phone Number</Label>
                                          <Input
                                            value={editForm.phone}
                                            onChange={(e) => {
                                              const formatted = formatPhone(e.target.value)
                                              setEditForm({
                                                ...editForm,
                                                phone: formatted,
                                              })
                                            }}
                                            maxLength={11}
                                          />
                                        </div>
                                        {/*address*/}
                                        <div>
                                          <Label>Address</Label>
                                          <Input
                                            value={editForm.address}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                address: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/* commission % */}
                                        <div>
                                          <Label>Commission Percentage (%)</Label>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={editForm.commissionPercentage}
                                            onChange={(e) =>
                                              setEditForm({
                                                ...editForm,
                                                commissionPercentage: e.target.value,
                                              })
                                            }
                                          />
                                        </div>
                                        {/*status*/}
                                        <div>
                                          <Label>Status</Label>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="w-full">
                                                  <Select
                                                    value={editForm.status}
                                                    disabled={
                                                      editingStaff?.assignedStatus === 'assigned'
                                                    }
                                                    onValueChange={(value) =>
                                                      setEditForm({
                                                        ...editForm,
                                                        status: value as typeof editForm.status,
                                                      })
                                                    }
                                                  >
                                                    <SelectTrigger className="w-full">
                                                      <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="Active">Active</SelectItem>
                                                      <SelectItem value="Inactive">
                                                        Inactive
                                                      </SelectItem>
                                                      <SelectItem value="Absent">Absent</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                </div>
                                              </TooltipTrigger>
                                              {editingStaff?.assignedStatus === 'assigned' && (
                                                <TooltipContent>
                                                  <p>
                                                    Status cannot be changed while assigned to a
                                                    service.
                                                  </p>
                                                </TooltipContent>
                                              )}
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </div>

                                      <DialogFooter className="flex justify-end gap-3">
                                        <DialogClose asChild>
                                          <Button
                                            variant="secondary"
                                            onClick={resetEditForm}
                                          >
                                            Cancel
                                          </Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                          <Button
                                            variant="highlight"
                                            onClick={handleUpdate}
                                          >
                                            Update Employee
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                )}

                                {(hasPermission('view_commissions') ||
                                  hasPermission('view_wallet')) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => openLedger(staff.id)}
                                          className="text-highlight hover:text-highlight/80"
                                        >
                                          <Landmark className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Financial Ledger</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                {/*delete*/}
                                {hasPermission('delete_employee') && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => handleDelete(staff.id)}
                                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Delete Employee</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                {staffData && (
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
                      links={staffData.links}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Delete <span className="text-highlight">Employee</span>
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete{' '}
                    <span className="font-semibold">
                      {staffToDelete?.firstName} {staffToDelete?.lastName}
                    </span>
                    ? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingStaffId(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDelete}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Financial Ledger Modal */}
            <Dialog
              open={showLedgerModal}
              onOpenChange={setShowLedgerModal}
            >
              <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto border-border/50 bg-background/95 p-0 backdrop-blur-xl transition-all sm:max-w-6xl">
                <div className="p-5">
                  <DialogHeader className="mb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <DialogTitle className="text-xl">
                          Financial <span className="text-highlight">Ledger</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground/80">
                          Commissions, wallet balance, and payout history for{' '}
                          <span className="font-semibold text-foreground">
                            {ledgerData?.employee}
                          </span>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Card className="border-border/50 border-highlight/20 bg-gradient-to-br from-highlight/5 to-transparent shadow-none">
                      <CardContent className="p-3">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                          Lifetime Earned
                        </p>
                        <p className="text-xl font-black text-highlight">
                          {formatCurrency(ledgerData?.total_earned)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent shadow-none">
                      <CardContent className="p-3">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                          Total Paid Out
                        </p>
                        <p className="text-xl font-black text-red-500">
                          {formatCurrency(ledgerData?.total_paid)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent shadow-none">
                      <CardContent className="p-3">
                        <p className="text-[10px] font-bold tracking-wider text-green-600 text-muted-foreground/70 uppercase">
                          Remaining Balance
                        </p>
                        <p className="text-2xl font-black text-green-600">
                          {formatCurrency(ledgerData?.balance)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent shadow-none">
                      <CardContent className="p-3">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                          Commission Rate
                        </p>
                        <p className="text-2xl font-black text-foreground">
                          {ledgerData?.commission_percentage || 0}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-xl border border-border/50 bg-muted/5 p-4 shadow-sm">
                        <HeadingSmall
                          title="Record Payout"
                          description="Distribute commission to staff"
                        />
                        <div className="mt-4 grid gap-4">
                          <div className="grid gap-2">
                            <Label className="text-xs font-semibold">Payout Amount (₱)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={payoutForm.amount}
                              onChange={(e) =>
                                setPayoutForm({ ...payoutForm, amount: e.target.value })
                              }
                              className="h-10 bg-background/50 font-medium transition-all focus:bg-background"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs font-semibold">Payout Date</Label>
                            <Input
                              type="date"
                              value={payoutForm.payout_date}
                              onChange={(e) =>
                                setPayoutForm({ ...payoutForm, payout_date: e.target.value })
                              }
                              className="h-10 bg-background/50 transition-all focus:bg-background"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs font-semibold">Remarks/Notes</Label>
                            <Input
                              placeholder="e.g. Weekly payout"
                              value={payoutForm.remarks}
                              onChange={(e) =>
                                setPayoutForm({ ...payoutForm, remarks: e.target.value })
                              }
                              className="h-10 bg-background/50 transition-all focus:bg-background"
                            />
                          </div>
                          {hasPermission('manage_payouts') && (
                            <Button
                              variant="highlight"
                              size="lg"
                              className="mt-2 font-bold shadow-lg shadow-highlight/20"
                              onClick={handleRecordPayout}
                              disabled={isSubmittingPayout || !payoutForm.amount}
                            >
                              {isSubmittingPayout ? 'Processing...' : 'Confirm Payout'}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden rounded-xl border border-border/50 bg-muted/10 p-4 shadow-inner">
                        <HeadingSmall
                          title="Payout History"
                          description="Record of previous payouts"
                        />
                        <div className="custom-scrollbar mt-4 max-h-[320px] overflow-y-auto pr-1">
                          <Table>
                            <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-sm backdrop-blur-sm">
                              <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase">
                                  Date
                                </TableHead>
                                <TableHead className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase">
                                  Amount
                                </TableHead>
                                <TableHead className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase">
                                  Remarks
                                </TableHead>
                                <TableHead className="px-3 py-2 text-right text-[10px] font-bold tracking-widest uppercase">
                                  Processed By
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loadingLedger ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="py-12 text-center"
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-highlight border-t-transparent" />
                                      <span className="loading-text text-xs">
                                        Fetching history...
                                      </span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : !ledgerData?.payouts || ledgerData.payouts.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="rounded-lg bg-muted/5 py-12 text-center text-xs text-muted-foreground/60 italic"
                                  >
                                    No payouts recorded yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                ledgerData.payouts.map((p) => (
                                  <TableRow
                                    key={p.payout_id}
                                    className="group border-border/10 text-[11px] transition-all hover:bg-highlight/5"
                                  >
                                    <TableCell className="px-3 py-3 font-semibold text-muted-foreground tabular-nums">
                                      {new Date(p.payout_date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: '2-digit',
                                        year: 'numeric',
                                      })}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 font-black text-red-500 tabular-nums">
                                      ₱
                                      {parseFloat(p.amount).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })}
                                    </TableCell>
                                    <TableCell className="px-3 py-3 font-medium text-muted-foreground/80">
                                      <div
                                        className="max-w-[140px] truncate"
                                        title={p.remarks}
                                      >
                                        {p.remarks || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-3 py-3 text-right">
                                      <span className="rounded-md bg-highlight/10 px-2 py-1 text-[10px] font-bold text-highlight uppercase">
                                        {p.processor
                                          ? `${p.processor.first_name} ${p.processor.last_name}`
                                          : 'System'}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/10 p-4 shadow-inner">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <HeadingSmall
                          title="Commissions"
                          description="Completed orders in the selected date range"
                        />
                        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 p-2">
                          <Input
                            type="date"
                            value={ledgerStartDate}
                            onChange={(e) => setLedgerStartDate(e.target.value)}
                            className="h-8 w-[130px] border-none bg-transparent text-[11px] focus-visible:ring-0"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            to
                          </span>
                          <Input
                            type="date"
                            value={ledgerEndDate}
                            onChange={(e) => setLedgerEndDate(e.target.value)}
                            className="h-8 w-[130px] border-none bg-transparent text-[11px] focus-visible:ring-0"
                          />
                        </div>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border/50 bg-background/40">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background/95 shadow-sm backdrop-blur-sm">
                            <TableRow>
                              <TableHead className="text-[10px] uppercase">Date</TableHead>
                              <TableHead className="text-[10px] uppercase">Customer</TableHead>
                              <TableHead className="text-[10px] uppercase">Services</TableHead>
                              <TableHead className="text-right text-[10px] uppercase">
                                Total
                              </TableHead>
                              <TableHead className="text-right text-[10px] text-highlight uppercase">
                                Comm.
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingLedger ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="py-12 text-center text-xs text-muted-foreground"
                                >
                                  Loading ledger...
                                </TableCell>
                              </TableRow>
                            ) : !ledgerData?.orders || ledgerData.orders.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="py-12 text-center text-xs text-muted-foreground italic"
                                >
                                  No completed orders found.
                                </TableCell>
                              </TableRow>
                            ) : (
                              ledgerData.orders.map((order) => (
                                <TableRow
                                  key={order.id}
                                  className="border-border/10 hover:bg-highlight/5"
                                >
                                  <TableCell className="text-[11px] whitespace-nowrap text-muted-foreground">
                                    {order.date}
                                  </TableCell>
                                  <TableCell className="text-xs font-semibold whitespace-nowrap">
                                    {order.customer}
                                  </TableCell>
                                  <TableCell className="min-w-[180px] text-[11px] text-muted-foreground">
                                    {order.services}
                                  </TableCell>
                                  <TableCell className="text-right text-xs font-semibold tabular-nums">
                                    {formatCurrency(order.total_amount)}
                                  </TableCell>
                                  <TableCell className="text-right text-xs font-black text-highlight tabular-nums">
                                    {formatCurrency(order.commission_amount)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-border/30 bg-muted/5 p-4">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[100px] text-xs font-bold tracking-wider uppercase transition-all hover:bg-muted"
                    >
                      Close Ledger
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={showBatchPayoutModal}
              onOpenChange={setShowBatchPayoutModal}
            >
              <DialogContent className="max-h-[90vh] w-[94vw] overflow-y-auto border-border/50 bg-background/95 p-0 backdrop-blur-xl sm:max-w-4xl">
                <div className="p-5">
                  <DialogHeader className="mb-5">
                    <DialogTitle className="text-xl">
                      Batch <span className="text-highlight">Payout</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground/80">
                      Record payouts for selected employees in a single transaction.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mb-4 grid gap-3 rounded-xl border border-border/50 bg-muted/10 p-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Payout Date</Label>
                      <Input
                        type="date"
                        value={batchPayoutDate}
                        onChange={(e) => setBatchPayoutDate(e.target.value)}
                        className="bg-background/60"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-semibold">Remarks</Label>
                      <Input
                        placeholder="Optional batch note"
                        value={batchRemarks}
                        onChange={(e) => setBatchRemarks(e.target.value)}
                        className="bg-background/60"
                      />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10">
                    <Table>
                      <TableHeader className="bg-background/80">
                        <TableRow>
                          <TableHead>Staff Name</TableHead>
                          <TableHead className="text-right">Current Remaining Balance</TableHead>
                          <TableHead className="w-[190px] text-right">Payout Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingBatchBalances ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-12 text-center text-xs text-muted-foreground"
                            >
                              Loading selected balances...
                            </TableCell>
                          </TableRow>
                        ) : batchRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="py-12 text-center text-xs text-muted-foreground italic"
                            >
                              No staff selected.
                            </TableCell>
                          </TableRow>
                        ) : (
                          batchRows.map((row) => (
                            <TableRow
                              key={row.employee_id}
                              className="border-border/10"
                            >
                              <TableCell className="font-semibold">{row.name}</TableCell>
                              <TableCell className="text-right font-bold text-green-600 tabular-nums">
                                {formatCurrency(row.balance)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={row.amount}
                                  onChange={(e) =>
                                    updateBatchAmount(row.employee_id, e.target.value)
                                  }
                                  className="text-right font-semibold tabular-nums"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-highlight/20 bg-highlight/5 p-4">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Total Batch Payout Amount
                    </span>
                    <span className="text-2xl font-black text-highlight">
                      {formatCurrency(totalBatchPayout)}
                    </span>
                  </div>
                </div>

                <DialogFooter className="border-t border-border/30 bg-muted/5 p-4">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    variant="highlight"
                    size="sm"
                    onClick={handleBatchPayout}
                    disabled={
                      isSubmittingBatchPayout || loadingBatchBalances || batchRows.length === 0
                    }
                  >
                    {isSubmittingBatchPayout ? 'Processing...' : 'Confirm Batch Payout'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
