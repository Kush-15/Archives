import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: number;
}

interface PaymentInfo {
  id: number;
  razorpay_payment_id: string;
  status: string;
  created_at: string;
}

interface AddressInfo {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderDetail {
  order_id: string;
  status: string;
  total_amount: string;
  razorpay_order_id: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  payment: PaymentInfo | null;
  address_detail: AddressInfo | null;
}

export function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isLoggedIn, getAuthHeaders, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (!orderId) return;
    apiFetch(`/api/orders/${orderId}/`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoggedIn, orderId, getAuthHeaders, setAuthModalMode, setIsAuthModalOpen]);

  const handleCancel = async () => {
    if (!orderId || !order || order.status !== 'pending') return;
    setCancelling(true);
    setError('');
    try {
      const res = await apiFetch('/api/orders/cancel/', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : prev);
      } else {
        setError(data.error || 'Failed to cancel order.');
      }
    } catch {
      setError('Network error.');
    }
    setCancelling(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <p style={{ color: 'var(--arc-text-body)' }}>Please sign in to view order details.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--arc-text-body)' }}>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <h1 className="font-display text-3xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Order not found</h1>
          <Link to="/orders" className="text-sm uppercase tracking-[0.18em] border-b pb-1" style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = order.status === 'paid' ? '#22c55e' : order.status === 'pending' ? '#facc15' : '#f87171';
  const statusBg = order.status === 'paid' ? 'rgba(34,197,94,0.15)' : order.status === 'pending' ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)';

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <Link to="/orders" className="text-sm uppercase tracking-[0.18em] mb-6 inline-block" style={{ color: 'var(--arc-text-muted)' }}>
          &larr; Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl" style={{ color: 'var(--arc-text-light)' }}>{order.order_id}</h1>
          <span
            className="text-xs uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ background: statusBg, color: statusColor }}
          >
            {order.status}
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div className="rounded-lg overflow-hidden mb-6" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
          <div className="p-6">
            <h3 className="text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--arc-text-muted)' }}>Order Items</h3>
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--arc-border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--arc-text-light)' }}>{item.product_name}</p>
                  <p className="text-xs" style={{ color: 'var(--arc-text-muted)' }}>Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--arc-text-light)' }}>${parseFloat(item.product_price).toLocaleString()} each</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--arc-text-light)' }}>${item.subtotal.toLocaleString()}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-2">
              <span className="text-lg" style={{ color: 'var(--arc-text-body)' }}>Total</span>
              <span className="font-display text-2xl" style={{ color: 'var(--arc-text-light)' }}>${parseFloat(order.total_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {order.address_detail && (
          <div className="rounded-lg p-6 mb-6" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
            <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--arc-text-muted)' }}>Shipping Address</h3>
            <p className="text-sm" style={{ color: 'var(--arc-text-light)' }}>{order.address_detail.full_name}</p>
            <p className="text-sm" style={{ color: 'var(--arc-text-body)' }}>
              {order.address_detail.line1}{order.address_detail.line2 ? `, ${order.address_detail.line2}` : ''}
            </p>
            <p className="text-sm" style={{ color: 'var(--arc-text-body)' }}>
              {order.address_detail.city}, {order.address_detail.state} {order.address_detail.pincode}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--arc-text-muted)' }}>{order.address_detail.phone}</p>
          </div>
        )}

        {order.payment && (
          <div className="rounded-lg p-6 mb-6" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
            <h3 className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--arc-text-muted)' }}>Payment</h3>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--arc-text-body)' }}>Payment ID</span>
              <span className="font-mono" style={{ color: 'var(--arc-text-light)' }}>{order.payment.razorpay_payment_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span style={{ color: 'var(--arc-text-body)' }}>Status</span>
              <span style={{ color: order.payment.status === 'success' ? '#22c55e' : '#f87171' }}>
                {order.payment.status}
              </span>
            </div>
          </div>
        )}

        {order.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 text-sm uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
            style={{ border: '1px solid #f87171', color: '#f87171' }}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}
