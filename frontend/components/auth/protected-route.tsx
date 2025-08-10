"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  // This is a placeholder for actual authentication logic.
  // In a real application, you would check for a valid token or session.
  const isAuthenticated = true; // Assume authenticated for now

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated && pathname !== "/login") {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};

export default ProtectedRoute;