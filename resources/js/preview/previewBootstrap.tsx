import '../../css/app.css'

import PreviewNoticeModal from '@/components/PreviewNoticeModal'
import { Toaster } from '@/components/ui/sonner'
import { initializeTheme } from '@/hooks/use-appearance'
import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { route as routeFn } from 'ziggy-js'
// @ts-ignore
import { Ziggy } from '../ziggy.js'
import { getInertiaPageData, setupMockApiInterceptors } from './mockApiAdapter'

// 1. Comprehensive Ziggy Route Map with Dynamic Fallback Proxy
const previewRoutes: Record<string, any> = {
  ...(Ziggy?.routes || {}),
  home: { uri: '/', methods: ['GET', 'HEAD'] },
  dashboard: { uri: 'dashboard', methods: ['GET', 'HEAD'] },
  'customer.dashboard': { uri: 'customer-dashboard', methods: ['GET', 'HEAD'] },
  services: { uri: 'services', methods: ['GET', 'HEAD'] },
  bookings: { uri: 'bookings', methods: ['GET', 'HEAD'] },
  'customer.payments': { uri: 'payments', methods: ['GET', 'HEAD'] },
  'payments.user': { uri: 'api/payments/user', methods: ['GET', 'HEAD'] },
  'payments.count': { uri: 'api/payments/count', methods: ['GET', 'HEAD'] },
  'payments.summary': { uri: 'api/payments/summary', methods: ['GET', 'HEAD'] },
  'payments.list': { uri: 'api/payments/list', methods: ['GET', 'HEAD'] },
  'payments.monthly-revenue': { uri: 'api/payments/monthly-revenue', methods: ['GET', 'HEAD'] },
  'payments.financial-summary': { uri: 'api/payments/financial-summary', methods: ['GET', 'HEAD'] },
  'payments.average-booking-value': { uri: 'api/payments/average-booking-value', methods: ['GET', 'HEAD'] },
  'payments.retention-rate': { uri: 'api/payments/retention-rate', methods: ['GET', 'HEAD'] },
  'payment.process': { uri: 'api/payment/process', methods: ['POST'] },
  'payment.check-loyalty': { uri: 'api/payment/check-loyalty', methods: ['POST'] },
  'bookings.upcoming': { uri: 'api/bookings/upcoming', methods: ['GET', 'HEAD'] },
  'bookings.book': { uri: 'api/bookings/book', methods: ['POST'] },
  'bookings.store': { uri: 'api/bookings', methods: ['POST'] },
  'bookings.cancel': { uri: 'api/bookings/cancel/{id}', methods: ['POST'], parameters: ['id'] },
  'api.service-orders.pending': { uri: 'api/service-orders/pending', methods: ['GET', 'HEAD'] },
  'api.service-orders.active': { uri: 'api/service-orders/active', methods: ['GET', 'HEAD'] },
  'api.service-orders.today-bookings': { uri: 'api/service-orders/today-bookings', methods: ['GET', 'HEAD'] },
  'api.service-orders.bookings': { uri: 'api/service-orders/bookings', methods: ['GET', 'HEAD'] },
  'api.service-orders.update': { uri: 'api/service-orders/{id}', methods: ['PUT'], parameters: ['id'] },
  'api.service-orders.assign-employee': { uri: 'api/service-orders/{id}/assign-employee', methods: ['PUT'], parameters: ['id'] },
  'api.queues.active': { uri: 'api/queues/active', methods: ['GET', 'HEAD'] },
  'api.queues.walk-in': { uri: 'api/queues/walk-in', methods: ['POST'] },
  'api.queues.reservation': { uri: 'api/queues/reservation', methods: ['POST'] },
  'admin.staffs': { uri: 'api/staffs', methods: ['GET', 'HEAD'] },
  'admin.staffs.active-count': { uri: 'api/staffs/active-count', methods: ['GET', 'HEAD'] },
  'admin.staffs.store': { uri: 'api/staffs', methods: ['POST'] },
  'admin.staffs.update': { uri: 'api/staffs/{id}', methods: ['PUT'], parameters: ['id'] },
  'admin.staffs.delete': { uri: 'api/staffs/{id}', methods: ['DELETE'], parameters: ['id'] },
  'admin.staffs.wallet': { uri: 'api/staffs/{id}/wallet', methods: ['GET', 'HEAD'], parameters: ['id'] },
  'admin.staffs.payout': { uri: 'api/staffs/{id}/payout', methods: ['POST'], parameters: ['id'] },
  'admin.staffs.batch-payout': { uri: 'api/staffs/batch-payout', methods: ['POST'] },
  'admin.employees.active-available': { uri: 'api/employees/active-available', methods: ['GET', 'HEAD'] },
  'admin.employees.list': { uri: 'api/employees/list', methods: ['GET', 'HEAD'] },
  'admin.services.top-selling': { uri: 'api/services/top', methods: ['GET', 'HEAD'] },
  'admin.services.top-selling-with-size': { uri: 'api/services/top-with-size', methods: ['GET', 'HEAD'] },
  'admin.services.search': { uri: 'api/services/search', methods: ['GET', 'HEAD'] },
  'admin.supply-purchases.financial-summary': { uri: 'api/supply-purchases/financial-summary', methods: ['GET', 'HEAD'] },
  'supply-purchases.detailed': { uri: 'api/supply-purchases/detailed', methods: ['GET', 'HEAD'] },
  'admin.registry': { uri: 'registry', methods: ['GET', 'HEAD'] },
  'admin.customers': { uri: 'customers', methods: ['GET', 'HEAD'] },
  'api.admin.customers.index': { uri: 'api/customers/index', methods: ['GET', 'HEAD'] },
  'customers.index': { uri: 'api/customers', methods: ['GET', 'HEAD'] },
  'customers.update': { uri: 'api/customers/{id}', methods: ['PUT'], parameters: ['id'] },
  'customers.create': { uri: 'api/customers/create', methods: ['POST'] },
  'customers.list': { uri: 'api/customers/list', methods: ['GET', 'HEAD'] },
  'admin.inventory': { uri: 'inventory', methods: ['GET', 'HEAD'] },
  'admin.pullout-requests': { uri: 'pullout-requests-page', methods: ['GET', 'HEAD'] },
  'admin.transactions': { uri: 'transactions', methods: ['GET', 'HEAD'] },
  'admin.reports': { uri: 'reports', methods: ['GET', 'HEAD'] },
  'admin.bays': { uri: 'bays', methods: ['GET', 'HEAD'] },
  'admin.moderation': { uri: 'moderation', methods: ['GET', 'HEAD'] },
  'admin.moderation.loyalty': { uri: 'api/moderation/loyalty', methods: ['POST'] },
  'admin.moderation.gcash': { uri: 'api/moderation/gcash', methods: ['POST'] },
  'admin.moderation.discounts.store': { uri: 'api/moderation/discounts', methods: ['POST'] },
  'admin.moderation.discounts.update': { uri: 'api/moderation/discounts/{id}', methods: ['PUT'], parameters: ['id'] },
  'admin.moderation.discounts.destroy': { uri: 'api/moderation/discounts/{id}', methods: ['DELETE'], parameters: ['id'] },
  'admin.moderation.reviews.toggle': { uri: 'api/moderation/reviews/{id}/toggle', methods: ['POST'], parameters: ['id'] },
  'admin.moderation.reviews.destroy': { uri: 'api/moderation/reviews/{id}', methods: ['DELETE'], parameters: ['id'] },
  'reviews.list': { uri: 'api/reviews/list', methods: ['GET', 'HEAD'] },
  'reviews.store': { uri: 'api/reviews', methods: ['POST'] },
  'bays.list': { uri: 'api/bays/list', methods: ['GET', 'HEAD'] },
  'bays.available': { uri: 'api/bays/available', methods: ['GET', 'HEAD'] },
  'bays.store': { uri: 'api/bays', methods: ['POST'] },
  'bays.update': { uri: 'api/bays/{id}', methods: ['PUT'], parameters: ['id'] },
  'bays.destroy': { uri: 'api/bays/{id}', methods: ['DELETE'], parameters: ['id'] },
  'services.list': { uri: 'api/services/list', methods: ['GET', 'HEAD'] },
  'services.store': { uri: 'api/services', methods: ['POST'] },
  'services.update': { uri: 'api/services/{id}', methods: ['PUT'], parameters: ['id'] },
  'services.destroy': { uri: 'api/services/{id}', methods: ['DELETE'], parameters: ['id'] },
  'supplies.index': { uri: 'api/supplies', methods: ['GET', 'HEAD'] },
  'suppliers.index': { uri: 'api/suppliers', methods: ['GET', 'HEAD'] },
  'pullout-requests.index': { uri: 'api/pullout-requests', methods: ['GET', 'HEAD'] },
  'pullout-requests.returnable': { uri: 'api/pullout-requests/returnable/list', methods: ['GET', 'HEAD'] },
  'auth.google': { uri: 'auth/google', methods: ['GET', 'HEAD'] },
}

// Route proxy so that any unspecified route gracefully returns a synthetic definition instead of crashing
const routesProxy = new Proxy(previewRoutes, {
  get(target: any, prop: string | symbol) {
    if (typeof prop === 'string') {
      if (prop in target) return target[prop]
      const cleanUri = prop.startsWith('api.') ? prop.replace(/\./g, '/') : `api/${prop.replace(/\./g, '/')}`
      return {
        uri: cleanUri,
        methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
      }
    }
    return target[prop]
  },
})

const ziggyConfig = {
  ...Ziggy,
  url: window.location.origin,
  routes: routesProxy,
}

;(window as any).Ziggy = ziggyConfig

// Safe global route helper
;(window as any).route = (name: string, params?: any, absolute?: boolean) => {
  try {
    return routeFn(name, params, absolute, ziggyConfig)
  } catch {
    return `/${name.replace(/\./g, '/')}`
  }
}

// 2. Setup mock API and Axios/Fetch interceptors
setupMockApiInterceptors()

// 3. Initialize theme on load
initializeTheme()

// 4. Ensure #app element exists with initial data-page
let appEl = document.getElementById('app')
if (!appEl) {
  appEl = document.createElement('div')
  appEl.id = 'app'
  document.body.appendChild(appEl)
}

// Compute initial page based on current browser path
const currentPath = window.location.pathname || '/'
const initialPage = getInertiaPageData(currentPath)
appEl.setAttribute('data-page', JSON.stringify(initialPage))

// 5. ErrorBoundary to catch any unexpected component failure and prevent black screens
class SafeErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('[Preview Mode Boundary]: Component caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-center text-neutral-100">
          <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
              ⚡
            </div>
            <h2 className="text-xl font-bold text-white">Preview Notice</h2>
            <p className="mt-2 text-sm text-neutral-400">
              An unexpected issue occurred while rendering this preview component.
            </p>
            {this.state.error?.message && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 font-mono text-xs text-red-300 break-words text-left">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  router.visit('/dashboard')
                }}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-400 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// 6. Mount Inertia App
const appName = 'Gearhead'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx')),

  setup({ el, App, props }) {
    const root = createRoot(el)
    root.render(
      <SafeErrorBoundary>
        <App {...props} />
        <PreviewNoticeModal />
        <Toaster />
      </SafeErrorBoundary>
    )
  },
  progress: {
    color: '#FFD600',
  },
})

// Re-apply theme on Inertia navigation
router.on('finish', () => {
  const savedAppearance =
    (localStorage.getItem('appearance') as 'light' | 'dark' | 'system') || 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = savedAppearance === 'dark' || (savedAppearance === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
})
