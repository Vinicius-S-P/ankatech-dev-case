"use client"

import * as React from "react"
import { ToastAction as ToastActionPrimitive } from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive>
>(({ className, ...props }, ref) => (
  <ToastActionPrimitive
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:border-red-100 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastActionPrimitive.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive>
>(({ className, ...props }, ref) => (
  <ToastActionPrimitive
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-x"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  </ToastActionPrimitive>
))
ToastClose.displayName = ToastActionPrimitive.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive>
>(({ className, ...props }, ref) => (
  <ToastActionPrimitive
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastActionPrimitive.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastActionPrimitive>,
  React.ComponentPropsWithoutRef<typeof ToastActionPrimitive>
>(({ className, ...props }, ref) => (
  <ToastActionPrimitive
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastActionPrimitive.displayName

export {
  toastVariants,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
}