import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { router } from '@inertiajs/react'
import {
  CheckCircle2,
  ChevronRight,
  Database,
  Info,
  RotateCcw,
  Shield,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { mockStorage } from '../preview/mockStorage'

export default function PreviewNoticeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [currentRole, setCurrentRole] = useState<'admin' | 'customer'>('admin')

  useEffect(() => {
    setCurrentRole(mockStorage.getCurrentRole())
    const dismissed = mockStorage.isNoticeDismissed()
    if (!dismissed) {
      // Show modal on first visit after a slight smooth delay
      const timer = setTimeout(() => setIsOpen(true), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    if (dontShowAgain) {
      mockStorage.setNoticeDismissed(true)
    }
    setIsOpen(false)
  }

  const handleSelectRole = (role: 'admin' | 'customer', targetRoute: string) => {
    mockStorage.setCurrentRole(role)
    setCurrentRole(role)
    if (dontShowAgain) {
      mockStorage.setNoticeDismissed(true)
    }
    setIsOpen(false)
    toast.success(`Switched to ${role === 'admin' ? 'Admin' : 'Customer'} demo role`)
    router.visit(targetRoute)
  }

  const handleResetData = () => {
    mockStorage.resetToDefaults()
    toast.success('Demo data restored to initial state!')
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <>
      {/* Floating Pill / Badge (Always accessible) */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full border border-yellow-500/30 bg-neutral-950/85 px-4 py-2 text-xs font-semibold text-neutral-200 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:border-yellow-400 hover:bg-neutral-900 hover:text-white hover:shadow-yellow-500/10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </span>
          <span className="tracking-wide">
            Preview Mode: <span className="font-bold text-yellow-400 capitalize">{currentRole}</span>
          </span>
          <Sparkles className="size-3.5 text-yellow-400 transition-transform group-hover:rotate-12" />
        </button>
      </div>

      {/* Main Preview Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950/95 p-6 shadow-2xl text-neutral-100 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>

            {/* Header Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
              <Zap className="size-3.5 fill-current" />
              <span>Interactive Demonstration</span>
            </div>

            {/* Modal Title & Description */}
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Gearhead Carwash & Detailing
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              You are exploring a fully functional, zero-latency preview environment. All database queries, appointments, bay statuses, and inventory transactions run directly in your browser with persistent local storage.
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3">
                <Database className="mt-0.5 size-4 shrink-0 text-yellow-400" />
                <div>
                  <p className="font-semibold text-neutral-200">Local Persistence</p>
                  <p className="text-neutral-400">Edits and bookings stay saved on this device.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-neutral-200">Realistic Seed Data</p>
                  <p className="text-neutral-400">Pre-populated with active bays & sales metrics.</p>
                </div>
              </div>
            </div>

            {/* Role Exploration Selection */}
            <div className="mt-6 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Choose an experience to explore:
              </p>

              {/* Admin Button */}
              <button
                onClick={() => handleSelectRole('admin', '/dashboard')}
                className="group flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5 text-left transition-all hover:border-yellow-500/50 hover:bg-neutral-850 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Operations Admin</span>
                      <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">Full Access</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Manage bays, queue tickets, inventory supplies & financial ledgers.
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-neutral-500 group-hover:translate-x-1 group-hover:text-yellow-400 transition-all" />
              </button>

              {/* Customer Button */}
              <button
                onClick={() => handleSelectRole('customer', '/services')}
                className="group flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5 text-left transition-all hover:border-yellow-500/50 hover:bg-neutral-850 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-black transition-colors">
                    <User className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Customer Portal</span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">Booking</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Browse detailing packages, select vehicle sizes & book slots.
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-neutral-500 group-hover:translate-x-1 group-hover:text-yellow-400 transition-all" />
              </button>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-neutral-800/80 pt-4">
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
                <Checkbox
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(Boolean(checked))}
                />
                <span>Don't show again on this device</span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetData}
                  className="text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Reset Data
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="border-neutral-750 bg-neutral-900 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white"
                >
                  Explore Site
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
