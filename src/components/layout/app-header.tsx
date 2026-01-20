'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, LogOut, Plus, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AppHeaderProps {
  user: SupabaseUser
}

export function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Evita hydration mismatch do DropdownMenu (Radix gera IDs diferentes no SSR vs client)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const avatarUrl = user.user_metadata?.avatar_url

  const UserAvatar = () => (
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt={displayName}
        className="h-10 w-10 rounded-full object-cover"
      />
    ) : (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
    )
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/app" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Adapte Minha Prova
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/app/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova adaptação
            </Link>
          </Button>

          {isMounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
              <UserAvatar />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
