import QueueLineTable from '@/components/dashboard/queue-line-table'
import Heading from '@/components/heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import axios from 'axios'
import { Eye, Loader2, UserPlus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

axios.defaults.withCredentials = true

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Registry', href: '/registry' }]

interface Service {
  service_id: number
  service_name: string
  price: number | string
}

interface ServiceVariant {
  service_variant: number
  service_id: number
  service_name: string
  size: string
  price: number | string
  estimated_duration: number
  service?: Service
}

interface ServiceOrderDetail {
  service_order_detail_id: number
  service_variant: number
  serviceVariant?: ServiceVariant
  service?: Service
}

interface Customer {
  user_id: number
  first_name: string
  last_name: string
}

interface ServiceOrder {
  service_order_id: number
  user_id: number
  bay_id: number
  status: string
  employee_id?: number
  user?: Customer
  employee?: Employee
  details?: ServiceOrderDetail[]
}

interface Bay {
  bay_id: number
  bay_number: number
  status: 'available' | 'occupied' | 'maintenance'
  bay_type: 'Normal' | 'Underwash'
  created_at?: string
  updated_at?: string
}

interface Employee {
  employee_id: number
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
  status?: string
  assigned_status?: string
}

// Props from AdminController
interface RegistryProps {
  initialBays: Bay[]
  initialActiveOrders: ServiceOrder[]
  initialEmployees: Employee[]
}

export default function Registry({
  initialBays,
  initialActiveOrders,
  initialEmployees,
}: RegistryProps) {
  const [bays, setBays] = useState<Bay[]>(initialBays)
  const [serviceOrders, setServiceOrders] = useState<Map<number, ServiceOrder>>(new Map())
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>(initialEmployees)
  const [loading, setLoading] = useState(false)
  const { hasPermission } = usePermissions()

  // Dialog State
  const [selectedBayForService, setSelectedBayForService] = useState<Bay | null>(null)
  const [showStartServiceDialog, setShowStartServiceDialog] = useState(false)
  const [isQueueDialog, setIsQueueDialog] = useState(false)
  const [startServiceStep, setStartServiceStep] = useState<
    'initial' | 'booking' | 'walk-in' | 'assign' | 'queue-overview' | 'select-bay'
  >('initial')
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const [selectedBayForReassignment, setSelectedBayForReassignment] = useState<number | null>(null)
  const [selectedReassignEmployeeId, setSelectedReassignEmployeeId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  const isAllBaysFull = bays.length > 0 && bays.every((bay) => bay.status !== 'available')

  useEffect(() => {
    // Map initial orders
    const ordersMap = new Map()
    initialActiveOrders.forEach((order) => {
      if (order.bay_id) {
        ordersMap.set(order.bay_id, order)
      }
    })
    setServiceOrders(ordersMap)

    // Check URL parameters for success messages
    const params = new URLSearchParams(window.location.search)

    if (params.get('action') === 'add-queue') {
      handleAddQueue()
      window.history.replaceState({}, '', '/registry')
    }

    if (params.get('serviceStarted') === 'true') {
      toast.success('Service started successfully!')
      window.history.replaceState({}, '', '/registry')
    }
    if (params.get('queueAdded') === 'true') {
      toast.success('Successfully added to queue!')
      window.history.replaceState({}, '', '/registry')
    }
    if (params.get('paymentCompleted') === 'true') {
      toast.success('Payment completed successfully!')
      window.history.replaceState({}, '', '/registry')
    }

    // Refresh service orders every 3 minutes (Polling)
    const interval = setInterval(() => {
      loadServiceOrders()
    }, 180000)

    return () => clearInterval(interval)
  }, [])

  // Filter employees logic...
  useEffect(() => {
    const assignedEmployeeIds = new Set<number>()
    serviceOrders.forEach((order) => {
      if (order.employee_id) {
        assignedEmployeeIds.add(order.employee_id)
      }
    })
    const filtered = employees.filter((employee) => !assignedEmployeeIds.has(employee.employee_id))
    setAvailableEmployees(filtered)
  }, [employees, serviceOrders])

  const loadBays = async () => {
    // Keep for manual refresh if needed, but not on mount
    try {
      const res = await axios.get('/api/bays/list')
      setBays(res.data)
    } catch (err) {
      console.error('Failed to fetch bays:', err)
    }
  }

  const loadServiceOrders = async () => {
    try {
      const res = await axios.get('/api/service-orders/active')
      const ordersMap = new Map()
      res.data.forEach((order: ServiceOrder) => {
        if (order.bay_id) {
          ordersMap.set(order.bay_id, order)
        }
      })
      setServiceOrders(ordersMap)
    } catch (err) {
      console.error('Failed to fetch service orders:', err)
    }
  }

  const loadEmployees = async () => {
    // Keep for refresh
    try {
      const res = await axios.get('/api/employees/active-available')
      setEmployees(res.data)
    } catch (err) {
      console.error('Failed to fetch employees:', err)
    }
  }

  const getOrderTotal = (order: ServiceOrder | undefined) => {
    if (!order?.details) return 0
    return order.details.reduce((sum, detail: any) => {
      // Try to get price from serviceVariant first (camelCase or snake_case), fallback to service
      const priceSource = detail.serviceVariant || detail.service_variant || detail.service
      if (!priceSource) return sum

      const price =
        typeof priceSource.price === 'string'
          ? parseInt(priceSource.price)
          : (priceSource.price as number)
      return sum + price
    }, 0)
  }
  const handleStartService = (bay: Bay) => {
    setSelectedBayForService(bay)
    setIsQueueDialog(false)
    setSelectedEmployeeId('')
    setStartServiceStep('initial')
    setShowStartServiceDialog(true)
    // Pre-fetch bookings silently
    axios
      .get('/api/service-orders/today-bookings')
      .then((res) => setTodayBookings(res.data || []))
      .catch((err) => console.error('Failed to fetch bookings:', err))
  }

  const handleAddQueue = () => {
    setSelectedBayForService(null)
    setIsQueueDialog(true)
    setSelectedEmployeeId('')
    setStartServiceStep('initial')
    setShowStartServiceDialog(true)
    // Pre-fetch bookings silently
    axios
      .get('/api/service-orders/today-bookings')
      .then((res) => setTodayBookings(res.data || []))
      .catch((err) => console.error('Failed to fetch bookings:', err))
  }

  const handleViewQueue = () => {
    setSelectedBayForService(null)
    setIsQueueDialog(true)
    setSelectedEmployeeId('')
    setStartServiceStep('queue-overview')
    setShowStartServiceDialog(true)
  }

  const handleSelectBooking = async (booking: any) => {
    if (isQueueDialog) {
      setIsAssigning(true)
      try {
        await axios.post('/api/queues/reservation', {
          service_order_id: booking.service_order_id,
        })
        toast.success('Reservation added to queue!')
        setShowStartServiceDialog(false)
        setIsQueueDialog(false)
        setSelectedBooking(null)
        await Promise.all([loadBays(), loadServiceOrders()])
      } catch (error) {
        console.error('Failed to add reservation to queue:', error)
        toast.error('Failed to process request')
      } finally {
        setIsAssigning(false)
      }
    } else {
      setSelectedBooking(booking)
      setStartServiceStep('assign')
      setSelectedEmployeeId('') // Reset selection
    }
  }

  const handleWalkIn = () => {
    if (isQueueDialog) {
      router.visit('/registry/queue/select-services')
    } else {
      setStartServiceStep('walk-in')
      setSelectedBooking(null)
      setSelectedEmployeeId('') // Reset selection
    }
  }

  const handleProceedWithEmployee = async () => {
    if ((!selectedBayForService && !isQueueDialog) || !selectedEmployeeId) return

    // Safety check for regular bay service start
    if (!isQueueDialog && (!selectedBayForService || !selectedBayForService.bay_id)) return

    const employee = employees.find((e) => e.employee_id === parseInt(selectedEmployeeId))
    if (!employee) return

    // Walk-in Flow: Go to Select Services
    if (startServiceStep === 'walk-in') {
      const employeeData = JSON.stringify({
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
      })

      const url = `/registry/${selectedBayForService!.bay_id}/select-services?employee=${encodeURIComponent(employeeData)}`

      router.visit(url)
      return
    }

    // Booking Flow: Assign and Start
    if (selectedBooking) {
      setIsAssigning(true)
      try {
        let variantIds: number[] = []
        if (selectedBooking.variant_ids) {
          if (typeof selectedBooking.variant_ids === 'string') {
            variantIds = selectedBooking.variant_ids.split(',').map(Number)
          } else if (Array.isArray(selectedBooking.variant_ids)) {
            variantIds = selectedBooking.variant_ids.map(Number)
          }
        }

        // If no variant_ids, fallback to service_ids (for legacy or fallback)
        const payload: any = {
          bay_id: selectedBayForService!.bay_id,
          employee_id: employee.employee_id,
          status: 'in_progress',
        }

        if (variantIds.length > 0) {
          payload.variant_ids = variantIds
        } else {
          let serviceIds: number[] = []
          if (typeof selectedBooking.service_ids === 'string') {
            serviceIds = selectedBooking.service_ids.split(',').map(Number)
          } else if (Array.isArray(selectedBooking.service_ids)) {
            serviceIds = selectedBooking.service_ids.map(Number)
          }
          payload.service_ids = serviceIds
        }

        await axios.put(`/service-orders/${selectedBooking.service_order_id}`, payload)
        toast.success('Service started successfully!')

        // Reset and Refresh
        setShowStartServiceDialog(false)
        setSelectedBayForService(null)
        setIsQueueDialog(false)
        setSelectedEmployeeId('')
        setSelectedBooking(null)

        await Promise.all([loadBays(), loadServiceOrders()])
      } catch (error) {
        console.error('Failed to start service/queue:', error)
        toast.error('Failed to process request')
      } finally {
        setIsAssigning(false)
      }
    }
  }

  const handleEditService = (bayId: number) => {
    const order = serviceOrders.get(bayId)
    if (order) {
      const orderData = JSON.stringify({
        service_order_id: order.service_order_id,
        user_id: order.user_id,
        bay_id: order.bay_id,
        status: order.status,
        employee_id: order.employee_id,
        user: order.user,
        employee: order.employee,
        details: order.details,
      })

      router.visit(
        `/registry/${bayId}/select-services?order=${encodeURIComponent(orderData)}&editing=true`,
        {
          preserveState: true,
          preserveScroll: true,
        },
      )
    }
  }

  const handleFinish = (bayId: number) => {
    const order = serviceOrders.get(bayId)
    if (order) {
      // Serialize the order data to pass through route
      const orderData = JSON.stringify({
        service_order_id: order.service_order_id,
        user_id: order.user_id,
        bay_id: order.bay_id,
        status: order.status,
        user: order.user,
        details: order.details,
      })

      router.visit(`/registry/${bayId}/payment?order=${encodeURIComponent(orderData)}`, {
        preserveState: true,
        preserveScroll: true,
      })
    }
  }

  const handleAssignEmployee = async (bayId: number) => {
    if (!selectedReassignEmployeeId) {
      return
    }

    setIsAssigning(true)
    try {
      const order = serviceOrders.get(bayId)
      if (!order) return

      await axios.put(`/service-orders/${order.service_order_id}/assign-employee`, {
        employee_id: parseInt(selectedReassignEmployeeId),
      })

      // Reset state and reload
      setSelectedBayForReassignment(null)
      setSelectedReassignEmployeeId('')
      await loadServiceOrders()
      await loadEmployees()
      toast.success('Employee assigned successfully!')
    } catch (err) {
      console.error('Failed to assign employee:', err)
      toast.error('Failed to assign employee')
    } finally {
      setIsAssigning(false)
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Registry" />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
          <Heading
            title="Registry"
            description="Manage and monitor bays for carwash services"
          />

          {hasPermission('view_queue') && (
            <Button
              variant="highlight"
              size="lg"
              className="ml-auto flex items-center gap-2"
              onClick={handleViewQueue}
            >
              <Eye className="h-5 w-5" />
              View Queue
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading bays...</div>
        ) : bays.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">No bays found.</div>
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
                      'cursor-pointer border-green-200/50 bg-green-50/30 hover:border-green-300/70 dark:border-green-900/50 dark:bg-green-950/20 dark:hover:border-green-800/70',
                    isOccupied &&
                      'border-orange-200/50 bg-orange-50/40 dark:border-orange-900/50 dark:bg-orange-950/30',
                    isMaintenance &&
                      'border-red-200/50 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/30',
                  )}
                  onClick={() =>
                    isAvailable && hasPermission('start_service') && handleStartService(bay)
                  }
                >
                  {/* Status accent border */}
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 h-1 transition-all duration-500',
                      isAvailable && 'bg-linear-to-r from-green-400 to-emerald-500',
                      isOccupied && 'bg-linear-to-r from-orange-400 to-amber-500',
                      isMaintenance && 'bg-linear-to-r from-red-500 to-rose-600',
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

                    {/* Service Order Details - Shown when occupied */}
                    {bay.status === 'occupied' &&
                      (() => {
                        const order = serviceOrders.get(bay.bay_id)
                        console.log(`Bay ${bay.bay_id} order:`, order)
                        if (!order) {
                          console.log(`No order found for bay ${bay.bay_id}`)
                          return null
                        }
                        const total = getOrderTotal(order)

                        return (
                          <div className="mt-4 space-y-3 text-sm">
                            {/* Customer Name */}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">
                                Customer:
                              </p>
                              <p className="font-medium text-foreground">
                                {order.user?.first_name} {order.user?.last_name}
                              </p>
                            </div>

                            {/* Services List */}
                            {order.details && order.details.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Services:
                                </p>
                                <ul className="ml-4 space-y-1">
                                  {order.details.map((detail: any) => {
                                    console.log('Detail object:', detail)
                                    console.log('detail.serviceVariant:', detail.serviceVariant)
                                    console.log('detail.service_variant:', detail.service_variant)

                                    // Handle both snake_case and camelCase
                                    const serviceData =
                                      detail.serviceVariant ||
                                      detail.service_variant ||
                                      detail.service
                                    console.log('serviceData:', serviceData)

                                    if (!serviceData) {
                                      console.log('No service data found for detail:', detail)
                                      return null
                                    }

                                    return (
                                      <li
                                        key={detail.service_order_detail_id}
                                        className="text-foreground"
                                      >
                                        <span className="font-medium">
                                          {serviceData.service_name}
                                        </span>
                                        {(detail.serviceVariant || detail.service_variant) && (
                                          <>
                                            <span className="text-muted-foreground">
                                              {' '}
                                              -{' '}
                                              {
                                                (detail.serviceVariant || detail.service_variant)
                                                  .size
                                              }
                                            </span>
                                            <span className="ml-2 font-semibold">
                                              ₱
                                              {typeof (
                                                detail.serviceVariant || detail.service_variant
                                              ).price === 'string'
                                                ? parseInt(
                                                    (
                                                      detail.serviceVariant ||
                                                      detail.service_variant
                                                    ).price,
                                                  )
                                                : (detail.serviceVariant || detail.service_variant)
                                                    .price}
                                            </span>
                                          </>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}

                            {/* Total Amount */}
                            <div className="border-t border-border pt-2">
                              <p className="text-xs font-semibold text-muted-foreground">
                                Total Amount:
                              </p>
                              <p className="text-lg font-bold text-foreground">
                                ₱{total.toLocaleString()}
                              </p>
                            </div>

                            {/* Assigned Employee */}
                            <div className="border-t border-border pt-4">
                              {selectedBayForReassignment === bay.bay_id ? (
                                <div className="space-y-3 rounded-xl border border-highlight/20 bg-highlight/5 p-3 duration-300 animate-in fade-in slide-in-from-top-2">
                                  <div className="flex items-center justify-between">
                                    <Label
                                      htmlFor={`reassign-employee-${bay.bay_id}`}
                                      className="flex items-center gap-2 text-xs font-bold tracking-wider text-highlight uppercase"
                                    >
                                      <UserPlus className="h-3 w-3" />
                                      New Assignment
                                    </Label>
                                    <Button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setSelectedBayForReassignment(null)
                                        setSelectedReassignEmployeeId('')
                                      }}
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full text-highlight hover:bg-highlight/10"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  <Select
                                    value={selectedReassignEmployeeId}
                                    onValueChange={setSelectedReassignEmployeeId}
                                  >
                                    <SelectTrigger
                                      id={`reassign-employee-${bay.bay_id}`}
                                      className="h-10 border-highlight/20 bg-background text-sm ring-offset-background focus:ring-1 focus:ring-highlight"
                                    >
                                      <SelectValue placeholder="Select staff..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableEmployees.map((employee) => (
                                        <SelectItem
                                          key={employee.employee_id}
                                          value={employee.employee_id.toString()}
                                        >
                                          {employee.first_name} {employee.last_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    onClick={() => handleAssignEmployee(bay.bay_id)}
                                    disabled={!selectedReassignEmployeeId || isAssigning}
                                    size="sm"
                                    variant="highlight"
                                    className="w-full"
                                  >
                                    {isAssigning ? (
                                      <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Assigning...
                                      </>
                                    ) : (
                                      'Confirm Assignment'
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Assigned Staff:
                                  </p>
                                  <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5 transition-colors hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-highlight/10 text-xs font-bold text-highlight">
                                        {order.employee
                                          ? `${order.employee.first_name[0]}${order.employee.last_name[0]}`
                                          : '?'}
                                      </div>
                                      <p className="font-semibold text-foreground">
                                        {order.employee
                                          ? `${order.employee.first_name} ${order.employee.last_name}`
                                          : 'Not assigned'}
                                      </p>
                                    </div>
                                    <Button
                                      onClick={() => setSelectedBayForReassignment(bay.bay_id)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 gap-2 text-highlight hover:bg-highlight/10 hover:text-highlight"
                                    >
                                      <UserPlus className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Change</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                    {/* Action Buttons */}
                    {isAvailable && (
                      <>
                        {/* Old Inline Select Employee Logic Removed */}
                        <div className="mt-6">
                          {hasPermission('start_service') && (
                            <Button
                              onClick={() => handleStartService(bay)}
                              variant="highlight"
                              className="h-11 w-full font-medium"
                            >
                              Start Service
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                    {isOccupied && (
                      <div className="mt-6 space-y-2">
                        <Button
                          onClick={() => handleEditService(bay.bay_id)}
                          variant="outline"
                          className="h-11 w-full font-medium"
                        >
                          Edit Service
                        </Button>
                        <Button
                          onClick={() => handleFinish(bay.bay_id)}
                          variant="highlight"
                          className="h-11 w-full font-medium"
                        >
                          Finish Service
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Start Service Dialog */}
      {showStartServiceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-2xl transform rounded-xl border border-border bg-background p-6 shadow-2xl">
            <button
              onClick={() => setShowStartServiceDialog(false)}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted/50"
            >
              ✕
            </button>

            <h2 className="mb-6 text-2xl font-bold">
              {startServiceStep === 'initial' && (isQueueDialog ? 'Add to Queue' : 'Start Service')}
              {startServiceStep === 'walk-in' && 'Walk-in Service'}
              {startServiceStep === 'booking' && 'Select from Queue'}
              {startServiceStep === 'assign' && 'Assign Staff'}
              {startServiceStep === 'queue-overview' && 'Active Queue'}
              {startServiceStep === 'select-bay' && 'Select Available Bay'}
            </h2>

            {startServiceStep === 'initial' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setStartServiceStep('booking')
                    // Refresh bookings just in case
                    axios
                      .get('/api/service-orders/today-bookings')
                      .then((res) => setTodayBookings(res.data || []))
                  }}
                  className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-border p-8 transition-all hover:border-highlight hover:bg-muted/30"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    📅
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Reservations</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      For clients with prior booking
                    </p>
                  </div>
                </button>

                <button
                  onClick={handleWalkIn}
                  className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-border p-8 transition-all hover:border-highlight hover:bg-muted/30"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    🚶
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-bold">Walk-in Service</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Create new order now</p>
                  </div>
                </button>
              </div>
            )}

            {startServiceStep === 'booking' && (
              <div className="space-y-4">
                <div className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto">
                  {todayBookings.filter(b => !b.is_queued).length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground">No reservations found.</p>
                    </div>
                  ) : (
                    todayBookings
                      .filter((b) => !b.is_queued)
                      .map((booking) => (
                        <button
                          key={booking.service_order_id}
                          onClick={() => handleSelectBooking(booking)}
                          className="w-full rounded-lg border border-border p-4 text-left transition-all hover:border-highlight hover:bg-accent/5"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">
                                {booking.customer_name}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">{booking.services}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-highlight">
                                ₱{parseFloat(booking.total).toLocaleString()}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {new Date(booking.order_date).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            {(startServiceStep === 'walk-in' || startServiceStep === 'assign') && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Select Available Staff</Label>
                  <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3">
                    {availableEmployees.map((employee) => {
                      const isSelected = selectedEmployeeId === employee.employee_id.toString()
                      return (
                        <button
                          key={employee.employee_id}
                          onClick={() => setSelectedEmployeeId(employee.employee_id.toString())}
                          className={cn(
                            'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200',
                            isSelected
                              ? 'border-highlight bg-highlight/10'
                              : 'border-border hover:border-highlight/50 hover:bg-muted/50',
                          )}
                        >
                          <div
                            className={cn(
                              'mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold transition-colors',
                              isSelected
                                ? 'bg-highlight text-white'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {employee.first_name[0]}
                            {employee.last_name[0]}
                          </div>
                          <p className="w-full truncate text-center text-sm font-semibold">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Available</p>
                        </button>
                      )
                    })}
                    {availableEmployees.length === 0 && (
                      <div className="col-span-full py-8 text-center text-muted-foreground">
                        No employees available.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (startServiceStep === 'assign') {
                        if (selectedBooking && selectedBayForService) {
                          setStartServiceStep('select-bay')
                        } else {
                          setStartServiceStep('booking')
                        }
                      } else {
                        setStartServiceStep('initial')
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="highlight"
                    className="flex-1"
                    disabled={!selectedEmployeeId || isAssigning}
                    onClick={handleProceedWithEmployee}
                  >
                    {isAssigning
                      ? 'Starting...'
                      : startServiceStep === 'walk-in'
                        ? 'Continue'
                        : 'Start Service'}
                  </Button>
                </div>
              </div>
            )}

            {startServiceStep === 'queue-overview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <QueueLineTable
                    actionLabel="Assign to Bay"
                    onAction={(queue) => {
                      setSelectedBooking({
                        ...queue.service_order,
                        customer_name: `${queue.service_order.user.first_name} ${queue.service_order.user.last_name}`,
                        total: queue.service_order.details.reduce((sum: number, d: any) => sum + (parseFloat(d.serviceVariant?.price || d.service?.price || '0')), 0),
                        service_ids: queue.service_order.details.map((d: any) => d.service_id || d.serviceVariant?.service_id),
                        variant_ids: queue.service_order.details.map((d: any) => d.service_variant?.service_variant || d.service_variant || d.serviceVariant?.service_variant),
                      })
                      setStartServiceStep('select-bay')
                    }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowStartServiceDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="highlight"
                    onClick={() => setStartServiceStep('initial')}
                  >
                    Add to Queue
                  </Button>
                </div>
              </div>
            )}

            {startServiceStep === 'select-bay' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {bays
                    .filter((b) => b.status === 'available')
                    .map((bay) => (
                      <button
                        key={bay.bay_id}
                        onClick={() => {
                          setSelectedBayForService(bay)
                          setStartServiceStep('assign')
                        }}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-border p-6 transition-all hover:border-highlight hover:bg-muted/30"
                      >
                        <div className="mb-2 text-2xl font-bold text-highlight">
                          #{bay.bay_number}
                        </div>
                        <div className="text-xs text-muted-foreground">{bay.bay_type}</div>
                      </button>
                    ))}
                  {bays.filter((b) => b.status === 'available').length === 0 && (
                    <div className="col-span-full py-8 text-center text-muted-foreground">
                      No available bays.
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStartServiceStep('queue-overview')}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
