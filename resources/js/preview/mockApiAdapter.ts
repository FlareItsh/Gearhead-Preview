import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { mockStorage } from './mockStorage'

interface InertiaPageResponse {
  component: string
  props: Record<string, any>
  url: string
  version: string
}

export function getInertiaPageData(urlPath: string): InertiaPageResponse {
  const url = new URL(urlPath, window.location.origin)
  const pathname = url.pathname.replace(/\/$/, '') || '/'
  const role = mockStorage.getCurrentRole()
  const user = mockStorage.getCurrentUser()

  const sharedProps = {
    auth: {
      user: {
        ...user,
        role,
        permissions:
          role === 'admin'
            ? [
                'view_dashboard',
                'view_registry',
                'view_bookings',
                'view_bays',
                'view_services',
                'view_inventory',
                'view_pullout_requests',
                'view_employees',
                'view_transactions',
                'view_reports',
                'manage_settings',
              ]
            : [],
      },
    },
    flash: {},
    errors: {},
  }

  let component = 'welcome'
  let pageProps: Record<string, any> = {}

  if (pathname === '/' || pathname === '/welcome') {
    component = 'welcome'
    pageProps = {
      discounts: mockStorage.getDiscounts(),
      reviews: mockStorage.getReviews(),
    }
  } else if (pathname === '/dashboard') {
    if (role === 'customer') {
      component = 'Customer/CustomerDashboard'
      pageProps = {
        bookings: mockStorage.getServiceOrders(),
      }
    } else {
      component = 'dashboard'
      pageProps = {
        lowStockSupplies: mockStorage.getSupplies().filter((s) => s.status !== 'in_stock'),
      }
    }
  } else if (pathname === '/customer-dashboard') {
    component = 'Customer/CustomerDashboard'
    pageProps = {
      bookings: mockStorage.getServiceOrders(),
    }
  } else if (pathname === '/services') {
    if (role === 'admin') {
      component = 'Admin/Services'
      pageProps = {
        services: mockStorage.getServices(),
      }
    } else {
      component = 'Customer/Services'
      pageProps = {
        services: mockStorage.getServices(),
        categories: ['All', 'Exterior Wash', 'Interior Detailing', 'Protection & Detailing', 'Mechanical Care'],
        cars: [
          { id: 1, make: 'Porsche', model: '911 GT3', plate_number: 'ABC-1234', size: 'Small' },
          { id: 2, make: 'Toyota', model: 'Land Cruiser', plate_number: 'XYZ-8888', size: 'Extra Large' },
        ],
      }
    }
  } else if (pathname === '/bookings') {
    if (role === 'admin') {
      component = 'Admin/Bookings'
      pageProps = {
        bookings: mockStorage.getServiceOrders(),
      }
    } else {
      component = 'Customer/Bookings'
      pageProps = {
        bookings: mockStorage.getServiceOrders(),
      }
    }
  } else if (pathname === '/payments' || pathname === '/payments/user') {
    component = 'Customer/Payments'
    pageProps = {
      payments: mockStorage.getTransactions(),
    }
  } else if (pathname === '/bays' || pathname === '/admin/bays') {
    component = 'Admin/Bays'
    pageProps = {
      bays: mockStorage.getBays(),
    }
  } else if (pathname === '/inventory' || pathname === '/admin/inventory') {
    component = 'Admin/Inventory'
    pageProps = {
      supplies: mockStorage.getSupplies(),
    }
  } else if (pathname === '/pullout-requests-page' || pathname === '/admin/pullout-requests') {
    component = 'Admin/PulloutRequests'
    pageProps = {
      requests: [],
    }
  } else if (pathname === '/customers' || pathname === '/admin/customers') {
    component = 'Admin/Customers'
    pageProps = {
      customers: mockStorage.getCustomers(),
    }
  } else if (pathname === '/staffs' || pathname === '/admin/staffs') {
    component = 'Admin/Staffs'
    pageProps = {
      staffs: mockStorage.getStaff(),
    }
  } else if (pathname === '/transactions' || pathname === '/admin/transactions') {
    component = 'Admin/Transactions'
    pageProps = {
      transactions: mockStorage.getTransactions(),
    }
  } else if (pathname === '/reports' || pathname === '/admin/reports') {
    component = 'Admin/Reports'
    pageProps = {}
  } else if (pathname === '/moderation' || pathname === '/admin/moderation') {
    component = 'Admin/Moderation'
    pageProps = {
      loyaltyThreshold: 5,
      gcashSettings: {
        account_name: 'Gearhead Carwash',
        account_number: '0917-123-4567',
        qr_code_path: null,
        qr_code_url: '/gcash.png',
      },
      discounts: mockStorage.getDiscounts(),
      services: mockStorage.getServices(),
      reviews: {
        data: mockStorage.getReviews(),
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockStorage.getReviews().length,
        links: [],
      },
    }
  } else if (pathname === '/registry' || pathname === '/admin/registry') {
    component = 'Admin/Registry'
    pageProps = {
      bays: mockStorage.getBays(),
      queues: mockStorage.getServiceOrders(),
    }
  } else if (pathname.includes('/payment')) {
    component = 'Admin/RegistryPayment'
    pageProps = {
      bayId: 1,
      gcashSettings: {
        account_name: 'Gearhead Carwash',
        account_number: '0917-123-4567',
        qr_code_path: null,
        qr_code_url: '/gcash.png',
      },
    }
  } else if (pathname.includes('/select-services')) {
    component = 'Admin/RegistrySelectServices'
    pageProps = {
      isQueue: true,
      bayId: 1,
      bayNumber: 1,
      bays: mockStorage.getBays(),
    }
  } else if (pathname === '/login') {
    component = 'auth/login'
    pageProps = {
      canResetPassword: true,
    }
  } else if (pathname === '/register') {
    component = 'auth/register'
    pageProps = {}
  } else if (pathname.startsWith('/settings/profile')) {
    component = 'settings/profile'
    pageProps = {
      mustVerifyEmail: false,
      status: undefined,
    }
  } else if (pathname.startsWith('/settings/password')) {
    component = 'settings/password'
    pageProps = {}
  } else if (pathname.startsWith('/settings/appearance')) {
    component = 'settings/appearance'
    pageProps = {}
  } else {
    // Default fallback to welcome
    component = 'welcome'
    pageProps = {
      discounts: mockStorage.getDiscounts(),
      reviews: mockStorage.getReviews(),
    }
  }

  return {
    component,
    props: {
      ...sharedProps,
      ...pageProps,
    },
    url: pathname + url.search,
    version: 'preview-1.0',
  }
}

export function handleMockApiRequest(config: InternalAxiosRequestConfig): AxiosResponse<any> {
  const url = new URL(config.url || '', window.location.origin)
  const path = url.pathname
  const method = (config.method || 'get').toLowerCase()

  let data: any = {}
  let status = 200

  // 1. Inertia page navigation
  if (config.headers && config.headers['X-Inertia']) {
    const inertiaPage = getInertiaPageData(path)
    return {
      data: inertiaPage,
      status: 200,
      statusText: 'OK',
      headers: {
        'x-inertia': 'true',
        'content-type': 'application/json',
      },
      config,
    }
  }

  // 2. Payments & Financial Reports
  if (path.includes('/payments/summary')) {
    data = {
      today_revenue: 14850,
      today_bookings: 18,
      today_expenses: 3200,
      today_profit: 11650,
      monthly_revenue: 342500,
      monthly_expenses: 89400,
      monthly_profit: 253100,
      retention_rate: 78.4,
      avg_booking_value: 825,
      total_amount: 342500,
      total_payments: 42,
    }
  } else if (path.includes('/payments/monthly-revenue')) {
    data = [
      { month: 'Jan', revenue: 280000, expenses: 75000, profit: 205000 },
      { month: 'Feb', revenue: 310000, expenses: 82000, profit: 228000 },
      { month: 'Mar', revenue: 295000, expenses: 79000, profit: 216000 },
      { month: 'Apr', revenue: 330000, expenses: 88000, profit: 242000 },
      { month: 'May', revenue: 360000, expenses: 94000, profit: 266000 },
      { month: 'Jun', revenue: 342500, expenses: 89400, profit: 253100 },
    ]
  } else if (
    path.includes('/supply-purchases/financial-summary') ||
    path.includes('/payments/financial-summary')
  ) {
    data = [
      { date: '2026-09-18', revenue: 12500, expenses: 2800, profit: 9700 },
      { date: '2026-09-19', revenue: 15400, expenses: 3100, profit: 12300 },
      { date: '2026-09-20', revenue: 18200, expenses: 4000, profit: 14200 },
      { date: '2026-09-21', revenue: 14100, expenses: 2900, profit: 11200 },
      { date: '2026-09-22', revenue: 16800, expenses: 3500, profit: 13300 },
      { date: '2026-09-23', revenue: 19500, expenses: 3200, profit: 16300 },
    ]
  } else if (path.includes('/payments/average-booking-value')) {
    data = { average_booking_value: 825 }
  } else if (path.includes('/payments/retention-rate')) {
    data = { retention_rate: 78.4 }
  } else if (path.includes('/payments/user')) {
    // Expected structure for Customer/Payments.tsx & CustomerDashboard.tsx
    data = {
      paginated: {
        data: mockStorage.getTransactions(),
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockStorage.getTransactions().length,
        links: [],
      },
      summary: {
        total_spent: 2180,
        total_transactions: mockStorage.getTransactions().length,
        last_payment_date: '2026-09-22',
        most_used_payment_method: 'GCash',
      },
    }
  } else if (path.includes('/payments/list') || path.includes('/transactions')) {
    data = {
      data: mockStorage.getTransactions(),
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: mockStorage.getTransactions().length,
      links: [],
    }
  } else if (path.includes('/payments/count')) {
    data = { count: mockStorage.getTransactions().length }
  } else if (path.includes('/supply-purchases/detailed') || path.includes('/supply-purchases')) {
    data = [
      {
        supply_purchase_id: 1,
        purchase_date: '2026-09-22 09:00',
        purchase_reference: 'PO-2026-041',
        supplier_name: 'AutoChem Supplies PH',
        supplies: "Meguiar's Hyper Wash Foam (4L)",
        total_amount: 3200,
        status: 'completed',
      },
    ]
  }

  // 3. Staff & Employees
  else if (path.includes('/staffs/active-count') || path.includes('/admin/staffs/active-count')) {
    const activeCount = mockStorage.getStaff().filter((s) => s.status === 'active').length
    data = { active_count: activeCount, active_employees: activeCount }
  } else if (path.includes('/employees/active-available')) {
    data = mockStorage.getStaff().filter((s) => s.assigned_status === 'available')
  } else if (path.includes('/employees/list')) {
    data = mockStorage.getStaff()
  } else if (path.includes('/staffs') || path.includes('/employees')) {
    // Paginated structure expected by Staffs.tsx
    data = {
      data: mockStorage.getStaff(),
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: mockStorage.getStaff().length,
      links: [],
    }
  }

  // 4. Services
  else if (path.includes('/services/top-with-size')) {
    data = [
      { service_name: 'Signature Express Wash', size: 'Small', total_bookings: 184 },
      { service_name: 'Signature Express Wash', size: 'Medium', total_bookings: 120 },
      { service_name: 'Deluxe Interior Deep Clean', size: 'Large', total_bookings: 86 },
      { service_name: 'Nano-Ceramic Shield Coating', size: 'Medium', total_bookings: 44 },
    ]
  } else if (path.includes('/services/top') || path.includes('/services/top-selling')) {
    data = [
      { service_name: 'Signature Express Wash', total_bookings: 342, total_revenue: 112860 },
      { service_name: 'Deluxe Interior Deep Clean', total_bookings: 128, total_revenue: 192000 },
      { service_name: 'Nano-Ceramic Shield Coating', total_bookings: 44, total_revenue: 242000 },
      { service_name: 'Engine Bay Steam Detailing', total_bookings: 86, total_revenue: 64500 },
    ]
  } else if (path.includes('/services/list') || path === '/services' || path.includes('/services')) {
    data = mockStorage.getServices()
  }

  // 5. Service Orders, Queues & Bookings
  else if (path.includes('/service-orders/active')) {
    data = mockStorage.getServiceOrders().filter((o) => o.status === 'in_progress' || o.bay_id)
  } else if (path.includes('/service-orders/pending')) {
    data = mockStorage
      .getServiceOrders()
      .filter((o) => o.status === 'pending')
      .map((o) => ({
        ...o,
        time: o.order_date || '2026-09-23 10:20',
      }))
  } else if (path.includes('/service-orders/today-bookings') || path.includes('/bookings/upcoming')) {
    data = mockStorage.getServiceOrders().map((order) => ({
      service_order_id: order.service_order_id,
      customer_name: order.customer_name,
      services: order.service_names || order.service_name,
      total: String(order.total_price || 0),
      order_date: order.order_date || '2026-09-23 10:00',
      is_queued: order.bay_id !== null,
    }))
  } else if (path.includes('/service-orders/bookings')) {
    data = {
      data: mockStorage.getServiceOrders(),
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: mockStorage.getServiceOrders().length,
      links: [],
    }
  } else if (path.includes('/queues/reservation')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
    if (body.service_order_id) {
      mockStorage.updateServiceOrderStatus(Number(body.service_order_id), 'pending')
    }
    data = { message: 'Reservation added to queue', success: true }
  } else if (path.includes('/queues/active') || path.includes('/queues')) {
    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
      data = mockStorage.addServiceOrder({
        customer_name: body.customer_name || 'Walk-in Customer',
        phone: body.phone || '0917-000-0000',
        vehicle_name: body.vehicle || 'Sedan',
        plate_number: body.plate_number || 'ABC-9999',
        service_name: body.service_name || 'Signature Express Wash',
        bay_id: body.bay_id || null,
        status: body.bay_id ? 'in_progress' : 'pending',
      })
    } else {
      // Map to QueueData interface expected by QueueLineTable
      data = mockStorage.getServiceOrders().map((order) => {
        const names = (order.customer_name || 'Customer').split(' ')
        return {
          queue_line_id: order.service_order_id,
          service_order_id: order.service_order_id,
          status: order.status,
          created_at: order.created_at || '10:00 AM',
          service_order: {
            user: {
              first_name: names[0] || 'Customer',
              last_name: names.slice(1).join(' ') || '',
            },
            details: order.details?.length
              ? order.details
              : [
                  {
                    service_variant: { price: order.total_price || 350, size: 'Medium' },
                    service: { service_name: order.service_name || 'Signature Express Wash' },
                  },
                ],
          },
        }
      })
    }
  } else if (path.includes('/service-orders') && method === 'put') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
    const idMatch = path.match(/service-orders\/(\d+)/)
    const id = idMatch ? parseInt(idMatch[1]) : 1
    if (path.includes('assign-employee')) {
      data = { message: 'Employee assigned successfully', success: true }
    } else {
      mockStorage.updateServiceOrderStatus(id, body.status || 'in_progress')
      data = { message: 'Order updated successfully', success: true }
    }
  } else if (path.includes('/bookings/book') || (path.includes('/bookings') && method === 'post')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
    const newOrder = mockStorage.addServiceOrder({
      customer_name: body.customer_name || mockStorage.getCurrentUser().name,
      phone: body.phone || '0917-123-4567',
      vehicle_name: body.vehicle_model || 'Vehicle',
      plate_number: body.plate_number || 'N/A',
      service_name: body.service_name || 'Selected Service',
      bay_id: null,
      status: 'pending',
    })
    data = {
      message: 'Booking created successfully in preview mode!',
      booking: newOrder,
    }
  }

  // 6. Bays
  else if (path.includes('/bays/available')) {
    data = mockStorage.getBays().filter((b) => b.status === 'available')
  } else if (path.includes('/bays/list') || path.includes('/bays')) {
    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
      const bays = mockStorage.getBays()
      const newBay = {
        bay_id: Date.now(),
        bay_number: Number(body.bay_number) || bays.length + 1,
        bay_name: `Bay ${body.bay_number || bays.length + 1}`,
        bay_type: (body.bay_type || 'Normal') as 'Normal' | 'Underwash',
        status: 'available' as const,
      }
      mockStorage.updateBay(newBay.bay_id, newBay)
      data = newBay
    } else {
      data = mockStorage.getBays()
    }
  }

  // 7. Supplies & Inventory
  else if (path.includes('/supplies')) {
    if (path.includes('/increment-stock') && method === 'post') {
      const match = path.match(/supplies\/(\d+)\/increment-stock/)
      const id = match ? parseInt(match[1]) : 1
      const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
      data = mockStorage.updateSupplyStock(id, Number(body.quantity) || 1)
    } else if (url.searchParams.get('all') === '1') {
      data = mockStorage.getSupplies()
    } else {
      data = {
        data: mockStorage.getSupplies(),
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockStorage.getSupplies().length,
        links: [],
      }
    }
  } else if (path.includes('/suppliers')) {
    data = [
      { supplier_id: 1, first_name: 'AutoChem', middle_name: '', last_name: 'Supplies PH', phone_number: '0917-888-9999', email: 'sales@autochem.ph' },
      { supplier_id: 2, first_name: 'Detailing', middle_name: '', last_name: 'Gear Direct', phone_number: '0918-222-3333', email: 'support@detailinggear.ph' },
      { supplier_id: 3, first_name: 'Ceramic Pro', middle_name: '', last_name: 'Asia', phone_number: '0922-444-5555', email: 'contact@ceramicpro.asia' },
    ]
  }

  // 8. Pullout Requests
  else if (path.includes('/pullout-requests/returnable/list')) {
    data = {
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      links: [],
    }
  } else if (path.includes('/pullout-requests')) {
    data = {
      pulloutRequests: {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        links: [],
      },
    }
  }

  // 9. Customers
  else if (path.includes('/customers')) {
    if (path.includes('/list')) {
      data = mockStorage.getCustomers()
    } else {
      data = {
        data: mockStorage.getCustomers(),
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: mockStorage.getCustomers().length,
        links: [],
      }
    }
  }

  // 10. Reviews & Discounts
  else if (path.includes('/reviews/list') || path.includes('/reviews')) {
    data = {
      data: mockStorage.getReviews(),
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: mockStorage.getReviews().length,
      links: [],
    }
  } else if (path.includes('/discounts')) {
    data = mockStorage.getDiscounts()
  }

  // Fallback default response
  else {
    data = { success: true, message: 'Preview simulated response' }
  }

  return {
    data,
    status,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  }
}

export function setupMockApiInterceptors() {
  if (typeof window === 'undefined') return

  // Configure custom Axios adapter to resolve directly from client mock data
  axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    config.adapter = async (cfg: InternalAxiosRequestConfig) => {
      await new Promise((resolve) => setTimeout(resolve, 40))
      return handleMockApiRequest(cfg)
    }
    return config
  })

  // Patch window.fetch as well for libraries or direct fetch calls
  const originalFetch = window.fetch
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const headers = new Headers(init?.headers)

    if (headers.get('X-Inertia') || urlStr.includes('/api/') || urlStr.startsWith('/')) {
      const fakeConfig: any = {
        url: urlStr,
        method: init?.method || 'GET',
        headers: Object.fromEntries(headers.entries()),
        data: init?.body,
      }
      const response = handleMockApiRequest(fakeConfig)
      const resHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (response.headers) {
        for (const [k, v] of Object.entries(response.headers)) {
          if (v != null) resHeaders[k] = String(v)
        }
      }
      return new Response(JSON.stringify(response.data), {
        status: response.status,
        headers: resHeaders,
      })
    }

    return originalFetch(input, init)
  }
}
