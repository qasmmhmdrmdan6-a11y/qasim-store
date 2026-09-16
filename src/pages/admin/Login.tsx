import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { signInAdmin } from '@/hooks/useAdminAuth';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInAdmin(email, password);
      navigate('/admin');
    } catch {
      toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-ink px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="font-display text-xl text-ivory">تسجيل دخول الأدمن</h1>
        <p className="mt-1 text-sm text-ivory-muted">QASIM Store — لوحة التحكم</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm text-ivory-muted">
            البريد الإلكتروني
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-ivory outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ivory-muted">
            كلمة المرور
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border border-surface-border bg-surface-2 px-3 py-2.5 text-ivory outline-none focus:border-gold"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonClasses('primary', 'md', 'mt-2')}
          >
            {isSubmitting ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </Card>
    </div>
  );
}
