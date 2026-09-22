import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController'
import { getPendingBooking } from '@/lib/pendingBooking'
import { login } from '@/routes'
import { Form, Head } from '@inertiajs/react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import InputError from '@/components/input-error'
import TextLink from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/auth-layout'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [defaultValues, setDefaultValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  useEffect(() => {
    const pending = getPendingBooking()
    if (pending && pending.guestInfo) {
      // Split the name into first and last name
      const nameParts = pending.guestInfo.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setDefaultValues({
        firstName,
        lastName,
        email: pending.guestInfo.email,
      })
    }
  }, [])

  return (
    <AuthLayout
      title="Create an account"
      description="Enter your details below to create your account"
    >
      <Head title="Register" />

      <Form
        {...RegisteredUserController.store.form()}
        resetOnSuccess={['password', 'password_confirmation']}
        disableWhileProcessing
        className="flex flex-col gap-6"
      >
        {({ processing, errors }) => (
          <>
            <div className="grid gap-6">

              <div className="flex flex-col sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    required
                    autoFocus
                    tabIndex={1}
                    autoComplete="given-name"
                    name="first_name"
                    placeholder="First name"
                    defaultValue={defaultValues.firstName}
                  />
                  <InputError
                    message={errors.first_name}
                    className="mt-2"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    required
                    tabIndex={2}
                    autoComplete="family-name"
                    name="last_name"
                    placeholder="Last name"
                    defaultValue={defaultValues.lastName}
                  />
                  <InputError
                    message={errors.last_name}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  tabIndex={3}
                  autoComplete="email"
                  name="email"
                  placeholder="email@example.com"
                  defaultValue={defaultValues.email}
                />
                <InputError message={errors.email} />
              </div>

              {/* PASSWORD FIELD WITH EYE TOGGLE */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    tabIndex={4}
                    autoComplete="new-password"
                    name="password"
                    placeholder="Password"
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <InputError message={errors.password} />
              </div>

              {/* CONFIRM PASSWORD FIELD WITH EYE TOGGLE */}
              <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirm password</Label>

                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    tabIndex={5}
                    autoComplete="new-password"
                    name="password_confirmation"
                    placeholder="Confirm password"
                    className="pr-10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <InputError message={errors.password_confirmation} />
              </div>

              <Button
                type="submit"
                variant="highlight"
                className="mt-2 w-full"
                tabIndex={6}
                data-test="register-user-button"
              >
                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Create account
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full bg-white dark:bg-card"
                onClick={() => (window.location.href = route('auth.google'))}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <TextLink
                href={login()}
                tabIndex={6}
              >
                Log in
              </TextLink>
            </div>
          </>
        )}
      </Form>
    </AuthLayout>
  )
}
