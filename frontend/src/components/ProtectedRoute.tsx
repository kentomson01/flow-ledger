import { Navigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { wallet } = useApp();
  if (!wallet.connected) return <Navigate to="/connect" replace />;
  return <>{children}</>;
}
