import { usePage } from '@inertiajs/react'

export function usePermissions() {
  const page = usePage()
  
  // Cast or safely destructure properties depending on how your Inertia props are typed.
  const auth = (page.props as any)?.auth
  const user = auth?.user

  // Ensure permissions is treated as an array of strings
  const permissions: string[] = Array.isArray(user?.permissions) ? user.permissions : []
  
  // Provide the helper
  const hasPermission = (key: string): boolean => {
    // If we want admins to automatically have all permissions, we could add:
    // if (user?.role === 'superadmin') return true; 

    return permissions.includes(key)
  }

  return { hasPermission, permissions, user }
}
