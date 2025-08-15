"use client"

import * as React from "react"
import {
  Users2,
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  Shield,
  LayoutDashboard,
  Calculator,
  GalleryVerticalEnd,
  AudioWaveform,
  Command
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useAuth } from "@/hooks/use-api"

interface Team {
  name: string;
  logo: React.ElementType;
  plan: string;
}

const data = {
  navMain: [
    {
      title: "Clientes",
      url: "/clients",
      icon: Users2,
    },
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Metas Financeiras",
      url: "/goals",
      icon: Target,
    },
    {
      title: "Portfólio",
      url: "/portfolio",
      icon: Wallet,
    },
    {
      title: "Projeções",
      url: "/projections",
      icon: TrendingUp,
    },
    {
      title: "Eventos",
      url: "/events",
      icon: Calendar,
    },
    {
      title: "Simulações",
      url: "/simulations",
      icon: Calculator,
    },
    {
      title: "Seguros",
      url: "/insurance",
      icon: Shield,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { getUser } = useAuth()
  const currentUser = getUser()

  const user = currentUser ? {
    name: currentUser.name || "",
    email: currentUser.email || "",
    avatar: currentUser.avatar || "",
  } : {
    name: "",
    email: "",
    avatar: "",
  }

  const teams: Team[] = currentUser && currentUser.teams && currentUser.teams.length > 0 ? currentUser.teams.map((team: Team) => ({
    name: team.name,
    logo: team.logo,
    plan: team.plan,
  })) : [
    {
      name: "Financial Planner",
      logo: GalleryVerticalEnd,
      plan: "Multi Family Office",
    },
    {
      name: "Investimentos Corp",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Patrimônio Ltda",
      logo: Command,
      plan: "Free",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}