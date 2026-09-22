import { AdminPrivileges } from '@/components/admin-privileges'
import Heading from '@/components/heading'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { ChevronDownIcon, Edit2, Search, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { route } from 'ziggy-js'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Customers', href: '/customers' }]

interface User {
  user_id: number
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  phone_number: string
  address?: string | null
  role: string
  permissions?: string[]
  bookings: number
  loyaltyPoints: number
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

export default function Customers() {
  const [customersData, setCustomersData] = useState<PaginatedResponse<User> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filter, setFilter] = useState<'All' | 'Name' | 'Email' | 'Phone'>('All')
  const [loading, setLoading] = useState(true)
  const [perPage, setPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState<'customers' | 'admins'>('customers')
  const [lastUrl, setLastUrl] = useState<string | null>(null)

  // Load data on mount and dependencies change
  useEffect(() => {
    loadCustomers()
  }, [perPage, activeTab]) // Reload when perPage or activeTab changes

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchValue])

  const loadCustomers = async (url?: string) => {
    setLoading(true)
    try {
      const targetUrl = url || lastUrl || route('api.admin.customers.index')
      const params: any = {
        per_page: perPage,
        search: searchValue,
        role: activeTab === 'customers' ? 'customer' : 'admin',
      }

      // If 'url' is provided (from pagination links), handle it carefully
      let finalUrl = targetUrl
      if (url) {
        try {
          // Handle both absolute and relative URLs safely
          const baseUrl = window.location.origin
          const urlObj = new URL(url, baseUrl)
          const page = urlObj.searchParams.get('page')
          if (page) {
            params.page = page
          }
          // Use the base API route to ensure we hit the JSON endpoint
          finalUrl = route('api.admin.customers.index')
        } catch (e) {
          console.error('URL parsing failed, falling back to page 1:', e)
        }
      }

      const res = await axios.get(finalUrl, { params })
      setCustomersData(res.data)

      // Store this as the last successful URL (for refreshing after updates)
      if (res.data.current_page) {
        setLastUrl(finalUrl + `?page=${res.data.current_page}`)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      toast.error('Failed to update the list. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  // Edit State
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'customer',
    password: '',
    permissions: [] as string[],
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTab, setEditTab] = useState('general')
  const [processing, setProcessing] = useState(false)

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditForm({
      first_name: user.first_name,
      middle_name: user.middle_name || '',
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number || '',
      role: user.role,
      permissions: user.permissions || [],
      password: '', // Password empty by default
    })
    setEditTab('general')
    setIsEditOpen(true)
  }

  // Auto-switch tab if role changes to non-admin
  useEffect(() => {
    if (editForm.role !== 'admin' && editTab === 'privileges') {
      setEditTab('general')
    }
  }, [editForm.role])

  // Password Confirmation State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const handleSaveClick = () => {
    setIsConfirmOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingUser) return
    setProcessing(true)

    try {
      await axios.put(route('customers.update', editingUser.user_id), {
        ...editForm,
        admin_password: adminPassword,
      })
      toast.success('Customer updated successfully')
      setIsEditOpen(false)
      setIsConfirmOpen(false)
      setEditingUser(null)
      setAdminPassword('')
      await loadCustomers() // Reload list (preserves current page via lastUrl)
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update customer')
    } finally {
      setProcessing(false)
    }
  }

  // Removed useMemo filteredCustomers as filtering is done server-side

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Customers" />
      <div className="flex flex-col gap-6 p-6">
        <Heading
          title="Customers"
          description="Manage customer records, bookings and loyalty points"
        />

        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Search Customers</h2>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20">
                  {filter}
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-40 border border-border bg-background shadow-md">
                  {['All', 'Name', 'Email', 'Phone'].map((f) => (
                    <DropdownMenuItem
                      key={f}
                      onClick={() => setFilter(f as typeof filter)}
                      className="text-foreground hover:bg-muted-foreground/10 dark:hover:bg-muted-foreground/20"
                    >
                      {f}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full border-border bg-background pl-10 text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {activeTab === 'customers' ? 'Customer List' : 'Admin List'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Total: {customersData?.total || 0} {activeTab}
                </p>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as any)}
                className="w-[400px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="admins">Admins</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loading && !customersData ? (
              <div className="flex items-center justify-center py-32">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-highlight" />
              </div>
            ) : !customersData || customersData.data.length === 0 ? (
              <div className="py-32 text-center text-muted-foreground">No customers found</div>
            ) : (
              <>
                {/* Desktop: Scrollable Table with Sticky Header */}
                <div className="hidden lg:block">
                  <div className="custom-scrollbar max-h-[65vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <TableRow className="border-b border-border/50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Phone</TableHead>
                          <TableHead className="text-center font-semibold">Bookings</TableHead>
                          <TableHead className="text-center font-semibold">
                            Loyalty Points
                          </TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Role</TableHead>
                          <TableHead className="text-center font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customersData.data.map((c) => (
                          <TableRow
                            key={c.user_id}
                            className="border-b border-border/30 transition-colors hover:bg-muted/40"
                          >
                            <TableCell className="font-medium">
                              {c.first_name} {c.middle_name && `${c.middle_name} `}
                              {c.last_name}
                            </TableCell>
                            <TableCell>{c.phone_number}</TableCell>
                            <TableCell className="text-center font-medium">{c.bookings}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{c.loyaltyPoints}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {c.email}
                            </TableCell>
                            <TableCell className="capitalize">{c.role}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(c)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Mobile: Scrollable Cards */}
                <div className="block space-y-3 p-4 lg:hidden">
                  {customersData.data.map((c) => (
                    <div
                      key={c.user_id}
                      className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {c.first_name} {c.middle_name && `${c.middle_name} `}
                            {c.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{c.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1.5 dark:bg-yellow-900/30">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold">{c.loyaltyPoints}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{c.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bookings</p>
                          <p className="text-center font-medium">{c.bookings}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Pagination */}
            {/* Pagination */}
            {customersData && (
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
                  links={customersData.links}
                  onPageChange={loadCustomers}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      >
        <DialogContent className="p-0 transition-all duration-300 sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  Edit Profile: {editForm.first_name} {editForm.last_name}
                </DialogTitle>
                <DialogDescription>
                  Update account details and access permissions for this user.
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Current Role
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide',
                    editForm.role === 'admin'
                      ? 'bg-highlight/10 text-highlight'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {editForm.role}
                </span>
              </div>
            </div>
          </DialogHeader>

          <Tabs
            value={editTab}
            onValueChange={setEditTab}
            className="w-full"
          >
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger
                  value="privileges"
                  disabled={editForm.role !== 'admin'}
                >
                  Access Permissions
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 py-4">
              <TabsContent
                value="general"
                className="mt-0 space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="first_name"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="h-10 border-border/60 bg-muted/5 focus:ring-highlight"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="middle_name"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Middle Name
                      </Label>
                      <Input
                        id="middle_name"
                        value={editForm.middle_name}
                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                        className="h-10 border-border/60 bg-muted/5 focus:ring-highlight"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="last_name"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="h-10 border-border/60 bg-muted/5 focus:ring-highlight"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="email"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="h-10 border-border/60 bg-muted/5 focus:ring-highlight"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        autoComplete="tel"
                        value={editForm.phone_number}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="h-10 border-border/60 bg-muted/5 focus:ring-highlight"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label
                        htmlFor="role"
                        className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        System Role
                      </Label>
                      <Select
                        value={editForm.role}
                        onValueChange={(val) => setEditForm({ ...editForm, role: val })}
                      >
                        <SelectTrigger className="h-10 border-border/60 bg-muted/5">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="password"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Security <span className="text-highlight">(Modify Password)</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Leave blank to keep current password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="h-10 border-border/60 bg-background focus:ring-highlight"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Only fill this if you want to reset the user&apos;s password.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {editForm.role === 'admin' && (
                <TabsContent
                  value="privileges"
                  className="mt-0"
                >
                  <AdminPrivileges
                    selectedPermissions={editForm.permissions}
                    onChange={(perms) => setEditForm({ ...editForm, permissions: perms })}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>

          <DialogFooter className="border-t border-border p-6 bg-muted/5">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="px-6 h-10 font-bold tracking-tight hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              variant="highlight"
              disabled={processing}
              className="px-8 h-10 font-bold tracking-tight shadow-md"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Please enter your administrator password to confirm these changes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-pass">Admin Password</Label>
              <Input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={processing || !adminPassword}
            >
              {processing ? 'Verifying...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
