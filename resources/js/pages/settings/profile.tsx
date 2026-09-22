import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController'
import { send } from '@/routes/verification'
import { type BreadcrumbItem, type SharedData } from '@/types'
import { Transition } from '@headlessui/react'
import { Form, Head, Link, router, useForm, usePage } from '@inertiajs/react'

import DeleteUser from '@/components/delete-user'
import HeadingSmall from '@/components/heading-small'
import InputError from '@/components/input-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import {
  isKnownVehicle,
  resolveVehicleSize,
  suggestVehicleMakes,
  suggestVehicleModels,
  type VehicleSize,
  type VehicleSuggestion,
} from '@/lib/vehicle-size-resolver'
import { destroy, store } from '@/routes/cars'
import { edit } from '@/routes/profile'
import { AlertCircle, Car as CarIcon, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile settings',
    href: edit().url,
  },
]

interface Car {
  car_id: number
  make: string
  model: string
  year: number | null
  plate_number: string | null
  color: string | null
  size: VehicleSize | null
  fuel_type: string | null
  transmission: string | null
}

export default function Profile({
  mustVerifyEmail,
  status,
  cars = [],
}: {
  mustVerifyEmail: boolean
  status?: string
  cars?: Car[]
}) {
  const { auth } = usePage().props as unknown as SharedData

  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [suggestionField, setSuggestionField] = useState<'make' | 'model' | null>(null)
  const [suggestions, setSuggestions] = useState<VehicleSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleteModalClosing, setIsDeleteModalClosing] = useState(false)
  const [carToDelete, setCarToDelete] = useState<Car | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { data, setData, post, processing, reset, errors, setError, clearErrors } = useForm({
    make: '',
    model: '',
    year: '',
    plate_number: '',
    color: '',
    size: 'Medium' as VehicleSize,
  })

  useEffect(() => {
    if (suggestionQuery.trim().length < 2 || !suggestionField) {
      setSuggestions([])
      return
    }

    setSuggestions(
      suggestionField === 'make'
        ? suggestVehicleMakes(suggestionQuery)
        : suggestVehicleModels(data.make, suggestionQuery),
    )
  }, [data.make, suggestionField, suggestionQuery])

  useEffect(() => {
    const nextSize = resolveVehicleSize(data.make, data.model)

    if (data.size !== nextSize) {
      setData('size', nextSize)
    }
  }, [data.make, data.model, data.size, setData])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectSuggestion = (suggestion: VehicleSuggestion) => {
    if (suggestionField === 'make') {
      setData({
        ...data,
        make: suggestion.make,
        size: suggestion.size,
      })
      setSuggestionQuery(suggestion.make)
    } else {
      setData({
        ...data,
        make: suggestion.make,
        model: suggestion.model,
        size: suggestion.size,
      })
      setSuggestionQuery(suggestion.model)
    }

    clearErrors('make', 'model')
    setShowSuggestions(false)
  }

  const handleAddCarSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isKnownVehicle(data.make, data.model)) {
      setError('model', 'Please choose an existing car model from the suggestions.')
      return
    }

    post(store.url(), {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        setSuggestionQuery('')
        setSuggestionField(null)
        setSuggestions([])
        clearErrors()
      },
    })
  }

  const openDeleteModal = (car: Car) => {
    setCarToDelete(car)
    setDeleteModalOpen(true)
    setIsDeleteModalClosing(false)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalClosing(true)
    setTimeout(() => {
      setCarToDelete(null)
      setDeleteModalOpen(false)
      setIsDeleteModalClosing(false)
    }, 300)
  }

  const confirmDeleteCar = () => {
    if (!carToDelete) {
      return
    }

    router.delete(destroy.url(carToDelete.car_id), {
      preserveScroll: true,
      onSuccess: closeDeleteModal,
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Profile settings" />

      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title="Profile information"
            description="Update your name and email address"
          />

          <Form
            {...ProfileController.update.form()}
            options={{
              preserveScroll: true,
            }}
            className="space-y-6"
          >
            {({ processing, recentlySuccessful, errors }) => (
              <>
                <div className="grid gap-2">
                  <div>
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.first_name}
                      name="first_name"
                      required
                      autoComplete="given-name"
                      placeholder="First name"
                    />
                    <InputError
                      className="mt-2"
                      message={errors.first_name}
                    />
                  </div>

                  <div>
                    <Label htmlFor="middle_name">Middle name</Label>
                    <Input
                      id="middle_name"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.middle_name ?? ''}
                      name="middle_name"
                      autoComplete="additional-name"
                      placeholder="Middle name (optional)"
                    />
                    <InputError
                      className="mt-2"
                      message={errors.middle_name}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div>
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.last_name}
                      name="last_name"
                      required
                      autoComplete="family-name"
                      placeholder="Last name"
                    />
                    <InputError
                      className="mt-2"
                      message={errors.last_name}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Phone number</Label>
                    <Input
                      id="phone_number"
                      className="mt-1 block w-full"
                      defaultValue={auth.user.phone_number ?? ''}
                      name="phone_number"
                      autoComplete="tel"
                      placeholder="Phone number (optional)"
                    />
                    <InputError
                      className="mt-2"
                      message={errors.phone_number}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>

                  <Input
                    id="email"
                    type="email"
                    className="mt-1 block w-full"
                    defaultValue={auth.user.email}
                    name="email"
                    required
                    autoComplete="username"
                    placeholder="Email address"
                  />

                  <InputError
                    className="mt-2"
                    message={errors.email}
                  />
                </div>

                {mustVerifyEmail && auth.user.email_verified_at === null && (
                  <div>
                    <p className="-mt-4 text-sm text-muted-foreground">
                      Your email address is unverified.{' '}
                      <Link
                        href={send()}
                        as="button"
                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                      >
                        Click here to resend the verification email.
                      </Link>
                    </p>

                    {status === 'verification-link-sent' && (
                      <div className="mt-2 text-sm font-medium text-green-600">
                        A new verification link has been sent to your email address.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    disabled={processing}
                    data-test="update-profile-button"
                    variant="highlight"
                  >
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Save
                  </Button>

                  <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                  >
                    <p className="text-sm text-neutral-600">Saved</p>
                  </Transition>
                </div>
              </>
            )}
          </Form>

          <div className="space-y-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <HeadingSmall
              title="Vehicle settings"
              description="Add and manage the vehicles associated with your profile"
            />

            {/* Registered Cars */}
            <div className="space-y-4">
              {cars.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-6 text-center backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/50">
                  <CarIcon className="mb-2 h-10 w-10 animate-bounce text-neutral-400 dark:text-neutral-600" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    No vehicles registered
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Add your vehicles below to keep track of them.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {cars.map((car) => (
                    <div
                      key={car.car_id}
                      className="relative flex flex-col justify-between rounded-xl border border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-neutral-700"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
                              <CarIcon className="h-4 w-4 text-neutral-500" />
                              {car.year ? `${car.year} ` : ''}
                              {car.make} {car.model}
                            </h4>
                            {car.plate_number && (
                              <p className="mt-1.5 inline-block rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                {car.plate_number}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => openDeleteModal(car)}
                            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
                            title="Delete vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {car.color && (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                              {car.color}
                            </span>
                          )}
                          {car.size && (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                              {car.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Car Form */}
            <div className="space-y-4 rounded-xl border border-neutral-200 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Add a new vehicle
              </h4>

              <form
                onSubmit={handleAddCarSubmit}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="relative"
                    ref={suggestionField === 'make' ? suggestionsRef : undefined}
                  >
                    <Label htmlFor="car_make">Make *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="car_make"
                        type="text"
                        name="make"
                        value={data.make}
                        onChange={(e) => {
                          setData('make', e.target.value)
                          setSuggestionField('make')
                          setSuggestionQuery(e.target.value)
                          setShowSuggestions(true)
                        }}
                        onFocus={() => {
                          setSuggestionField('make')
                          setSuggestionQuery(data.make)
                          setShowSuggestions(true)
                        }}
                        placeholder="e.g. Toyota"
                        className="w-full pr-10"
                        required
                      />
                    </div>
                    {errors.make && (
                      <InputError
                        message={errors.make}
                        className="mt-1"
                      />
                    )}

                    {showSuggestions && suggestionField === 'make' && suggestions.length > 0 && (
                      <div className="absolute right-0 left-0 z-50 mt-1 max-h-60 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-xl dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.make}-${suggestion.model}`}
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className="group flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            <span className="font-semibold text-neutral-800 group-hover:text-black dark:text-neutral-200 dark:group-hover:text-white">
                              {suggestion.make}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    className="relative"
                    ref={suggestionField === 'model' ? suggestionsRef : undefined}
                  >
                    <Label htmlFor="car_model">Model *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="car_model"
                        type="text"
                        name="model"
                        value={data.model}
                        onChange={(e) => {
                          setData('model', e.target.value)
                          setSuggestionField('model')
                          setSuggestionQuery(e.target.value)
                          setShowSuggestions(true)
                        }}
                        onFocus={() => {
                          setSuggestionField('model')
                          setSuggestionQuery(data.model)
                          setShowSuggestions(true)
                        }}
                        placeholder="e.g. Camry (type to search)"
                        className="w-full pr-10"
                        required
                      />
                    </div>
                    {errors.model && (
                      <InputError
                        message={errors.model}
                        className="mt-1"
                      />
                    )}

                    {/* Suggestions list */}
                    {showSuggestions && suggestionField === 'model' && suggestions.length > 0 && (
                      <div className="absolute right-0 left-0 z-50 mt-1 max-h-60 divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-xl dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.make}-${suggestion.model}`}
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className="group flex w-full items-center justify-between px-4 py-2.5 text-left text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            <div>
                              <span className="font-semibold text-neutral-800 group-hover:text-black dark:text-neutral-200 dark:group-hover:text-white">
                                {suggestion.make} {suggestion.model}
                              </span>
                            </div>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 group-hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:group-hover:bg-neutral-700">
                              {suggestion.size}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="car_year">Year</Label>
                    <Input
                      id="car_year"
                      type="number"
                      name="year"
                      value={data.year}
                      onChange={(e) => setData('year', e.target.value)}
                      placeholder="e.g. 2020"
                      className="mt-1 w-full"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                    {errors.year && (
                      <InputError
                        message={errors.year}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="car_plate">Plate Number</Label>
                    <Input
                      id="car_plate"
                      type="text"
                      name="plate_number"
                      value={data.plate_number}
                      onChange={(e) => setData('plate_number', e.target.value)}
                      placeholder="e.g. ABC 1234"
                      className="mt-1 w-full"
                    />
                    {errors.plate_number && (
                      <InputError
                        message={errors.plate_number}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <div>
                    <Label htmlFor="car_color">Color</Label>
                    <Input
                      id="car_color"
                      type="text"
                      name="color"
                      value={data.color}
                      onChange={(e) => setData('color', e.target.value)}
                      placeholder="e.g. Black"
                      className="mt-1 w-full"
                    />
                    {errors.color && (
                      <InputError
                        message={errors.color}
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold tracking-wider text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                    {data.size}
                  </span>
                  <Button
                    type="submit"
                    disabled={processing}
                    variant="highlight"
                    className="flex items-center gap-1.5"
                  >
                    {processing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add Vehicle
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {deleteModalOpen && carToDelete && (
          <div
            className={`fixed inset-0 z-[2000] flex h-screen w-full items-center justify-center p-4 transition-all duration-300 ${isDeleteModalClosing ? 'opacity-0' : 'bg-black/10 backdrop-blur-xl'}`}
          >
            <button
              type="button"
              aria-label="Close delete vehicle confirmation"
              className="fixed inset-0 cursor-default"
              onClick={closeDeleteModal}
            />
            <div
              className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-background p-8 text-center shadow-2xl transition-all duration-300 ${isDeleteModalClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500">
                <AlertCircle className="h-10 w-10" />
              </div>

              <h3 className="mb-2 text-center text-2xl font-black text-foreground">
                Delete Vehicle?
              </h3>
              <p className="mb-8 text-center text-muted-foreground">
                This will remove{' '}
                <span className="font-bold text-foreground">
                  {carToDelete.year ? `${carToDelete.year} ` : ''}
                  {carToDelete.make} {carToDelete.model}
                </span>{' '}
                from your profile. This action cannot be undone.
              </p>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeDeleteModal}
                  className="h-14 flex-1 rounded-2xl font-black transition-transform active:scale-95"
                >
                  No, Keep it
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDeleteCar}
                  className="h-14 flex-1 rounded-2xl font-black shadow-lg shadow-rose-500/20 transition-transform hover:bg-rose-600 active:scale-95"
                >
                  Yes, Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        <DeleteUser />
      </SettingsLayout>
    </AppLayout>
  )
}
