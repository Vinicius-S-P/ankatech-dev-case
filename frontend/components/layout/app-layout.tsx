"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Settings2,
  Users2,
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  Shield,
  BarChart3,
  Home,
  Calculator
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "João Silva",
    email: "joao@mfoffice.com",
    avatar: "",
  },
  teams: [
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
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Clientes",
      url: "/clients",
      icon: Users2,
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
  projects: [
    {
      name: "Análise de Alinhamento",
      url: "/clients?view=alignment",
      icon: Target,
    },
    {
      name: "Distribuição de Cobertura",
      url: "/insurance?view=distribution",
      icon: Shield,
    },
    {
      name: "Relatórios Avançados",
      url: "/?view=reports",
      icon: BarChart3,
    },
    {
      name: "Importação de Dados",
      url: "/clients?view=import",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
