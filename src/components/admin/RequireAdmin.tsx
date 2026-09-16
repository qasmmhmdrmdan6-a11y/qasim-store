import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/** Wrap admin routes with this to enforce the auth + admin_users check. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-ivory-muted">
        جاري التحقق من الدخول...
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
