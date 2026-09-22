import InputError from '@/components/input-error'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import AppLayout from '@/layouts/app-layout'
import { usePermissions } from '@/hooks/use-permissions'
import { Discount, Review, Service, type BreadcrumbItem } from '@/types'
import { Transition } from '@headlessui/react'
import { Head, router, useForm } from '@inertiajs/react'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  Gift,
  LoaderCircle,
  Plus,
  QrCode,
  Search,
  Star,
  Tag,
  Trash2,
  Upload,
  Filter,
  ArrowUpDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface GcashSettings {
  account_name: string
  account_number: string
  qr_code_path: string | null
  qr_code_url: string | null
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

interface ModerationProps {
  loyaltyThreshold: number
  gcashSettings: GcashSettings
  discounts: Discount[]
  services: Service[]
  reviews: PaginatedResponse<Review>
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Moderation',
    href: '/moderation',
  },
]

export default function Moderation({
  loyaltyThreshold,
  gcashSettings,
  discounts,
  services,
  reviews: initialReviews,
}: ModerationProps) {
  const { hasPermission } = usePermissions()
  // Loyalty Form
  const loyaltyForm = useForm({
    threshold: loyaltyThreshold,
  })

  const submitLoyalty = (e: React.FormEvent) => {
    e.preventDefault()
    loyaltyForm.post(route('admin.moderation.loyalty'), {
      preserveScroll: true,
    })
  }

  // GCash Form
  const [preview, setPreview] = useState<string | null>(gcashSettings?.qr_code_url || null);

  useEffect(() => {
    if (gcashSettings?.qr_code_url) {
      setPreview(gcashSettings.qr_code_url);
    }
  }, [gcashSettings?.qr_code_url]);
  const gcashForm = useForm({
    account_name: gcashSettings.account_name,
    account_number: gcashSettings.account_number,
    qr_code: null as File | null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      gcashForm.setData('qr_code', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const submitGcash = (e: React.FormEvent) => {
    e.preventDefault()
    gcashForm.post(route('admin.moderation.gcash'), {
      preserveScroll: true,
      forceFormData: true,
    })
  }

  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'review' | 'discount' } | null>(null)

  // Reviews State
  const [reviewsData, setReviewsData] = useState<PaginatedResponse<Review>>(initialReviews)
  const [activeReviewTab, setActiveReviewTab] = useState<'displayed' | 'hidden'>('displayed')
  const [reviewSearch, setReviewSearch] = useState('')
  const [reviewPerPage, setReviewPerPage] = useState(10)
  const [isReviewsLoading, setIsReviewsLoading] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all')
  const [reviewSortBy, setReviewSortBy] = useState('newest')

  const openViewDialog = (review: Review) => {
    setSelectedReview(review)
    setIsViewDialogOpen(true)
  }

  const loadReviews = async (url?: string) => {
    setIsReviewsLoading(true)
    try {
      const params: any = {
        status: activeReviewTab,
        per_page: reviewPerPage,
        search: reviewSearch,
        rating: reviewRatingFilter,
        sort_by: reviewSortBy,
      }

      if (url) {
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) params.page = page
      }

      const res = await axios.get(route('reviews.list'), { params })
      setReviewsData(res.data)
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      setIsReviewsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [activeReviewTab, reviewPerPage, reviewRatingFilter, reviewSortBy])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReviews()
    }, 500)
    return () => clearTimeout(timer)
  }, [reviewSearch])

  const discountForm = useForm({
    name: '',
    type: 'percentage' as 'fixed' | 'percentage',
    value: 0,
    valid_from: '',
    valid_to: '',
    is_active: true,
    applies_to: 'all' as 'all' | 'specific_services',
    min_spend: 0,
    service_ids: [] as number[],
  })

  const openCreateDialog = () => {
    setEditingDiscount(null)
    discountForm.reset()
    setIsDialogOpen(true)
  }

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount)
    discountForm.setData({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      valid_from: discount.valid_from ? discount.valid_from.substring(0, 16) : '',
      valid_to: discount.valid_to ? discount.valid_to.substring(0, 16) : '',
      is_active: discount.is_active,
      applies_to: discount.applies_to,
      min_spend: discount.min_spend,
      service_ids: discount.services?.map(s => s.service_id) || [],
    })
    setIsDialogOpen(true)
  }

  const submitDiscount = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDiscount) {
      discountForm.put(route('admin.moderation.discounts.update', editingDiscount.discount_id), {
        onSuccess: () => setIsDialogOpen(false),
        preserveScroll: true,
      })
    } else {
      discountForm.post(route('admin.moderation.discounts.store'), {
        onSuccess: () => setIsDialogOpen(false),
        preserveScroll: true,
      })
    }
  }

  const confirmDelete = (id: number, type: 'review' | 'discount') => {
    setItemToDelete({ id, type })
    setIsDeleteDialogOpen(true)
  }

  const toggleReviewVisibility = (id: number) => {
    router.post(
      route('admin.moderation.reviews.toggle', id),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Review visibility updated')
          loadReviews()
        },
      },
    )
  }

  const handleDelete = () => {
    if (!itemToDelete) return

    const deleteRoute =
      itemToDelete.type === 'review'
        ? route('admin.moderation.reviews.destroy', itemToDelete.id)
        : route('admin.moderation.discounts.destroy', itemToDelete.id)

    router.delete(deleteRoute, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)
        toast.success(
          `${itemToDelete.type === 'review' ? 'Review' : 'Discount'} deleted successfully`,
        )
        if (itemToDelete.type === 'review') {
          loadReviews()
        }
      },
    })
  }

  const getStatusBadge = (discount: Discount) => {
    const now = new Date()
    const from = discount.valid_from ? new Date(discount.valid_from) : null
    const to = discount.valid_to ? new Date(discount.valid_to) : null

    if (!discount.is_active) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (from && from > now) {
      return <Badge variant="secondary">Upcoming</Badge>
    }
    if (to && to < now) {
      return <Badge variant="outline">Expired</Badge>
    }
    return <Badge variant="highlight">Active</Badge>
  }

  const toggleService = (serviceId: number) => {
    const current = [...discountForm.data.service_ids]
    if (current.includes(serviceId)) {
      discountForm.setData('service_ids', current.filter(id => id !== serviceId))
    } else {
      discountForm.setData('service_ids', [...current, serviceId])
    }
  }


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Moderation" />

      <div className="space-y-8 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Moderation Hub</h1>
          <p className="text-muted-foreground">Manage application-wide rules and settings.</p>
        </div>

        <div className="grid gap-8">
          {/* Loyalty Settings */}
          {hasPermission('manage_loyalty') && (
            <Card>
              <CardHeader className="py-6">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-highlight" />
                  Loyalty Points
                </CardTitle>
                <CardDescription>
                  Configure the criteria for the free wash loyalty points.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <form
                  onSubmit={submitLoyalty}
                  className="space-y-4"
                >
                  <div className="max-w-md space-y-2">
                    <Label htmlFor="threshold">Free Wash Threshold</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                            Every
                          </span>
                          <Input
                            id="threshold"
                            type="number"
                            className="pr-24 pl-14"
                            value={loyaltyForm.data.threshold}
                            onChange={(e) =>
                              loyaltyForm.setData('threshold', parseInt(e.target.value))
                            }
                            required
                            min="1"
                            max="100"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                            wash is free
                          </span>
                        </div>
                      </div>
                      <Button
                        disabled={loyaltyForm.processing}
                        variant="highlight"
                      >
                        {loyaltyForm.processing && (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Update
                      </Button>
                    </div>
                    <InputError message={loyaltyForm.errors.threshold} />
                    <Transition
                      show={loyaltyForm.recentlySuccessful}
                      enter="transition ease-in-out"
                      enterFrom="opacity-0"
                      leave="transition ease-in-out"
                      leaveTo="opacity-0"
                    >
                      <p className="text-sm text-green-600">Loyalty threshold updated!</p>
                    </Transition>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* GCash Settings */}
          {hasPermission('manage_gcash') && (
            <Card>
              <CardHeader className="py-6">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-highlight" />
                  Shop GCash Information
                </CardTitle>
                <CardDescription>
                  Update the GCash account details displayed to customers at checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <form
                  onSubmit={submitGcash}
                  className="space-y-6"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="account_name">GCash Account Name</Label>
                        <Input
                          id="account_name"
                          value={gcashForm.data.account_name}
                          onChange={(e) => gcashForm.setData('account_name', e.target.value)}
                          required
                          placeholder="e.g. JUAN DELA CRUZ"
                        />
                        <InputError message={gcashForm.errors.account_name} />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="account_number">GCash Phone Number</Label>
                        <Input
                          id="account_number"
                          value={gcashForm.data.account_number}
                          onChange={(e) => gcashForm.setData('account_number', e.target.value)}
                          required
                          placeholder="e.g. 09123456789"
                        />
                        <InputError message={gcashForm.errors.account_number} />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>QR Code Image</Label>
                      <div className="mt-2 flex items-start gap-6">
                        <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                          {preview ? (
                            <img
                              src={preview}
                              alt="QR Code"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <QrCode className="h-8 w-8" />
                              <span className="text-xs">No QR Code</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <Label
                            htmlFor="qr_code"
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                          >
                            <Upload className="h-4 w-4" />
                            {preview ? 'Change QR Image' : 'Upload QR Image'}
                            <input
                              id="qr_code"
                              type="file"
                              className="hidden"
                              onChange={handleFileChange}
                              accept="image/*"
                            />
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF. Max size 2MB.
                          </p>
                          <InputError message={gcashForm.errors.qr_code} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      disabled={gcashForm.processing}
                      variant="highlight"
                    >
                      {gcashForm.processing && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save GCash Settings
                    </Button>

                    <Transition
                      show={gcashForm.recentlySuccessful}
                      enter="transition ease-in-out"
                      enterFrom="opacity-0"
                      leave="transition ease-in-out"
                      leaveTo="opacity-0"
                    >
                      <p className="text-sm text-green-600">GCash info updated!</p>
                    </Transition>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Global Discounts */}
          {hasPermission('manage_discounts') && (
            <Card>
              <CardHeader className="py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-highlight" />
                      Global Discounts
                    </CardTitle>
                    <CardDescription>
                      Apply discounts to all services. Active discounts automatically apply at
                      checkout.
                    </CardDescription>
                  </div>
                  <Button
                    variant="highlight"
                    onClick={openCreateDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Discount
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="py-8">
                <Dialog
                  open={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                >
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure a promotional discount for all services.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={submitDiscount}
                      className="space-y-4 py-4"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="discount_name">Discount Name</Label>
                        <Input
                          id="discount_name"
                          value={discountForm.data.name}
                          onChange={(e) => discountForm.setData('name', e.target.value)}
                          placeholder="e.g. Summer Special"
                          required
                        />
                        <InputError message={discountForm.errors.name} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="discount_type">Type</Label>
                          <Select
                            value={discountForm.data.type}
                            onValueChange={(val: any) => discountForm.setData('type', val)}
                          >
                            <SelectTrigger id="discount_type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed (₱)</SelectItem>
                            </SelectContent>
                          </Select>
                          <InputError message={discountForm.errors.type} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="discount_value">Value</Label>
                          <Input
                            id="discount_value"
                            type="number"
                            step="0.01"
                            value={discountForm.data.value}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value) || 0
                              if (discountForm.data.type === 'percentage' && val > 100) {
                                val = 100
                              }
                              if (val < 0) {
                                val = 0
                              }
                              discountForm.setData('value', val)
                            }}
                            max={discountForm.data.type === 'percentage' ? 100 : undefined}
                            min={0}
                            required
                          />
                          <InputError message={discountForm.errors.value} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="applies_to">Applies To</Label>
                          <Select
                            value={discountForm.data.applies_to}
                            onValueChange={(val: any) => discountForm.setData('applies_to', val)}
                          >
                            <SelectTrigger id="applies_to">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Services</SelectItem>
                              <SelectItem value="specific_services">Specific Services</SelectItem>
                            </SelectContent>
                          </Select>
                          <InputError message={discountForm.errors.applies_to} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="min_spend">Min. Spend (₱)</Label>
                          <Input
                            id="min_spend"
                            type="number"
                            step="0.01"
                            value={discountForm.data.min_spend}
                            onChange={(e) => discountForm.setData('min_spend', parseFloat(e.target.value) || 0)}
                            min={0}
                            required
                          />
                          <InputError message={discountForm.errors.min_spend} />
                        </div>
                      </div>

                      {discountForm.data.applies_to === 'specific_services' && (
                        <div className="grid gap-2">
                          <Label>Select Services</Label>
                          <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                            {services.map((service) => (
                              <div key={service.service_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`service-${service.service_id}`}
                                  checked={discountForm.data.service_ids.includes(service.service_id)}
                                  onCheckedChange={() => toggleService(service.service_id)}
                                />
                                <Label
                                  htmlFor={`service-${service.service_id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {service.service_name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <InputError message={discountForm.errors.service_ids} />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="valid_from">Valid From (Optional)</Label>
                          <Input
                            id="valid_from"
                            type="datetime-local"
                            value={discountForm.data.valid_from}
                            onChange={(e) => discountForm.setData('valid_from', e.target.value)}
                          />
                          <InputError message={discountForm.errors.valid_from} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="valid_to">Valid To (Optional)</Label>
                          <Input
                            id="valid_to"
                            type="datetime-local"
                            value={discountForm.data.valid_to}
                            onChange={(e) => discountForm.setData('valid_to', e.target.value)}
                          />
                          <InputError message={discountForm.errors.valid_to} />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={discountForm.data.is_active}
                          onChange={(e) => discountForm.setData('is_active', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-highlight focus:ring-highlight"
                        />
                        <Label htmlFor="is_active">Enable this discount</Label>
                      </div>
                    </form>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="highlight"
                        onClick={submitDiscount}
                        disabled={discountForm.processing}
                      >
                        {discountForm.processing && (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingDiscount ? 'Update Discount' : 'Create Discount'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Discount Name</TableHead>
                        <TableHead>Reduction</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Min. Spend</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts.length > 0 ? (
                        discounts.map((discount) => (
                          <TableRow key={discount.discount_id}>
                            <TableCell className="font-medium">{discount.name}</TableCell>
                            <TableCell>
                              {discount.type === 'percentage'
                                ? `${discount.value}%`
                                : `₱${parseFloat(discount.value.toString()).toLocaleString()}`}
                            </TableCell>
                            <TableCell>
                              {discount.applies_to === 'all' ? (
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Global</span>
                              ) : (
                                <Badge variant="outline" className="font-normal">
                                  {discount.services?.length || 0} Services
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {discount.min_spend > 0 ? `₱${parseFloat(discount.min_spend.toString()).toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {discount.valid_from
                                    ? new Date(discount.valid_from).toLocaleDateString()
                                    : 'Always'}
                                  {' — '}
                                  {discount.valid_to
                                    ? new Date(discount.valid_to).toLocaleDateString()
                                    : 'No Expiry'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(discount)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(discount)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => confirmDelete(discount.discount_id, 'discount')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No discounts found. Create your first promotion above!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Reviews */}
          {hasPermission('manage_reviews') && (
            <Card className="border border-border/50 bg-background text-foreground">
              <CardHeader className="py-6 border-b border-border/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-highlight" />
                      Customer Testimonials
                    </CardTitle>
                    <CardDescription>
                      Manage reviews shown on the landing page. Total: <span className="font-bold text-foreground">{reviewsData.total}</span>
                    </CardDescription>
                  </div>
                  <Tabs
                    value={activeReviewTab}
                    onValueChange={(v) => setActiveReviewTab(v as any)}
                    className="w-full sm:w-[300px]"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="displayed">Displayed</TabsTrigger>
                      <TabsTrigger value="hidden">Hidden</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="pl-10 h-9 border-border bg-background focus:ring-highlight"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={reviewRatingFilter} onValueChange={setReviewRatingFilter}>
                        <SelectTrigger className="h-9 w-[130px] border-border bg-background">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ratings</SelectItem>
                          {[5, 4, 3, 2, 1].map((stars) => (
                            <SelectItem key={stars} value={stars.toString()}>
                              {stars} Stars
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <Select value={reviewSortBy} onValueChange={setReviewSortBy}>
                        <SelectTrigger className="h-9 w-[160px] border-border bg-background">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="highest_rating">Highest Rating</SelectItem>
                          <SelectItem value="lowest_rating">Lowest Rating</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b border-border/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Review</TableHead>
                        <TableHead className="font-semibold">Rating</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isReviewsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <LoaderCircle className="h-8 w-8 animate-spin text-highlight" />
                              <span className="text-sm text-muted-foreground">Updating list...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : reviewsData.data.length > 0 ? (
                        reviewsData.data.map((review) => (
                          <TableRow key={review.id} className="border-b border-border/30 hover:bg-muted/40 transition-colors">
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-foreground">{review.name}</span>
                                {review.is_verified && (
                                  <Badge variant="success" className="text-[10px] py-0 h-4 w-fit px-1.5 font-bold uppercase tracking-wider">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed break-all">
                                {review.comment}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-black text-foreground">
                                {review.rating}
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {review.is_displayed ? (
                                <Badge variant="success" className="font-bold shadow-green-100/50">Displayed</Badge>
                              ) : (
                                <Badge variant="secondary" className="font-bold">Hidden</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-highlight hover:bg-highlight/10 hover:text-highlight"
                                  onClick={() => openViewDialog(review)}
                                  title="View Full Review"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 font-bold text-xs border-border/60 hover:border-highlight/50 hover:bg-highlight/5"
                                  onClick={() => toggleReviewVisibility(review.id)}
                                >
                                  {review.is_displayed ? (
                                    <>
                                      <EyeOff className="h-3.5 w-3.5" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3.5 w-3.5" />
                                      Show
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                                  onClick={() => confirmDelete(review.id, 'review')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-32 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center gap-1">
                              <Search className="h-8 w-8 opacity-20 mb-2" />
                              <p>No reviews found in this category.</p>
                              {reviewSearch && <p className="text-xs">Try clearing your search query.</p>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Review Pagination */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 p-4 sm:flex-row bg-muted/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
                    <Select
                      value={reviewPerPage.toString()}
                      onValueChange={(v) => setReviewPerPage(Number(v))}
                    >
                      <SelectTrigger className="h-8 w-[70px] border-border bg-background">
                        <SelectValue placeholder={reviewPerPage} />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 25, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={pageSize.toString()}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Pagination
                    links={reviewsData.links}
                    onPageChange={loadReviews}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {itemToDelete?.type}? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete {itemToDelete?.type === 'review' ? 'Review' : 'Discount'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review Details Modal */}
        <Dialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-highlight" />
                Review Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about this customer review.
              </DialogDescription>
            </DialogHeader>
            
            {selectedReview && (
              <div className="mt-4 space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</p>
                    <p className="text-lg font-bold">{selectedReview.name}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</p>
                    <div className="flex items-center justify-end gap-1.5 font-black text-xl">
                      {selectedReview.rating}
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Review Comment</p>
                  <div className="rounded-xl bg-muted/30 p-4 border border-border/50 overflow-hidden">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap italic break-all">
                      "{selectedReview.comment}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                    {selectedReview.is_displayed ? (
                      <Badge variant="success" className="font-bold">Displayed on Landing</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold">Hidden</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verified Purchase</p>
                    {selectedReview.is_verified ? (
                      <Badge variant="success" className="font-bold">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-bold">Unverified</Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Posted</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReview.created_at).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6 border-t border-border/50 pt-4">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
              {selectedReview && (
                <Button
                  variant="highlight"
                  className="w-full sm:w-auto font-bold"
                  onClick={() => {
                    toggleReviewVisibility(selectedReview.id)
                    setIsViewDialogOpen(false)
                  }}
                >
                  {selectedReview.is_displayed ? 'Hide Review' : 'Show Review'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
