import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { type BreadcrumbItem } from '@/types'
import { Head, router } from '@inertiajs/react'
import axios from 'axios'
import { Clock, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface ServiceVariant {
  service_variant: number
  service_id: number
  service_name?: string
  size: string
  price: number | string
  estimated_duration: number
}

interface Service {
  service_id: number
  service_name: string
  category: string
  variants: ServiceVariant[]
  description?: string
}

interface ServiceOrderDetail {
  service_order_detail_id: number
  service_id: number
  service: Service
}

interface Customer {
  user_id: number
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
}

interface Props {
  bayId?: number
  bayNumber?: number
  isQueue?: boolean
}

export default function RegistrySelectServices({ bayId, bayNumber, isQueue }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Registry', href: '/registry' },
    { title: isQueue ? 'Queue' : `Bay #${bayNumber}`, href: '#' },
  ]

  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState<ServiceVariant[]>([])
  const [activeVariants, setActiveVariants] = useState<Record<number, number>>({})
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null)
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [assignedEmployee, setAssignedEmployee] = useState<{
    employee_id: number
    first_name: string
    last_name: string
  } | null>(null)
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [editingOrder, setEditingOrder] = useState<{
    service_order_id: number
    user_id: number
    bay_id: number
    status: string
    user?: Customer
    details?: ServiceOrderDetail[]
  } | null>(null)

  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [generatedNumber, setGeneratedNumber] = useState(
    Math.floor(10000 + Math.random() * 90000).toString(),
  )

  useEffect(() => {
    loadServices()
    loadCustomers()

    // Parse query parameters for employee assignment or editing
    const params = new URLSearchParams(window.location.search)
    const employeeParam = params.get('employee')
    const orderParam = params.get('order')
    const editingParam = params.get('editing')
    const bookingParam = params.get('booking')

    if (employeeParam) {
      try {
        const employeeData = JSON.parse(decodeURIComponent(employeeParam))
        setAssignedEmployee(employeeData)
      } catch (err) {
        console.error('Failed to parse employee data:', err)
      }
    }

    if (orderParam && editingParam === 'true') {
      try {
        const orderData = JSON.parse(decodeURIComponent(orderParam))
        setEditingOrder(orderData)
        setIsEditingMode(true)
        // Set the assigned employee from the order if available
        if (orderData.employee) {
          setAssignedEmployee({
            employee_id: orderData.employee.employee_id,
            first_name: orderData.employee.first_name,
            last_name: orderData.employee.last_name,
          })
        }
      } catch (err) {
        console.error('Failed to parse order data:', err)
      }
    }

    // Handle booking parameter for reservations
    if (bookingParam) {
      try {
        const bookingData = JSON.parse(decodeURIComponent(bookingParam))

        // Convert service_ids string to array of numbers
        let serviceIds: number[] = []
        if (typeof bookingData.service_ids === 'string') {
          serviceIds = bookingData.service_ids.split(',').map(Number)
        } else if (Array.isArray(bookingData.service_ids)) {
          serviceIds = bookingData.service_ids.map(Number)
        }

        // Store booking data to pre-populate customer and services
        setEditingOrder({
          service_order_id: bookingData.service_order_id,
          user_id: bookingData.user_id,
          bay_id: bayId || 0,
          status: 'pending',
          user: {
            user_id: bookingData.user_id,
            first_name: bookingData.first_name,
            last_name: bookingData.last_name,
            phone_number: bookingData.phone,
          },
          details: serviceIds.map((id: number, index: number) => ({
            service_order_detail_id: index,
            service_id: id,
            service: { service_id: id, service_name: '', category: '', variants: [] },
          })),
        })
        setIsEditingMode(true) // Use editing mode to skip customer selection
      } catch (err) {
        console.error('Failed to parse booking data:', err)
      }
    }
  }, [])

  // Load existing service order for this bay (for editing)
  useEffect(() => {
    // Only load existing order after services are loaded
    if (services.length === 0 || isQueue) {
      console.log('Waiting for services to load or isQueue is true')
      return
    }

    const loadExistingOrder = async () => {
      try {
        console.log('Loading existing order for bay:', bayId)
        const res = await axios.get('/api/service-orders/active')
        const orders = res.data

        console.log('All active orders:', orders)

        // Find the order for this bay
        const existingOrder = orders.find((order: any) => order.bay_id === bayId)

        if (existingOrder) {
          console.log('Found existing order for bay:', existingOrder)
          console.log('Order details:', existingOrder.details)
          setEditingOrder(existingOrder)
          setIsEditingMode(true)

          // Set the assigned employee if available
          if (existingOrder.employee) {
            setAssignedEmployee({
              employee_id: existingOrder.employee.employee_id,
              first_name: existingOrder.employee.first_name,
              last_name: existingOrder.employee.last_name,
            })
          }
        } else {
          console.log('No existing order found for bay:', bayId)
        }
      } catch (err) {
        console.error('Failed to load existing order:', err)
      }
    }

    loadExistingOrder()
  }, [bayId, services])

  useEffect(() => {
    if (customerSearch.trim()) {
      const search = customerSearch.toLowerCase()
      const filtered = customers.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(search) ||
          c.phone_number?.includes(customerSearch),
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [customerSearch, customers])

  useEffect(() => {
    // Pre-populate services when editing existing order
    if (isEditingMode && editingOrder?.details && services.length > 0) {
      console.log('Pre-populating services for editing:', editingOrder.details)

      // Extract variant IDs from order details
      const existingVariantIds = editingOrder.details
        .map((d: any) => {
          const id = d.service_variant || d.serviceVariant
          // Handle nested serviceVariant object if it exists (snake_case)
          if (typeof id === 'object' && id !== null && 'service_variant' in id) {
            return id.service_variant
          }
          // Handle nested serviceVariant object if it exists (camelCase)
          if (typeof id === 'object' && id !== null && 'serviceVariant' in id) {
            return id.serviceVariant
          }
          // Handle direct object (e.g. from eager load)
          if (typeof id === 'object' && id !== null && typeof id.service_variant === 'number') {
            return id.service_variant
          }
          return id
        })
        .filter(Boolean)

      console.log('Extracted existing variant IDs:', existingVariantIds)

      // Find matching variants from all services
      const matchingVariants: ServiceVariant[] = []
      services.forEach((service) => {
        service.variants.forEach((variant) => {
          // Compare as numbers to avoid string/number mismatch
          // Check against the extracted array
          if (
            existingVariantIds.some((id: any) => Number(id) === Number(variant.service_variant))
          ) {
            matchingVariants.push({
              ...variant,
              service_name: service.service_name,
            })
          }
        })
      })

      console.log('Matching variants found:', matchingVariants)

      if (matchingVariants.length > 0) {
        setSelectedServices(matchingVariants)

        // Populate activeVariants for UI state (e.g. modal selections)
        const active: Record<number, number> = {}
        matchingVariants.forEach((v) => {
          active[v.service_id] = v.service_variant
        })
        setActiveVariants((prev) => ({ ...prev, ...active }))
        console.log('Updated activeVariants:', active)
      } else {
        console.warn('No matching variants found. Services loaded:', services.length)
      }
    } else {
      // Load from localStorage if not editing
      const saved = localStorage.getItem('registry_selected_services')
      if (saved && !isEditingMode) {
        try {
          // We need to verify if the saved services are still valid variants
          // For simplicity, we just load them for now, but in a real app we might validate against 'services'
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedServices(parsed)
          }
        } catch (e) {
          console.error('Failed to load saved services from storage', e)
        }
      }
    }
  }, [isEditingMode, editingOrder, services])

  // Save to localStorage when changed
  useEffect(() => {
    if (!isEditingMode && selectedServices.length > 0) {
      localStorage.setItem('registry_selected_services', JSON.stringify(selectedServices))
    }
  }, [selectedServices, isEditingMode])

  const loadServices = async () => {
    try {
      const res = await axios.get('/api/services/list')
      setServices(res.data)
    } catch (err) {
      console.error('Failed to fetch services:', err)
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await axios.get('/api/customers/list')
      setCustomers(res.data)
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (variant: ServiceVariant) => {
    setSelectedServices((prev) => {
      const exists = prev.some((v) => v.service_variant === variant.service_variant)
      if (exists) {
        return prev.filter((v) => v.service_variant !== variant.service_variant)
      } else {
        // Enrich variant with service_name if not present
        const enrichedVariant = {
          ...variant,
          service_name: variant.service_name || selectedServiceForModal?.service_name || '',
        }
        return [...prev, enrichedVariant]
      }
    })
  }

  const isVariantSelected = (variantId: number) =>
    selectedServices.some((v) => v.service_variant === variantId)

  const isServiceSelected = (serviceId: number) =>
    selectedServices.some((v) => v.service_id === serviceId)

  const getTotalPrice = () =>
    selectedServices.reduce(
      (sum, variant) =>
        sum + (typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price),
      0,
    )

  const handleProceedToCustomer = () => {
    if (selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }

    // If editing, skip customer selection and proceed directly
    if (isEditingMode && editingOrder?.user_id) {
      proceedToPayment(editingOrder.user as Customer)
      return
    }

    setShowCustomerModal(true)
    setError('')
  }

  const handleSelectExistingCustomer = (customer: Customer) => {
    proceedToPayment(customer)
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.first_name.trim() || !newCustomerForm.last_name.trim()) {
      setError('First name and last name are required')
      return
    }

    try {
      setSubmitting(true)

      // Use provided email or generate temporary one
      let finalEmail = newCustomerForm.email.trim()

      if (!finalEmail) {
        // Generate temporary email only if user didn't provide one
        const firstName = newCustomerForm.first_name.toLowerCase().trim().replace(/\s+/g, '')
        const lastName = newCustomerForm.last_name.toLowerCase().trim().replace(/\s+/g, '')
        finalEmail = `${firstName}.${lastName}.${generatedNumber}@gearhead-temp.com`
      }

      // Generate password with spaces removed from names
      const lastNameNoSpaces = newCustomerForm.last_name.replace(/\s+/g, '')
      const firstNameNoSpaces = newCustomerForm.first_name.replace(/\s+/g, '')
      const generatedPassword = `${lastNameNoSpaces}${firstNameNoSpaces}${generatedNumber}`

      const res = await axios.post('/api/customers/create', {
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        phone_number: newCustomerForm.phone_number || null,
        address: newCustomerForm.address || null,
        email: finalEmail,
        password: generatedPassword,
      })

      const newCustomer: Customer = res.data
      setError('')
      proceedToPayment(newCustomer)
    } catch (err) {
      console.error('Failed to create customer:', err)
      setError('Failed to create customer')
    } finally {
      setSubmitting(false)
    }
  }

  const proceedToPayment = async (customer: Customer) => {
    if (selectedServices.length === 0) return

    try {
      setSubmitting(true)
      const serviceIds = selectedServices.map((v) => v.service_id)
      const variantIds = selectedServices.map((v) => v.service_variant)

      if (isEditingMode && editingOrder?.service_order_id) {
        // Update existing service order
        console.log('Updating service order:', editingOrder.service_order_id)

        await axios.put(`/service-orders/${editingOrder.service_order_id}`, {
          service_ids: serviceIds,
          variant_ids: variantIds, // Pass variant IDs too
          employee_id: assignedEmployee?.employee_id || null,
        })

        console.log('Service order updated')
      } else {
        // Create new service order
        console.log('Creating service order for customer:', customer)
        console.log('Customer ID:', customer.user_id)
        console.log('Customer Name:', `${customer.first_name} ${customer.last_name}`)

        // Generate an idempotency key
        const idempotencyKey =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        console.log('Using Idempotency Key:', idempotencyKey)

        // Create the service order and assign to bay or queue
        const endpoint = isQueue ? '/api/queues/walk-in' : '/api/service-orders/registry'
        const payload = {
          customer_id: customer.user_id,
          service_ids: serviceIds,
          variant_ids: variantIds, // Pass variant IDs too
          employee_id: assignedEmployee?.employee_id || null,
          idempotency_key: idempotencyKey,
        }

        if (!isQueue) {
          Object.assign(payload, { bay_id: bayId })
        }

        const response = await axios.post(endpoint, payload)

        console.log('Service order created:', response.data)
      }

      // Clear localStorage on success
      localStorage.removeItem('registry_selected_services')

      // Navigate to registry after successful creation/update
      const routeUrl = isQueue ? '/registry?queueAdded=true' : '/registry?serviceStarted=true'
      router.visit(routeUrl, {
        preserveState: false,
        preserveScroll: false,
      })
    } catch (err) {
      console.error('Failed to process service order:', err)
      setError('Failed to process service order. Please try again.')
      setSubmitting(false)
    }
  }

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      // First sort by category alphabetically
      const categoryCompare = (a.category || '').localeCompare(b.category || '')
      if (categoryCompare !== 0) {
        return categoryCompare
      }

      // Then sort by service name
      return a.service_name.localeCompare(b.service_name)
    })
  }, [services])

  const categories = useMemo(() => {
    return [...new Set(services.map((s) => s.category))].sort()
  }, [services])

  const filteredServices = useMemo(() => {
    let filtered = sortedServices

    // Filter by search term
    if (serviceSearch.trim()) {
      const search = serviceSearch.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.service_name.toLowerCase().includes(search) ||
          s.category.toLowerCase().includes(search) ||
          s.variants.some((v) => v.size.toLowerCase().includes(search)),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory)
    }

    return filtered
  }, [sortedServices, serviceSearch, selectedCategory])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head
        title={`${isEditingMode ? 'Edit' : 'Select'} Services - ${isQueue ? 'Queue' : `Bay #${bayNumber}`}`}
      />
      <div className="flex flex-col gap-6 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditingMode ? 'Edit' : 'Select'} Services for{' '}
            {isQueue ? 'Queue' : `Bay #${bayNumber}`}
          </h1>
          <div className="mt-2 space-y-1">
            <p className="text-muted-foreground">
              {isEditingMode
                ? 'Update services for this order'
                : 'Choose services for this carwash order'}
            </p>
            {assignedEmployee && (
              <p className="text-sm font-medium text-yellow-400 black:text-highlight">
                Assigned Employee: {assignedEmployee.first_name} {assignedEmployee.last_name}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading services...</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Services Grid */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {/* Search and Filter Bar */}
                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  {/* Search Input */}
                  <div>
                    <Label
                      htmlFor="service-search"
                      className="mb-2 block"
                    >
                      Search Services
                    </Label>
                    <div className="relative">
                      <Search className="absolute top-3 left-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="service-search"
                        type="text"
                        placeholder="Search by name, category, or size..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Label className="mb-2 block">Filter by Category</Label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                          !selectedCategory
                            ? 'bg-highlight text-black'
                            : 'border border-border bg-muted hover:border-highlight',
                        )}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() =>
                            setSelectedCategory(selectedCategory === category ? '' : category)
                          }
                          className={cn(
                            'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                            selectedCategory === category
                              ? 'bg-highlight text-black'
                              : 'border border-border bg-muted hover:border-highlight',
                          )}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                      Showing{' '}
                      <span className="font-semibold text-foreground">
                        {filteredServices.length}
                      </span>{' '}
                      {filteredServices.length === 1 ? 'service' : 'services'}
                    </p>
                    {(serviceSearch || selectedCategory) && (
                      <button
                        onClick={() => {
                          setServiceSearch('')
                          setSelectedCategory('')
                        }}
                        className="text-highlight hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Services Grid */}
                {filteredServices.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No services found matching your criteria
                    </p>
                  </div>
                ) : (
                  <div className="custom-scrollbar h-[50vh] space-y-4 overflow-y-auto">
                    {categories.map((category) => {
                      const categoryServices = filteredServices.filter(
                        (s) => s.category === category,
                      )
                      if (categoryServices.length === 0) return null
                      return (
                        <div key={category}>
                          <h3 className="mb-3 text-lg font-semibold">{category}</h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {categoryServices.map((service) => (
                              <div
                                key={service.service_id}
                                className={cn(
                                  'flex flex-col justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-200',
                                  isServiceSelected(service.service_id)
                                    ? 'border-highlight bg-highlight/10'
                                    : 'border-border/50 hover:border-border',
                                )}
                              >
                                <div>
                                  <div className="flex items-start justify-between">
                                    <p className="text-lg font-semibold text-foreground">
                                      {service.service_name}
                                    </p>
                                    <div
                                      className={cn(
                                        'h-5 w-5 rounded border-2 transition-all',
                                        isServiceSelected(service.service_id)
                                          ? 'border-highlight bg-highlight'
                                          : 'border-border',
                                      )}
                                    />
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                    {service.description}
                                  </p>
                                </div>

                                <div className="mt-2">
                                  <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {service.variants.length > 0
                                          ? `${Math.min(...service.variants.map((v) => v.estimated_duration))}-${Math.max(...service.variants.map((v) => v.estimated_duration))} mins`
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <p className="font-bold">
                                      {service.variants.length > 0
                                        ? `Starts at ₱${Math.min(...service.variants.map((v) => Number(v.price))).toLocaleString()}`
                                        : 'N/A'}
                                    </p>
                                  </div>

                                  <Button
                                    variant="highlight"
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedServiceForModal(service)
                                      setIsVariantModalOpen(true)
                                    }}
                                  >
                                    Select Size
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="sticky top-4 h-fit">
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services Selected</span>
                    <span className="font-semibold">{selectedServices.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span className="font-semibold">
                      {selectedServices.reduce((sum, s) => sum + s.estimated_duration, 0)} min
                    </span>
                  </div>
                </div>

                <div className="mb-6 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-yellow-400 black:text-highlight">Total Amount</span>
                    <p className="text-2xl font-bold text-yellow-400 black:text-highlight">
                      ₱{getTotalPrice().toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <>
                    <div className="custom-scrollbar mb-4 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-muted/50 p-3">
                      {selectedServices.map((service) => (
                        <div
                          key={service.service_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="font-medium text-foreground">{service.service_name}</p>
                            <p className="text-xs text-muted-foreground">{service.size}</p>
                          </div>
                          <p className="font-semibold">₱{service.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="highlight"
                      className="w-full"
                      onClick={handleProceedToCustomer}
                    >
                      {isEditingMode ? 'Update Services' : 'Proceed to Customer'}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => router.visit('/registry')}
                >
                  Back to Registry
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl transform overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 rounded-full p-2 transition-colors duration-200 hover:bg-muted/50"
              onClick={() => {
                setShowCustomerModal(false)
                setIsNewCustomer(false)
                setCustomerSearch('')
                setNewCustomerForm({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone_number: '',
                  address: '',
                })
              }}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {!isNewCustomer ? (
              <>
                <h2 className="mb-6 text-2xl font-bold">Select Customer</h2>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20">
                    {error}
                  </div>
                )}

                {/* Customer Search */}
                <div className="mb-6">
                  <Label className="mb-2 block">Search Customer</Label>
                  <Input
                    type="text"
                    placeholder="Enter name or phone number..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="mb-3"
                  />

                  {/* Filtered Customers List */}
                  {customerSearch.trim() && (
                    <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-border/50">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.user_id}
                            onClick={() => handleSelectExistingCustomer(customer)}
                            className="w-full border-b border-border/50 p-3 text-left transition-colors duration-200 last:border-0 hover:bg-muted/50"
                          >
                            <p className="font-medium text-foreground">
                              {customer.first_name} {customer.last_name}
                            </p>
                            {customer.phone_number && (
                              <p className="text-sm text-muted-foreground">
                                {customer.phone_number}
                              </p>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No customers found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Or Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Create New Customer Button */}
                <Button
                  variant="outline"
                  onClick={() => setIsNewCustomer(true)}
                  className="w-full"
                >
                  Create New Customer
                </Button>
              </>
            ) : (
              <>
                <h2 className="mb-6 text-2xl font-bold">
                  Create <span className="text-yellow-400">New Customer</span>
                </h2>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20">
                    {error}
                  </div>
                )}

                {/* New Customer Form */}
                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <Label className="mb-2 block">First Name *</Label>
                    <Input
                      type="text"
                      placeholder="Enter first name"
                      value={newCustomerForm.first_name}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          first_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label className="mb-2 block">Last Name *</Label>
                    <Input
                      type="text"
                      placeholder="Enter last name"
                      value={newCustomerForm.last_name}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          last_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="mb-2 block">Email (Optional)</Label>
                    <Input
                      type="email"
                      placeholder="Leave blank for auto-generated email"
                      value={newCustomerForm.email}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label className="mb-2 block">Phone Number (Optional)</Label>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={newCustomerForm.phone_number}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          phone_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="mb-2 block">Address (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="Enter address"
                      value={newCustomerForm.address}
                      onChange={(e) =>
                        setNewCustomerForm({
                          ...newCustomerForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Info */}
                  <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-600 dark:bg-blue-950/20">
                    <p className="mb-2">A temporary account will be created with:</p>
                    <ul className="space-y-1">
                      {!newCustomerForm.email.trim() && (
                        <li>
                          <strong>Email:</strong>{' '}
                          <code className="font-mono">
                            {newCustomerForm.first_name && newCustomerForm.last_name
                              ? `${newCustomerForm.first_name.toLowerCase().trim().replace(/\s+/g, '')}.${newCustomerForm.last_name.toLowerCase().trim().replace(/\s+/g, '')}.${generatedNumber}@gearhead-temp.com`
                              : `firstname.lastname.${generatedNumber}@gearhead-temp.com`}
                          </code>
                        </li>
                      )}
                      <li>
                        <strong>Password:</strong>{' '}
                        <code className="font-mono font-semibold">
                          {newCustomerForm.last_name.replace(/\s+/g, '')}
                          {newCustomerForm.first_name.replace(/\s+/g, '')}
                          {generatedNumber}
                        </code>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsNewCustomer(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="highlight"
                    onClick={handleCreateCustomer}
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Creating...' : 'Create & Continue'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Variant Selection Modal */}
      {isVariantModalOpen && selectedServiceForModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsVariantModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-background p-6 shadow-2xl animate-in slide-in-from-bottom-5 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedServiceForModal.service_name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedServiceForModal.description || selectedServiceForModal.category}
                </p>
              </div>
              <button
                onClick={() => setIsVariantModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <hr className="my-4 border-border/50" />

            <div className="space-y-4">
              <p className="font-semibold">Select Size:</p>
              <div className="custom-scrollbar max-h-[50vh] space-y-3 overflow-y-auto pr-2">
                {selectedServiceForModal.variants.map((variant) => {
                  const active = isVariantSelected(variant.service_variant)
                  return (
                    <div
                      key={variant.service_variant}
                      className="flex items-center justify-between rounded-lg border-gray-200 dark:border-border/60 bg-white dark:bg-card p-3 shadow-sm transition-all hover:border-primary/50"
                    >
                      <div>
                        <p className="text-base font-bold">{variant.size}</p>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{variant.estimated_duration} mins</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">
                          ₱{Number(variant.price).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="highlight"
                          className={
                            active
                              ? 'border-transparent bg-green-600 font-bold text-white hover:bg-green-700'
                              : 'min-w-[70px] font-bold'
                          }
                          onClick={() => toggleService(variant)}
                        >
                          {active ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsVariantModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
