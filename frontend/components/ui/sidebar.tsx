import React from "react";
import { cn } from "@/lib/utils";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex h-full flex-col overflow-y-auto border-r bg-background p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Sidebar.displayName = "Sidebar";

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mb-4 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarHeader.displayName = "SidebarHeader";

interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarBody = React.forwardRef<HTMLDivElement, SidebarBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props}>
      {children}
    </div>
  )
);
SidebarBody.displayName = "SidebarBody";

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mt-4 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  )
);
SidebarFooter.displayName = "SidebarFooter";

export {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
};