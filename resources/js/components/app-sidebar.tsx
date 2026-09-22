import { NavFooter } from '@/components/nav-footer'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { dashboard } from '@/routes'
import { type NavGroup, type NavItem } from '@/types'
import { router, usePage } from '@inertiajs/react'
import {
  Banknote,
  BanknoteArrowUp,
  BookOpen,
  CalendarCog,
  ChartColumnBig,
  Computer,
  Folder,
  LayoutDashboard,
  Package,
  PackageOpen,
  TableCellsMerge,
  UserCheck,
  UsersRound,
  Wrench,
  Settings2,
} from 'lucide-react'
import AppLogo from './app-logo'

interface AppSidebarProps {
  /** Current user's role (e.g. 'admin', 'customer'). If omitted, defaults to admin/mainNavItems. */
  userRole?: string
  /** Optional map of role -> NavItem[] to override navigation per role. */
  roleNavItems?: Record<string, NavItem[]>
}

const adminNavGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Core',
    items: [
      {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
      },
      {
        title: 'Registry',
        href: '/registry',
        icon: Computer,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        title: 'Bookings',
        href: '/bookings',
        icon: CalendarCog,
      },
      {
        title: 'Bays',
        href: '/bays',
        icon: TableCellsMerge,
      },
      {
        title: 'Services',
        href: '/services',
        icon: Wrench,
      },
    ],
  },
  {
    title: 'Inventory',
    items: [
      {
        title: 'Inventory',
        href: '/inventory',
        icon: Package,
      },
      {
        title: 'Pullout Requests',
        href: '/pullout-requests-page',
        icon: PackageOpen,
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        title: 'Users',
        href: '/customers',
        icon: UsersRound,
      },
      {
        title: 'Employees',
        href: '/staffs',
        icon: UserCheck,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        title: 'Transactions',
        href: '/transactions',
        icon: BanknoteArrowUp,
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: ChartColumnBig,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Moderation',
        href: '/moderation',
        icon: Settings2,
      },
    ],
  },
]

export const customerNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutDashboard,
  },
  {
    title: 'My Bookings',
    href: '/bookings',
    icon: CalendarCog,
  },
  {
    title: 'Services',
    href: '/services',
    icon: Wrench,
  },
  {
    title: 'Payment History',
    href: '/payments',
    icon: Banknote,
  },
]

const footerNavItems: NavItem[] = [
  {
    title: 'Repository',
    href: 'https://github.com/FlareItsh/Gearhead',
    icon: Folder,
  },
  {
    title: 'Documentation',
    href: 'https://laravel.com/docs/starter-kits#react',
    icon: BookOpen,
  },
]

export function AppSidebar({ userRole, roleNavItems }: AppSidebarProps) {
  const page = usePage()
  const inertiaUser = (page.props as any)?.auth?.user
  const inertiaRole = inertiaUser?.role
  const userPermissions = inertiaUser?.permissions
  const currentRole = userRole ?? inertiaRole ?? 'admin'

  // Permission Map
  const permissionMap: Record<string, string> = {
    Dashboard: 'view_dashboard',
    Registry: 'view_registry',
    Bookings: 'view_bookings',
    Bays: 'view_bays',
    Services: 'view_services',
    Inventory: 'view_inventory',
    'Pullout Requests': 'view_pullout_requests',
    Employees: 'view_employees',
    Transactions: 'view_transactions',
    Reports: 'view_reports',
    Moderation: 'manage_settings',
  }

  // Determine groups to render
  let groupsToRender: NavGroup[] = []

  if (currentRole === 'admin') {
    groupsToRender = adminNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!Array.isArray(userPermissions)) return true
          const requiredPerm = permissionMap[item.title]
          if (!requiredPerm) return true
          return userPermissions.includes(requiredPerm)
        }),
      }))
      .filter((group) => group.items.length > 0)
  } else {
    // For customers or roles with override
    const items =
      roleNavItems && roleNavItems[currentRole] ? roleNavItems[currentRole] : customerNavItems

    groupsToRender = [
      {
        title: 'Platform',
        items: items,
      },
    ]
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-fit hover:bg-transparent focus-visible:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
              onClick={() =>
                router.visit('/', {
                  preserveState: true,
                  preserveScroll: false,
                })
              }
            >
              <AppLogo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="custom-scrollbar">
        <NavMain groups={groupsToRender} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter
          items={footerNavItems}
          className="mt-auto"
        />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
