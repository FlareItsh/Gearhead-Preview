import {
  initialAdminUser,
  initialBays,
  initialCustomers,
  initialCustomerUser,
  initialDiscounts,
  initialReviews,
  initialServiceOrders,
  initialServices,
  initialStaff,
  initialSupplies,
  initialTransactions,
  type MockBay,
  type MockCustomerUser,
  type MockService,
  type MockServiceOrder,
  type MockStaff,
  type MockSupply,
  type MockTransaction,
  type MockUser,
} from './mockData'

const STORAGE_KEYS = {
  INITIALIZED: 'gearhead_preview_initialized_v2',
  ROLE: 'gearhead_preview_role',
  BAYS: 'gearhead_preview_bays',
  SERVICES: 'gearhead_preview_services',
  SERVICE_ORDERS: 'gearhead_preview_service_orders',
  SUPPLIES: 'gearhead_preview_supplies',
  STAFF: 'gearhead_preview_staff',
  CUSTOMERS: 'gearhead_preview_customers',
  TRANSACTIONS: 'gearhead_preview_transactions',
  REVIEWS: 'gearhead_preview_reviews',
  DISCOUNTS: 'gearhead_preview_discounts',
  NOTICE_DISMISSED: 'gearhead_preview_notice_dismissed',
}

class MockStorage {
  constructor() {
    this.ensureInitialized()
  }

  ensureInitialized() {
    if (typeof window === 'undefined') return
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED)
    if (!isInitialized) {
      this.resetToDefaults()
    }
  }

  resetToDefaults() {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true')
    localStorage.setItem(STORAGE_KEYS.ROLE, 'admin')
    localStorage.setItem(STORAGE_KEYS.BAYS, JSON.stringify(initialBays))
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(initialServices))
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(initialServiceOrders))
    localStorage.setItem(STORAGE_KEYS.SUPPLIES, JSON.stringify(initialSupplies))
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(initialStaff))
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers))
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions))
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initialReviews))
    localStorage.setItem(STORAGE_KEYS.DISCOUNTS, JSON.stringify(initialDiscounts))
  }

  // --- Auth & Role ---
  getCurrentRole(): 'admin' | 'customer' {
    if (typeof window === 'undefined') return 'admin'
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as 'admin' | 'customer') || 'admin'
  }

  setCurrentRole(role: 'admin' | 'customer') {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.ROLE, role)
  }

  getCurrentUser(): MockUser {
    return this.getCurrentRole() === 'admin' ? initialAdminUser : initialCustomerUser
  }

  // --- Bays ---
  getBays(): MockBay[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BAYS)
      return data ? JSON.parse(data) : initialBays
    } catch {
      return initialBays
    }
  }

  updateBay(bayId: number, updates: Partial<MockBay>): MockBay[] {
    const bays = this.getBays().map((b) => (b.bay_id === bayId ? { ...b, ...updates } : b))
    localStorage.setItem(STORAGE_KEYS.BAYS, JSON.stringify(bays))
    return bays
  }

  // --- Services ---
  getServices(): MockService[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES)
      return data ? JSON.parse(data) : initialServices
    } catch {
      return initialServices
    }
  }

  // --- Service Orders & Queues ---
  getServiceOrders(): MockServiceOrder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICE_ORDERS)
      return data ? JSON.parse(data) : initialServiceOrders
    } catch {
      return initialServiceOrders
    }
  }

  addServiceOrder(item: Partial<MockServiceOrder>): MockServiceOrder {
    const orders = this.getServiceOrders()
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')
    const newOrder: MockServiceOrder = {
      service_order_id: Date.now(),
      bay_id: item.bay_id ?? null,
      customer_name: item.customer_name || 'Walk-in Customer',
      phone: item.phone || '0917-000-0000',
      vehicle_name: item.vehicle_name || item.vehicle || 'Vehicle',
      vehicle: item.vehicle || item.vehicle_name || 'Vehicle',
      plate_number: item.plate_number || 'N/A',
      service_name: item.service_name || 'Signature Express Wash',
      service_names: item.service_names || item.service_name || 'Signature Express Wash',
      time: timeStr,
      order_date: dateStr,
      total_price: item.total_price || 350,
      status: item.status || (item.bay_id ? 'in_progress' : 'pending'),
      assigned_employee_id: item.assigned_employee_id ?? null,
      created_at: timeStr,
      details: item.details || [
        {
          service_variant: { price: item.total_price || 350, size: 'Medium' },
          service: { service_name: item.service_name || 'Signature Express Wash', category: 'Exterior Wash' },
        },
      ],
    }
    const updated = [newOrder, ...orders]
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(updated))
    return newOrder
  }

  updateServiceOrder(id: number, updates: Partial<MockServiceOrder>): MockServiceOrder[] {
    const orders = this.getServiceOrders().map((o) => (o.service_order_id === id ? { ...o, ...updates } : o))
    localStorage.setItem(STORAGE_KEYS.SERVICE_ORDERS, JSON.stringify(orders))
    return orders
  }

  // --- Supplies ---
  getSupplies(): MockSupply[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPPLIES)
      return data ? JSON.parse(data) : initialSupplies
    } catch {
      return initialSupplies
    }
  }

  updateSupplyStock(id: number, delta: number): MockSupply[] {
    const supplies = this.getSupplies().map((s) => {
      if (s.supply_id === id) {
        const newQty = Math.max(0, s.quantity_stock + delta)
        const status: 'in_stock' | 'low_stock' | 'out_of_stock' =
          newQty === 0 ? 'out_of_stock' : newQty <= s.reorder_point ? 'low_stock' : 'in_stock'
        return { ...s, quantity_stock: newQty, status }
      }
      return s
    })
    localStorage.setItem(STORAGE_KEYS.SUPPLIES, JSON.stringify(supplies))
    return supplies
  }

  // --- Staff ---
  getStaff(): MockStaff[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF)
      return data ? JSON.parse(data) : initialStaff
    } catch {
      return initialStaff
    }
  }

  // --- Customers ---
  getCustomers(): MockCustomerUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
      return data ? JSON.parse(data) : initialCustomers
    } catch {
      return initialCustomers
    }
  }

  updateCustomer(id: number, updates: Partial<MockCustomerUser>): MockCustomerUser[] {
    const customers = this.getCustomers().map((c) => (c.user_id === id ? { ...c, ...updates } : c))
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
    return customers
  }

  // --- Transactions ---
  getTransactions(): MockTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      return data ? JSON.parse(data) : initialTransactions
    } catch {
      return initialTransactions
    }
  }

  addTransaction(tx: Partial<MockTransaction>): MockTransaction {
    const txs = this.getTransactions()
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ')
    const newTx: MockTransaction = {
      payment_id: Date.now(),
      id: Date.now(),
      date: dateStr,
      customer: tx.customer || tx.customer_name || 'Customer',
      customer_name: tx.customer_name || tx.customer || 'Customer',
      vehicle: tx.vehicle || 'Vehicle',
      services: tx.services || tx.service_name || 'Service',
      service_name: tx.service_name || tx.services || 'Service',
      amount: tx.amount || 350,
      payment_method: tx.payment_method || 'Cash',
      gcash_reference: tx.gcash_reference ?? null,
      gcash_screenshot: null,
      payment_status: 'paid',
      status: 'completed',
      is_point_redeemed: false,
      type: 'income',
      employee: tx.employee || 'Anton Santos',
      created_at: dateStr,
    }
    const updated = [newTx, ...txs]
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated))
    return newTx
  }

  // --- Reviews & Discounts ---
  getReviews() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEWS)
      return data ? JSON.parse(data) : initialReviews
    } catch {
      return initialReviews
    }
  }

  getDiscounts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DISCOUNTS)
      return data ? JSON.parse(data) : initialDiscounts
    } catch {
      return initialDiscounts
    }
  }

  // --- Notice Dismissed ---
  isNoticeDismissed(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEYS.NOTICE_DISMISSED) === 'true'
  }

  setNoticeDismissed(dismissed: boolean) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.NOTICE_DISMISSED, dismissed ? 'true' : 'false')
  }
}

export const mockStorage = new MockStorage()
