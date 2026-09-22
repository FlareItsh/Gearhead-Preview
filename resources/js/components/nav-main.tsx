import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type NavGroup } from '@/types'
import { router, usePage } from '@inertiajs/react'

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
  const page = usePage()
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup
          key={group.title}
          className="px-2 py-0"
        >
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={page.url.startsWith(
                    typeof item.href === 'string' ? item.href : item.href.url,
                  )}
                  tooltip={{ children: item.title }}
                  onClick={() =>
                    router.visit(typeof item.href === 'string' ? item.href : item.href.url, {
                      preserveState: true,
                      preserveScroll: false,
                    })
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
