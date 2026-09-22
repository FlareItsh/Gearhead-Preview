import Heading from '@/components/heading'
import Pagination from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head } from '@inertiajs/react'
import axios from 'axios'
import { CheckCircle, Clock, PackageCheck, Search, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Pullout Requests', href: '/pullout-requests' }]

interface PulloutRequestDetail {
  supply_name: string
  quantity: number
  unit: string
  supply_type: 'consumables' | 'supply'
}

interface PulloutRequest {
  pullout_request_id: number
  employee_name: string
  service_name: string
  service_order_id: number
  size: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approve_by?: string
  approve_date?: string
  details: PulloutRequestDetail[]
}

interface ReturnableSupply {
  pullout_request_details_id: number
  pullout_request_id: number
  service_order_id: number
  service_name: string
  employee_name: string
  supply_name: string
  unit: string
  quantity: number
  is_returned: boolean
  returned_at: string | null
  returned_by: string | null
  size: string
  created_at: string
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

export default function PulloutRequestsPage() {
  const [pulloutRequestsData, setPulloutRequestsData] =
    useState<PaginatedResponse<PulloutRequest> | null>(null)
  const [returnableSuppliesData, setReturnableSuppliesData] =
    useState<PaginatedResponse<ReturnableSupply> | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'requests' | 'returns'>('requests')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(10)
  const { hasPermission } = usePermissions()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'requests') {
        loadPulloutRequests()
      } else {
        loadReturnableSupplies()
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // Load data on dependencies change
  useEffect(() => {
    if (activeTab === 'requests') {
      loadPulloutRequests()
    } else {
      loadReturnableSupplies()
    }
  }, [activeTab, perPage])

  const loadPulloutRequests = async (url?: string) => {
    setLoading(true)
    try {
      const finalUrl = '/api/pullout-requests'
      const params: any = { per_page: perPage, search: search }

      if (url) {
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) params.page = page
      }

      const response = await axios.get(finalUrl, { params })
      setPulloutRequestsData(response.data.pulloutRequests)
    } catch (error) {
      console.error('Failed to load pullout requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReturnableSupplies = async (url?: string) => {
    setLoading(true)
    try {
      const finalUrl = '/pullout-requests/returnable/list'
      const params: any = { per_page: perPage, search: search }

      if (url) {
        const urlObj = new URL(url)
        const page = urlObj.searchParams.get('page')
        if (page) params.page = page
      }

      const response = await axios.get(finalUrl, { params })
      setReturnableSuppliesData(response.data)
    } catch (error) {
      console.error('Failed to load returnable supplies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      const adminName = 'Admin' // You can get this from auth context
      await axios.post(`/pullout-requests/${id}/approve`, {
        approved_by: adminName,
      })
      await loadPulloutRequests()
      toast.success('Request approved successfully!')
    } catch (error) {
      console.error('Failed to approve request:', error)
      toast.error('Failed to approve request')
      alert('Failed to approve request')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await axios.post(`/pullout-requests/${id}/reject`)
      await loadPulloutRequests()
      toast.success('Request rejected successfully!')
    } catch (error) {
      console.error('Failed to reject request:', error)
      toast.error('Failed to reject request')
      alert('Failed to reject request')
    }
  }

  const handleReturnSupply = async (detailId: number) => {
    try {
      const adminName = 'Admin'
      await axios.post(`/pullout-requests/return/${detailId}`, {
        returned_by: adminName,
      })
      await loadReturnableSupplies()
      toast.success('Supply returned successfully!')
    } catch (error) {
      console.error('Failed to return supply:', error)
      toast.error('Failed to return supply')
      alert('Failed to return supply')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: 'warning' as const,
        icon: <Clock className="mr-1 h-3 w-3" />,
      },
      approved: {
        variant: 'success' as const,
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
      },
      rejected: {
        variant: 'destructive' as const,
        icon: <XCircle className="mr-1 h-3 w-3" />,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig]

    return (
      <Badge
        variant={config.variant}
        className="flex w-fit items-center"
      >
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && !pulloutRequestsData && !returnableSuppliesData) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Pullout Requests" />
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pullout Requests" />
      <div className="flex flex-col gap-4 p-6">
        <Heading
          title="Pullout Requests & Returns"
          description="Manage employee supply requests and track returnable items"
        />

        {/* Search & Filter */}
        <Card className="border border-border/50 bg-background text-foreground">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
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
            </div>
          </CardContent>
        </Card>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'requests' ? 'highlight' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            Pullout Requests
          </Button>
          <Button
            variant={activeTab === 'returns' ? 'highlight' : 'outline'}
            onClick={() => setActiveTab('returns')}
          >
            <PackageCheck className="mr-2 h-4 w-4" />
            Returns Tracking
          </Button>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <Card className="border-border/50 bg-background pt-5 pb-5 text-foreground">
            <CardContent>
              {!pulloutRequestsData || pulloutRequestsData.data.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground">No pullout requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pulloutRequestsData.data.map((request) => (
                    <Card
                      key={request.pullout_request_id}
                      className="overflow-hidden border-border/50 bg-background text-foreground"
                    >
                      <CardContent>
                        <div className="flex items-start justify-between border-b bg-muted/30 px-4 py-2 pt-5 pb-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{request.employee_name}</h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Service Order # {request.service_order_id} - {request.service_name} (
                              {request.size})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {formatDate(request.created_at)}
                            </p>
                            {request.approve_by && (
                              <p className="text-xs text-muted-foreground">
                                Approved by: {request.approve_by}
                                {request.approve_date && (
                                  <> on {formatDate(request.approve_date)}</>
                                )}
                              </p>
                            )}
                          </div>
                          {request.status === 'pending' &&
                            hasPermission('approve_pullout_request') && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                                  onClick={() => handleApprove(request.pullout_request_id)}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                  onClick={() => handleReject(request.pullout_request_id)}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                        </div>
                        <div className="p-4">
                          <h4 className="mb-2 text-sm font-medium">Requested Supplies:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Supply</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {request.details.map((detail, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{detail.supply_name}</TableCell>
                                  <TableCell className="text-right">
                                    {detail.quantity} {detail.unit}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        detail.supply_type === 'consumables' ? 'default' : 'info'
                                      }
                                    >
                                      {detail.supply_type === 'consumables'
                                        ? 'Consumable'
                                        : 'Returnable'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {/* Pagination */}
              {pulloutRequestsData && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    links={pulloutRequestsData.links}
                    onPageChange={loadPulloutRequests}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <Card className="bg-background pt-5 pb-5 text-foreground">
            <CardContent className="px-4">
              {!returnableSuppliesData || returnableSuppliesData.data.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-muted-foreground">No returnable supplies found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Order</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Supply</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Pulled Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnableSuppliesData.data.map((supply) => (
                      <TableRow key={supply.pullout_request_details_id}>
                        <TableCell>
                          #{supply.service_order_id} - {supply.service_name} ({supply.size})
                        </TableCell>
                        <TableCell>{supply.employee_name}</TableCell>
                        <TableCell>{supply.supply_name}</TableCell>
                        <TableCell>
                          {supply.quantity} {supply.unit}
                        </TableCell>
                        <TableCell>
                          {new Date(supply.created_at).toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          {supply.is_returned ? (
                            <Badge variant="success">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Returned
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending Return
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!supply.is_returned ? (
                            hasPermission('mark_return_pullout') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() =>
                                  handleReturnSupply(supply.pullout_request_details_id)
                                }
                              >
                                <PackageCheck className="mr-1 h-4 w-4" />
                                Mark Returned
                              </Button>
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Returned by {supply.returned_by}
                              <br />
                              {new Date(supply.returned_at!).toLocaleDateString('en-PH')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {/* Pagination */}
              {returnableSuppliesData && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    links={returnableSuppliesData.links}
                    onPageChange={loadReturnableSupplies}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
