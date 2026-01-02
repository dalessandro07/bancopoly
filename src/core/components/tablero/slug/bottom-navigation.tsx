'use client'

import { Badge } from '@/src/core/components/ui/badge'
import { cn } from '@/src/core/lib/utils'
import { HistoryIcon, HomeIcon, SettingsIcon } from 'lucide-react'

type TabType = 'inicio' | 'historial' | 'configuracion'

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  unreadCount?: number
}

export default function BottomNavigation({ activeTab, onTabChange, unreadCount = 0 }: BottomNavigationProps) {
  const tabs = [
    { id: 'inicio' as TabType, label: 'Inicio', icon: HomeIcon },
    { id: 'historial' as TabType, label: 'Historial', icon: HistoryIcon, badge: unreadCount },
    { id: 'configuracion' as TabType, label: 'Configuración', icon: SettingsIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className="size-5" />
              {badge !== undefined && badge > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 px-1.5"
                >
                  {badge > 99 ? '99+' : badge}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export type { TabType }
