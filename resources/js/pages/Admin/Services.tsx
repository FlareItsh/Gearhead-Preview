import Heading from '@/components/heading'
import HeadingSmall from '@/components/heading-small'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import ServiceRetailDrawer from '@/components/ServiceRetailDrawer'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { Head, useForm } from '@inertiajs/react'
import axios from 'axios'
import { Clock, Pencil, Plus, Search, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const breadcrumbs = [{ title: 'Services', href: '/services' }]

interface ServiceVariant {
  service_variant: number
  service_id: number
  size: string
  price: number
  estimated_duration: number
}

interface Service {
  service_id: number
  service_name: string
  description: string
  category: string
  status: string
  variants: ServiceVariant[]
}

interface ServicesProps {
  services: Service[]
  categories: string[]
}

export default function AdminServices({ services = [], categories = [] }: ServicesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showRetailDrawer, setShowRetailDrawer] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null)
  const { hasPermission } = usePermissions()

  const { data, setData, processing, reset } = useForm({
    service_name: '',
    description: '',
    category: '',
    status: 'active',
    variants: [
      { size: 'Small', price: '', estimated_duration: '', enabled: false },
      { size: 'Medium', price: '', estimated_duration: '', enabled: false },
      { size: 'Large', price: '', estimated_duration: '', enabled: false },
      { size: 'X-Large', price: '', estimated_duration: '', enabled: false },
      { size: 'XX-Large', price: '', estimated_duration: '', enabled: false },
    ],
  })

  const filteredServices = services
    .filter((s) => {
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        s.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.variants.some((v) => v.size.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      // First sort by category alphabetically
      const categoryCompare = a.category.localeCompare(b.category)
      if (categoryCompare !== 0) {
        return categoryCompare
      }

      // Then sort by service name
      return a.service_name.localeCompare(b.service_name)
    })

  const handleEdit = (service: Service) => {
    setEditingService(service)

    // Map existing variants to the form structure
    const formVariants = [
      { size: 'Small', price: '', estimated_duration: '', enabled: false },
      { size: 'Medium', price: '', estimated_duration: '', enabled: false },
      { size: 'Large', price: '', estimated_duration: '', enabled: false },
      { size: 'X-Large', price: '', estimated_duration: '', enabled: false },
      { size: 'XX-Large', price: '', estimated_duration: '', enabled: false },
    ].map((fv) => {
      const existing = service.variants.find((v) => v.size === fv.size)
      if (existing) {
        return {
          size: existing.size,
          price: existing.price.toString(),
          estimated_duration: existing.estimated_duration.toString(),
          enabled: true,
        }
      }
      return fv
    })

    setData({
      service_name: service.service_name,
      description: service.description,
      category: service.category,
      status: service.status,
      variants: formVariants,
    })
    setErrors({})
    setShowModal(true)
  }

  const handleAddNew = () => {
    setEditingService(null)
    setData({
      service_name: '',
      description: '',
      category: '',
      status: 'active',
      variants: [
        { size: 'Small', price: '', estimated_duration: '', enabled: false },
        { size: 'Medium', price: '', estimated_duration: '', enabled: false },
        { size: 'Large', price: '', estimated_duration: '', enabled: false },
        { size: 'X-Large', price: '', estimated_duration: '', enabled: false },
        { size: 'XX-Large', price: '', estimated_duration: '', enabled: false },
      ],
    })
    setErrors({})
    setShowModal(true)
  }

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!data.service_name.trim()) {
      newErrors.service_name = 'Service name is required'
    }
    if (!data.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!data.category) {
      newErrors.category = 'Category is required'
    }

    const enabledVariants = data.variants.filter((v) => v.enabled)
    if (enabledVariants.length === 0) {
      newErrors.variants = 'At least one size must be enabled'
    } else {
      enabledVariants.forEach((v, idx) => {
        if (!v.price || parseFloat(v.price) <= 0) {
          newErrors[`variant_price_${idx}`] = `${v.size} price must be greater than 0`
        }
        if (!v.estimated_duration || parseInt(v.estimated_duration) <= 0) {
          newErrors[`variant_duration_${idx}`] = `${v.size} duration must be greater than 0`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateFields()) {
      return
    }

    try {
      console.log('Submitting with data:', data)

      if (editingService) {
        console.log(`Updating service ${editingService.service_id}`)
        await axios.put(`/api/services/${editingService.service_id}`, data)
        setSuccessMessage('Service updated successfully!')
        toast.success('Service updated successfully!')
      } else {
        console.log('Creating new service')
        await axios.post('/api/services', data)
        setSuccessMessage('Service created successfully!')
        toast.success('Service created successfully!')
      }
      setShowModal(false)
      reset()
      setShowSuccessModal(true)
      // Reload the page after a short delay to get updated services
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Full error:', error)
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status)
        console.error('Response data:', error.response?.data)
      }
      toast.error('Failed to save service')
      alert(
        'Error submitting service: ' +
          (axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : 'Unknown error'),
      )
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Services Management" />

      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title="Services"
            description="Manage carwash services and pricing"
          />
          {hasPermission('add_service') && (
            <Button
              variant="highlight"
              onClick={handleAddNew}
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          )}
        </div>

        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="flex flex-col gap-4 pt-5 pb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search</h2>
            </div>

            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <div className="custom-scrollbar flex w-full gap-4 overflow-x-auto">
          <Button
            className="text-lg font-bold"
            variant={selectedCategory === 'All' ? 'highlight' : 'default'}
            onClick={() => setSelectedCategory('All')}
          >
            All
          </Button>

          {categories.map((cat) => {
            const isActive = cat === selectedCategory
            return (
              <Button
                key={cat}
                className="text-lg font-bold"
                variant={isActive ? 'highlight' : 'default'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            )
          })}
        </div>

        {/* Services List */}
        <div className="p-2">
          <h4 className="mb-2 text-2xl font-bold">{selectedCategory}</h4>

          <div className="custom-scrollbar max-h-[60vh] overflow-y-auto">
            {filteredServices.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {filteredServices.map((s) => (
                  <div
                    key={s.service_id}
                    className={`flex w-sm flex-col justify-between gap-4 rounded-sm border p-4 ${
                      s.status === 'inactive' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={s.status === 'inactive' ? 'relative' : ''}>
                      {s.status === 'inactive' && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-highlight/60">
                          <span className="text-lg font-bold text-red-500">INACTIVE</span>
                        </div>
                      )}
                      <HeadingSmall
                        title={`${s.service_name}`}
                        description={s.description
                          .replace(/,\s*/g, ', ')
                          .split(', ')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                          .join(', ')}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">
                        Available Sizes:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {s.variants.map((v) => (
                          <span
                            key={v.service_variant}
                            className="rounded-md bg-highlight/10 px-3 py-1 text-sm font-bold text-foreground"
                          >
                            {v.size}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {s.variants.map((v) => (
                        <div
                          key={v.service_variant}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="font-medium">{v.size}:</span>
                          <div className="flex flex-wrap items-center justify-end gap-3">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {v.estimated_duration} mins
                            </span>
                            <span className="font-bold">₱{v.price.toLocaleString()}</span>
                            {hasPermission('edit_service') && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedVariant(v)
                                  setShowRetailDrawer(true)
                                }}
                              >
                                <Settings className="h-3 w-3" />
                                Retail
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {hasPermission('edit_service') && (
                      <div className="mt-2 flex w-full gap-2">
                        <Button
                          variant="highlight"
                          onClick={() => handleEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No services available.</p>
            )}
          </div>
        </div>

        {selectedVariant && (
          <ServiceRetailDrawer
            open={showRetailDrawer}
            onClose={() => setShowRetailDrawer(false)}
            variantId={selectedVariant.service_variant}
            variantSize={selectedVariant.size}
          />
        )}

        {/* Modal */}
        <Dialog
          open={showModal}
          onOpenChange={setShowModal}
        >
          <DialogContent className="w-full sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingService ? (
                  <>
                    Edit <span className="black:text-highlight text-yellow-500">Service</span>
                  </>
                ) : (
                  <>
                    Add <span className="black:text-highlight text-yellow-500">Service</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? `Editing: ${editingService.service_name}`
                  : 'Create a new service offering'}
              </DialogDescription>
            </DialogHeader>

            <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-6 py-2">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="service_name">Service Name</Label>
                    <Input
                      id="service_name"
                      value={data.service_name}
                      onChange={(e) => setData('service_name', e.target.value)}
                    />
                    {errors.service_name && (
                      <p className="text-sm text-red-500">{errors.service_name}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={data.category}
                        onValueChange={(value) => setData('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat}
                              value={cat}
                              className="font-bold"
                            >
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={data.status}
                        onValueChange={(value) => setData('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">Service Sizes & Pricing</Label>
                    {errors.variants && <p className="text-sm text-red-500">{errors.variants}</p>}
                  </div>

                  <div className="space-y-4">
                    {data.variants.map((variant, index) => (
                      <div
                        key={variant.size}
                        className={cn(
                          'rounded-lg border p-4 transition-all',
                          variant.enabled
                            ? 'border-highlight bg-highlight/5 shadow-sm'
                            : 'border-border bg-muted/30 opacity-60',
                        )}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-highlight focus:ring-highlight"
                            checked={variant.enabled}
                            onChange={(e) => {
                              const newVariants = [...data.variants]
                              newVariants[index].enabled = e.target.checked
                              setData('variants', newVariants)
                            }}
                          />
                          <span className="text-lg font-bold">{variant.size}</span>
                        </div>

                        {variant.enabled && (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                              <Label className="text-xs">Price (₱)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={variant.price}
                                onChange={(e) => {
                                  const newVariants = [...data.variants]
                                  newVariants[index].price = e.target.value
                                  setData('variants', newVariants)
                                }}
                              />
                              {errors[`variant_price_${index}`] && (
                                <p className="text-xs text-red-500">
                                  {errors[`variant_price_${index}`]}
                                </p>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs">Duration (mins)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={variant.estimated_duration}
                                onChange={(e) => {
                                  const newVariants = [...data.variants]
                                  newVariants[index].estimated_duration = e.target.value
                                  setData('variants', newVariants)
                                }}
                              />
                              {errors[`variant_duration_${index}`] && (
                                <p className="text-xs text-red-500">
                                  {errors[`variant_duration_${index}`]}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="highlight"
                disabled={processing}
                onClick={handleSubmit}
              >
                {editingService ? 'Update Service' : 'Create Service'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
        >
          <DialogContent className="w-full rounded-xl p-6 shadow-lg sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-highlight">✓ Success</DialogTitle>
            </DialogHeader>
            <p className="my-4 text-center text-foreground">{successMessage}</p>
            <DialogFooter className="flex justify-end gap-3">
              <Button
                variant="highlight"
                onClick={() => setShowSuccessModal(false)}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
