export interface MockUser {
  id: number
  user_id?: number
  name: string
  first_name?: string
  last_name?: string
  email: string
  role: 'admin' | 'customer'
  email_verified_at: string
  created_at: string
  updated_at: string
}

export interface MockServiceVariant {
  service_variant_id: number
  service_variant: number
  size: 'Small' | 'Medium' | 'Large' | 'Extra Large'
  price: number
  estimated_duration: number
  enabled: boolean
}

export interface MockService {
  service_id: number
  service_name: string
  description: string
  category: string
  status: 'active' | 'inactive'
  variants: MockServiceVariant[]
  created_at: string
  updated_at: string
}

export interface MockBay {
  bay_id: number
  bay_number: number
  bay_name: string
  bay_type: 'Normal' | 'Underwash'
  status: 'available' | 'occupied' | 'maintenance'
  current_vehicle?: string
  current_customer?: string
  current_service?: string
  started_at?: string
  estimated_completion?: string
}

export interface MockServiceOrder {
  service_order_id: number
  bay_id: number | null
  customer_name: string
  phone: string
  vehicle_name: string
  vehicle: string
  plate_number: string
  service_name: string
  service_names: string
  time: string
  order_date: string
  total_price: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_employee_id?: number | null
  created_at: string
  details: Array<{
    service_order_detail_id?: number
    service_variant?: {
      price: number
      size: string
    }
    service?: {
      service_name: string
      category: string
    }
  }>
}

export interface MockSupply {
  supply_id: number
  supply_name: string
  sku: string
  category: string
  quantity_stock: number
  unit: string
  purchase_unit: string
  base_unit: string
  conversion_factor: number
  unit_price: number
  reorder_point: number
  supply_type: 'consumables' | 'supply'
  supplier_name: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface MockStaff {
  employee_id: number
  id: number
  first_name: string
  middle_name: string
  last_name: string
  name: string
  email: string
  phone_number: string
  phone: string
  address: string
  role: string
  status: 'active' | 'inactive'
  assigned_status: 'available' | 'assigned'
  date_hired: string
  active_tasks: number
  completed_jobs: number
  wallet_balance: number
  commission_percentage: number
}

export interface MockCustomerUser {
  user_id: number
  id: number
  first_name: string
  middle_name: string | null
  last_name: string
  name: string
  email: string
  phone_number: string
  address: string
  role: 'customer' | 'admin'
  bookings: number
  loyaltyPoints: number
  created_at: string
}

export interface MockTransaction {
  payment_id: number
  id: number
  date: string
  customer: string
  customer_name: string
  vehicle: string
  services: string
  service_name: string
  amount: number
  payment_method: string
  gcash_reference: string | null
  gcash_screenshot: string | null
  payment_status: 'paid' | 'pending' | 'refunded'
  status: 'completed' | 'pending' | 'cancelled'
  is_point_redeemed: boolean
  type: 'income'
  employee: string
  created_at: string
}

export const initialAdminUser: MockUser = {
  id: 1,
  user_id: 1,
  name: 'Marcus Vance',
  first_name: 'Marcus',
  last_name: 'Vance',
  email: 'admin@gearhead.com',
  role: 'admin',
  email_verified_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const initialCustomerUser: MockUser = {
  id: 2,
  user_id: 2,
  name: 'Rayver Dasalla',
  first_name: 'Rayver',
  last_name: 'Dasalla',
  email: 'customer@gearhead.com',
  role: 'customer',
  email_verified_at: '2026-01-15T00:00:00Z',
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
}

export const initialServices: MockService[] = [
  {
    service_id: 1,
    service_name: 'Signature Express Wash',
    description: 'High-pressure foam pre-soak, gentle hand wash, wheel cleaning, spot-free rinse, and hand drying.',
    category: 'Exterior Wash',
    status: 'active',
    variants: [
      { service_variant_id: 1, service_variant: 1, size: 'Small', price: 250, estimated_duration: 25, enabled: true },
      { service_variant_id: 2, service_variant: 2, size: 'Medium', price: 320, estimated_duration: 30, enabled: true },
      { service_variant_id: 3, service_variant: 3, size: 'Large', price: 380, estimated_duration: 35, enabled: true },
      { service_variant_id: 4, service_variant: 4, size: 'Extra Large', price: 450, estimated_duration: 45, enabled: true },
    ],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    service_id: 2,
    service_name: 'Deluxe Interior Deep Clean',
    description: 'Deep vacuuming, dashboard and console conditioning, seat shampooing/leather treatment, and odor elimination.',
    category: 'Interior Detailing',
    status: 'active',
    variants: [
      { service_variant_id: 5, service_variant: 5, size: 'Small', price: 1200, estimated_duration: 90, enabled: true },
      { service_variant_id: 6, service_variant: 6, size: 'Medium', price: 1500, estimated_duration: 105, enabled: true },
      { service_variant_id: 7, service_variant: 7, size: 'Large', price: 1800, estimated_duration: 120, enabled: true },
      { service_variant_id: 8, service_variant: 8, size: 'Extra Large', price: 2200, estimated_duration: 150, enabled: true },
    ],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    service_id: 3,
    service_name: 'Nano-Ceramic Shield Coating',
    description: 'Multi-stage paint decontamination, gloss enhancement polish, and 9H ceramic hydrophobic coating.',
    category: 'Protection & Detailing',
    status: 'active',
    variants: [
      { service_variant_id: 9, service_variant: 9, size: 'Small', price: 4500, estimated_duration: 180, enabled: true },
      { service_variant_id: 10, service_variant: 10, size: 'Medium', price: 5500, estimated_duration: 210, enabled: true },
      { service_variant_id: 11, service_variant: 11, size: 'Large', price: 6800, estimated_duration: 240, enabled: true },
      { service_variant_id: 12, service_variant: 12, size: 'Extra Large', price: 8000, estimated_duration: 300, enabled: true },
    ],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
  {
    service_id: 4,
    service_name: 'Engine Bay Steam Detailing',
    description: 'Specialized dry steam cleaning, grease dissolution, and protective plastic conditioning.',
    category: 'Mechanical Care',
    status: 'active',
    variants: [
      { service_variant_id: 13, service_variant: 13, size: 'Small', price: 650, estimated_duration: 45, enabled: true },
      { service_variant_id: 14, service_variant: 14, size: 'Medium', price: 750, estimated_duration: 50, enabled: true },
      { service_variant_id: 15, service_variant: 15, size: 'Large', price: 900, estimated_duration: 60, enabled: true },
      { service_variant_id: 16, service_variant: 16, size: 'Extra Large', price: 1100, estimated_duration: 75, enabled: true },
    ],
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-10T08:00:00Z',
  },
]

export const initialBays: MockBay[] = [
  {
    bay_id: 1,
    bay_number: 1,
    bay_name: 'Bay 1 (Wash & Rinse)',
    bay_type: 'Normal',
    status: 'occupied',
    current_vehicle: 'Porsche 911 GT3 (ABC-1234)',
    current_customer: 'Dominic T.',
    current_service: 'Signature Express Wash',
    started_at: '10:15 AM',
    estimated_completion: '10:45 AM',
  },
  {
    bay_id: 2,
    bay_number: 2,
    bay_name: 'Bay 2 (Underwash & Foam)',
    bay_type: 'Underwash',
    status: 'available',
  },
  {
    bay_id: 3,
    bay_number: 3,
    bay_name: 'Bay 3 (Detailing & Interior)',
    bay_type: 'Normal',
    status: 'occupied',
    current_vehicle: 'Toyota Land Cruiser (XYZ-8888)',
    current_customer: 'Elena Rostova',
    current_service: 'Deluxe Interior Deep Clean',
    started_at: '09:30 AM',
    estimated_completion: '11:15 AM',
  },
  {
    bay_id: 4,
    bay_number: 4,
    bay_name: 'Bay 4 (Ceramic & Dry Area)',
    bay_type: 'Normal',
    status: 'available',
  },
]

export const initialServiceOrders: MockServiceOrder[] = [
  {
    service_order_id: 101,
    bay_id: 1,
    customer_name: 'Dominic T.',
    phone: '09171234567',
    vehicle_name: 'Porsche 911 GT3',
    vehicle: 'Porsche 911 GT3',
    plate_number: 'ABC-1234',
    service_name: 'Signature Express Wash',
    service_names: 'Signature Express Wash (Small)',
    time: '10:15 AM',
    order_date: '2026-09-23 10:15',
    total_price: 250,
    status: 'in_progress',
    assigned_employee_id: 1,
    created_at: '10:10 AM',
    details: [
      {
        service_order_detail_id: 1,
        service_variant: { price: 250, size: 'Small' },
        service: { service_name: 'Signature Express Wash', category: 'Exterior Wash' },
      },
    ],
  },
  {
    service_order_id: 102,
    bay_id: 3,
    customer_name: 'Elena Rostova',
    phone: '09187654321',
    vehicle_name: 'Toyota Land Cruiser',
    vehicle: 'Toyota Land Cruiser',
    plate_number: 'XYZ-8888',
    service_name: 'Deluxe Interior Deep Clean',
    service_names: 'Deluxe Interior Deep Clean (Extra Large)',
    time: '09:30 AM',
    order_date: '2026-09-23 09:30',
    total_price: 2200,
    status: 'in_progress',
    assigned_employee_id: 2,
    created_at: '09:25 AM',
    details: [
      {
        service_order_detail_id: 2,
        service_variant: { price: 2200, size: 'Extra Large' },
        service: { service_name: 'Deluxe Interior Deep Clean', category: 'Interior Detailing' },
      },
    ],
  },
  {
    service_order_id: 103,
    bay_id: null,
    customer_name: 'Carlos Mendoza',
    phone: '09223334444',
    vehicle_name: 'Honda Civic Type R',
    vehicle: 'Honda Civic Type R',
    plate_number: 'NDK-4021',
    service_name: 'Nano-Ceramic Shield Coating',
    service_names: 'Nano-Ceramic Shield Coating (Medium)',
    time: '10:20 AM',
    order_date: '2026-09-23 10:20',
    total_price: 5500,
    status: 'pending',
    created_at: '10:20 AM',
    details: [
      {
        service_order_detail_id: 3,
        service_variant: { price: 5500, size: 'Medium' },
        service: { service_name: 'Nano-Ceramic Shield Coating', category: 'Protection & Detailing' },
      },
    ],
  },
  {
    service_order_id: 104,
    bay_id: null,
    customer_name: 'Samantha Grey',
    phone: '09995556666',
    vehicle_name: 'Ford Ranger Wildtrak',
    vehicle: 'Ford Ranger Wildtrak',
    plate_number: 'NCL-7712',
    service_name: 'Signature Express Wash',
    service_names: 'Signature Express Wash (Large)',
    time: '10:35 AM',
    order_date: '2026-09-23 10:35',
    total_price: 380,
    status: 'pending',
    created_at: '10:35 AM',
    details: [
      {
        service_order_detail_id: 4,
        service_variant: { price: 380, size: 'Large' },
        service: { service_name: 'Signature Express Wash', category: 'Exterior Wash' },
      },
    ],
  },
]

export const initialSupplies: MockSupply[] = [
  {
    supply_id: 1,
    supply_name: "Meguiar's Hyper Wash Foam (4L)",
    sku: 'SUP-HW-001',
    category: 'Chemicals',
    quantity_stock: 14,
    unit: 'gallons',
    purchase_unit: 'box',
    base_unit: 'gallons',
    conversion_factor: 4,
    unit_price: 1850,
    reorder_point: 5,
    supply_type: 'consumables',
    supplier_name: 'AutoChem Supplies PH',
    status: 'in_stock',
  },
  {
    supply_id: 2,
    supply_name: 'Ultra Plush Microfiber Towel (500 GSM)',
    sku: 'SUP-MF-002',
    category: 'Accessories',
    quantity_stock: 4,
    unit: 'packs (10pcs)',
    purchase_unit: 'pack',
    base_unit: 'piece',
    conversion_factor: 10,
    unit_price: 650,
    reorder_point: 8,
    supply_type: 'supply',
    supplier_name: 'Detailing Gear Direct',
    status: 'low_stock',
  },
  {
    supply_id: 3,
    supply_name: 'Gyeon Q² Mohs Ceramic Coating (50ml)',
    sku: 'SUP-CC-003',
    category: 'Coating',
    quantity_stock: 8,
    unit: 'bottles',
    purchase_unit: 'box',
    base_unit: 'bottles',
    conversion_factor: 1,
    unit_price: 3200,
    reorder_point: 3,
    supply_type: 'consumables',
    supplier_name: 'Ceramic Pro Asia',
    status: 'in_stock',
  },
  {
    supply_id: 4,
    supply_name: 'Citrus Heavy Duty Degreaser (3.8L)',
    sku: 'SUP-DG-004',
    category: 'Chemicals',
    quantity_stock: 3,
    unit: 'gallons',
    purchase_unit: 'box',
    base_unit: 'gallons',
    conversion_factor: 4,
    unit_price: 950,
    reorder_point: 6,
    supply_type: 'consumables',
    supplier_name: 'AutoChem Supplies PH',
    status: 'low_stock',
  },
  {
    supply_id: 5,
    supply_name: 'Leather Conditioner & UV Guard',
    sku: 'SUP-LC-005',
    category: 'Interior Care',
    quantity_stock: 12,
    unit: 'bottles (500ml)',
    purchase_unit: 'carton',
    base_unit: 'bottles',
    conversion_factor: 6,
    unit_price: 480,
    reorder_point: 4,
    supply_type: 'consumables',
    supplier_name: 'Detailing Gear Direct',
    status: 'in_stock',
  },
]

export const initialStaff: MockStaff[] = [
  {
    employee_id: 1,
    id: 1,
    first_name: 'Anton',
    middle_name: '',
    last_name: 'Santos',
    name: 'Anton Santos',
    email: 'anton.s@gearhead.com',
    phone_number: '09171112222',
    phone: '0917-111-2222',
    address: 'Quezon City, Metro Manila',
    role: 'Lead Detailer',
    status: 'active',
    assigned_status: 'assigned',
    date_hired: '2024-03-15',
    active_tasks: 1,
    completed_jobs: 142,
    wallet_balance: 6850,
    commission_percentage: 15,
  },
  {
    employee_id: 2,
    id: 2,
    first_name: 'Jerome',
    middle_name: '',
    last_name: 'Castillo',
    name: 'Jerome Castillo',
    email: 'jerome.c@gearhead.com',
    phone_number: '09183334444',
    phone: '0918-333-4444',
    address: 'Pasig City, Metro Manila',
    role: 'Wash Technician',
    status: 'active',
    assigned_status: 'assigned',
    date_hired: '2024-06-20',
    active_tasks: 1,
    completed_jobs: 218,
    wallet_balance: 4200,
    commission_percentage: 10,
  },
  {
    employee_id: 3,
    id: 3,
    first_name: 'Mark',
    middle_name: 'A.',
    last_name: 'Reyes',
    name: 'Mark Reyes',
    email: 'mark.r@gearhead.com',
    phone_number: '09225556666',
    phone: '0922-555-6666',
    address: 'Mandaluyong City, Metro Manila',
    role: 'Ceramic Coating Specialist',
    status: 'active',
    assigned_status: 'available',
    date_hired: '2023-11-01',
    active_tasks: 0,
    completed_jobs: 88,
    wallet_balance: 11400,
    commission_percentage: 20,
  },
  {
    employee_id: 4,
    id: 4,
    first_name: 'Dave',
    middle_name: '',
    last_name: 'Bautista',
    name: 'Dave Bautista',
    email: 'dave.b@gearhead.com',
    phone_number: '09997778888',
    phone: '0999-777-8888',
    address: 'Taguig City, Metro Manila',
    role: 'Junior Technician',
    status: 'active',
    assigned_status: 'available',
    date_hired: '2025-01-10',
    active_tasks: 0,
    completed_jobs: 94,
    wallet_balance: 2900,
    commission_percentage: 10,
  },
]

export const initialCustomers: MockCustomerUser[] = [
  {
    user_id: 1,
    id: 1,
    first_name: 'Dominic',
    middle_name: null,
    last_name: 'Toretto',
    name: 'Dominic Toretto',
    email: 'dom@fast.com',
    phone_number: '09171234567',
    address: 'Los Angeles / Manila',
    role: 'customer',
    bookings: 14,
    loyaltyPoints: 140,
    created_at: '2026-01-10',
  },
  {
    user_id: 2,
    id: 2,
    first_name: 'Elena',
    middle_name: null,
    last_name: 'Rostova',
    name: 'Elena Rostova',
    email: 'elena@rostova.com',
    phone_number: '09187654321',
    address: 'BGC, Taguig',
    role: 'customer',
    bookings: 8,
    loyaltyPoints: 80,
    created_at: '2026-01-15',
  },
  {
    user_id: 3,
    id: 3,
    first_name: 'Carlos',
    middle_name: null,
    last_name: 'Mendoza',
    name: 'Carlos Mendoza',
    email: 'carlos@mendoza.com',
    phone_number: '09223334444',
    address: 'Makati City',
    role: 'customer',
    bookings: 5,
    loyaltyPoints: 50,
    created_at: '2026-02-01',
  },
  {
    user_id: 4,
    id: 4,
    first_name: 'Samantha',
    middle_name: null,
    last_name: 'Grey',
    name: 'Samantha Grey',
    email: 'sam@grey.com',
    phone_number: '09995556666',
    address: 'Alabang, Muntinlupa',
    role: 'customer',
    bookings: 2,
    loyaltyPoints: 20,
    created_at: '2026-02-20',
  },
]

export const initialTransactions: MockTransaction[] = [
  {
    payment_id: 1,
    id: 1,
    date: '2026-09-22 10:15',
    customer: 'Dominic Toretto',
    customer_name: 'Dominic Toretto',
    vehicle: 'Porsche 911 GT3',
    services: 'Signature Express Wash',
    service_name: 'Signature Express Wash',
    amount: 380,
    payment_method: 'GCash',
    gcash_reference: 'GC-9921827341',
    gcash_screenshot: null,
    payment_status: 'paid',
    status: 'completed',
    is_point_redeemed: false,
    type: 'income',
    employee: 'Anton Santos',
    created_at: '2026-09-22 10:15',
  },
  {
    payment_id: 2,
    id: 2,
    date: '2026-09-22 09:30',
    customer: 'Elena Rostova',
    customer_name: 'Elena Rostova',
    vehicle: 'Toyota Land Cruiser',
    services: 'Deluxe Interior Deep Clean',
    service_name: 'Deluxe Interior Deep Clean',
    amount: 1800,
    payment_method: 'Credit Card',
    gcash_reference: null,
    gcash_screenshot: null,
    payment_status: 'paid',
    status: 'completed',
    is_point_redeemed: false,
    type: 'income',
    employee: 'Jerome Castillo',
    created_at: '2026-09-22 09:30',
  },
  {
    payment_id: 3,
    id: 3,
    date: '2026-09-21 16:45',
    customer: 'Marco Diaz',
    customer_name: 'Marco Diaz',
    vehicle: 'Mazda CX-5',
    services: 'Signature Express Wash',
    service_name: 'Signature Express Wash',
    amount: 320,
    payment_method: 'Cash',
    gcash_reference: null,
    gcash_screenshot: null,
    payment_status: 'paid',
    status: 'completed',
    is_point_redeemed: false,
    type: 'income',
    employee: 'Dave Bautista',
    created_at: '2026-09-21 16:45',
  },
  {
    payment_id: 4,
    id: 4,
    date: '2026-09-21 13:20',
    customer: 'Patricia Lim',
    customer_name: 'Patricia Lim',
    vehicle: 'BMW M3',
    services: 'Nano-Ceramic Shield Coating',
    service_name: 'Nano-Ceramic Shield Coating',
    amount: 5500,
    payment_method: 'GCash',
    gcash_reference: 'GC-8837192041',
    gcash_screenshot: null,
    payment_status: 'paid',
    status: 'completed',
    is_point_redeemed: true,
    type: 'income',
    employee: 'Mark Reyes',
    created_at: '2026-09-21 13:20',
  },
  {
    payment_id: 5,
    id: 5,
    date: '2026-09-21 11:10',
    customer: 'Gabriel Tan',
    customer_name: 'Gabriel Tan',
    vehicle: 'Subaru WRX STI',
    services: 'Engine Bay Steam Detailing',
    service_name: 'Engine Bay Steam Detailing',
    amount: 750,
    payment_method: 'Cash',
    gcash_reference: null,
    gcash_screenshot: null,
    payment_status: 'paid',
    status: 'completed',
    is_point_redeemed: false,
    type: 'income',
    employee: 'Jerome Castillo',
    created_at: '2026-09-21 11:10',
  },
]

export const initialReviews = [
  {
    id: 1,
    name: 'Atty. Victor Cruz',
    comment:
      'Exceptional detailing work on my BMW 5 Series. The ceramic coating finish is like liquid glass. Best shop in the city!',
    rating: 5,
    is_displayed: true,
    is_verified: true,
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-18T10:00:00Z',
  },
  {
    id: 2,
    name: 'Melissa Sy',
    comment:
      'The booking system is so fast and transparent. Bay status was accurate and my SUV was finished 10 minutes ahead of schedule.',
    rating: 5,
    is_displayed: true,
    is_verified: true,
    created_at: '2026-09-15T14:30:00Z',
    updated_at: '2026-09-15T14:30:00Z',
  },
  {
    id: 3,
    name: 'Captain Jason Lee',
    comment:
      'Staff is courteous and pays attention to the small details—wheels, exhaust tips, and window crevices were spotless.',
    rating: 5,
    is_displayed: true,
    is_verified: true,
    created_at: '2026-09-10T16:15:00Z',
    updated_at: '2026-09-10T16:15:00Z',
  },
]

export const initialDiscounts = [
  {
    discount_id: 1,
    name: 'First Wash Special (15% OFF)',
    type: 'percentage' as const,
    value: 15,
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    is_active: true,
    applies_to: 'all' as const,
    min_spend: 250,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    discount_id: 2,
    name: 'Ceramic Upgrade Voucher',
    type: 'fixed' as const,
    value: 500,
    valid_from: '2026-01-01',
    valid_to: '2026-12-31',
    is_active: true,
    applies_to: 'specific_services' as const,
    min_spend: 4000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]
