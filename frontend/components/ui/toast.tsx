import * as React from "react"
import { clsx } from "clsx"
import { X } from "lucide-react"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning'
  onClose?: () => void
}

const toastVariants = {
  default: 'bg-card text-card-foreground border border-border',
  success: 'bg-success-green/10 text-success-green border border-success-green/20',
  error: 'bg-error-red/10 text-error-red border border-error-red/20',
  warning: 'bg-primary-blue/10 text-primary-blue border border-primary-blue/20',
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = 'default', onClose, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'relative flex items-center justify-between rounded-lg p-4 shadow-lg transition-all',
          toastVariants[variant],
          className
        )}
        {...props}
      >
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 rounded-md p-1 hover:bg-background/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
