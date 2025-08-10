import React from "react";
import { MainNav } from "@/components/nav-main";
import { UserNav } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <TeamSwitcher />
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <SuggestionsPanel />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;