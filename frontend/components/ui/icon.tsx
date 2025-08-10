import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps extends React.SVGAttributes<SVGElement> {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ icon: IconComponent, size = 24, className, ...props }) => {
  return (
    <IconComponent size={size} className={cn("inline-block", className)} {...props} />
  );
};

export { Icon };