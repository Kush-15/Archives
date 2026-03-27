import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface OrderSummary {
  order_id: string;
  status: string;
  total_amount: string;
  created_at: string;
  items: { id: number; product_name: string; quantity: number }[];
}

export function Orders() {
  const { isLoggedIn, getAuthHeaders, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    apiFetch('/api/orders/', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoggedIn, getAuthHeaders, setAuthModalMode, setIsAuthModalOpen]);

  if (!isLoggedIn) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <p style={{ color: 'var(--arc-text-body)' }}>Please sign in to view your orders.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--arc-text-body)' }}>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <h1 className="font-display text-4xl mb-10" style={{ color: 'var(--arc-text-light)' }}>Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4" style={{ color: 'var(--arc-text-body)' }}>No orders yet.</p>
            <Link
              to="/catalog"
              className="text-sm uppercase tracking-[0.18em] border-b pb-1 transition-colors"
              style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link
                key={order.order_id}
                to={`/orders/${order.order_id}`}
                className="block p-6 rounded-lg transition-colors hover:opacity-90"
                style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-sm" style={{ color: 'var(--arc-text-light)' }}>{order.order_id}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--arc-text-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{
                      background: order.status === 'paid' ? 'rgba(34,197,94,0.15)' : order.status === 'pending' ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)',
                      color: order.status === 'paid' ? '#22c55e' : order.status === 'pending' ? '#facc15' : '#f87171',
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-sm truncate max-w-[60%]" style={{ color: 'var(--arc-text-body)' }}>
                    {order.items.map(i => `${i.product_name} (x${i.quantity})`).join(', ')}
                  </p>
                  <span className="font-display text-lg" style={{ color: 'var(--arc-text-light)' }}>
                    ${parseFloat(order.total_amount).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
