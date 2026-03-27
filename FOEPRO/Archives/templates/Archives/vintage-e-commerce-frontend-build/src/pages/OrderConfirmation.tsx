import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface OrderDetail {
  order_id: string;
  status: string;
  total_amount: string;
  created_at: string;
  items: { id: number; product_name: string; product_price: string; quantity: number; subtotal: number }[];
  address_detail: { full_name: string; line1: string; line2: string; city: string; state: string; pincode: string } | null;
}

export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }
    apiFetch(`/api/orders/${orderId}/`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId, getAuthHeaders, navigate]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--arc-text-body)' }}>Loading...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <h1 className="font-display text-3xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Order not found</h1>
          <Link to="/orders" className="text-sm uppercase tracking-[0.18em] border-b pb-1" style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}>
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.status === 'paid';

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 md:px-12 text-center">
        {isPaid ? (
          <>
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <svg className="w-8 h-8" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--arc-text-light)' }}>Payment Successful</h1>
            <p className="text-sm mb-8" style={{ color: 'var(--arc-text-body)' }}>Your order has been confirmed.</p>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--arc-text-light)' }}>Order {order.status}</h1>
            <p className="text-sm mb-8" style={{ color: 'var(--arc-text-body)' }}>There was an issue with your payment.</p>
          </>
        )}

        <div className="rounded-lg p-6 mb-8 text-left" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm" style={{ color: 'var(--arc-text-muted)' }}>Order ID</span>
            <span className="font-mono text-sm" style={{ color: 'var(--arc-text-light)' }}>{order.order_id}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm" style={{ color: 'var(--arc-text-muted)' }}>Status</span>
            <span className="text-sm uppercase tracking-wider font-medium" style={{ color: isPaid ? '#22c55e' : '#f87171' }}>
              {order.status}
            </span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm" style={{ color: 'var(--arc-text-muted)' }}>Total</span>
            <span className="font-display text-xl" style={{ color: 'var(--arc-text-light)' }}>${parseFloat(order.total_amount).toLocaleString()}</span>
          </div>

          <div style={{ borderTop: '1px solid var(--arc-border)', paddingTop: '1rem' }}>
            <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--arc-text-muted)' }}>Items</h3>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span style={{ color: 'var(--arc-text-body)' }}>{item.product_name} x{item.quantity}</span>
                <span style={{ color: 'var(--arc-text-light)' }}>${parseFloat(item.product_price).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {order.address_detail && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--arc-border)' }}>
              <h3 className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--arc-text-muted)' }}>Shipping To</h3>
              <p className="text-sm" style={{ color: 'var(--arc-text-body)' }}>
                {order.address_detail.full_name}, {order.address_detail.line1}
                {order.address_detail.line2 ? `, ${order.address_detail.line2}` : ''}, {order.address_detail.city}, {order.address_detail.state} {order.address_detail.pincode}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3 text-sm uppercase tracking-wider rounded-md transition-colors"
            style={{ border: '1px solid var(--arc-border)', color: 'var(--arc-text-light)' }}
          >
            View Orders
          </Link>
          <Link
            to="/catalog"
            className="px-6 py-3 text-sm uppercase tracking-wider rounded-md transition-colors"
            style={{ background: 'var(--arc-indigo)', color: 'var(--arc-text-light)' }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
