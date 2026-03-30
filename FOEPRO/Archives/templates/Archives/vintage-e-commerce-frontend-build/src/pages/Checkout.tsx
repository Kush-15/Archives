import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface AddressForm {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

interface SavedAddress {
  id: number;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const emptyAddress: AddressForm = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
};

export function Checkout() {
  const { items, totalPrice, clearCart, setIsCartOpen } = useCart();
  const { isLoggedIn, getAuthHeaders, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayKey, setRazorpayKey] = useState('');

  useEffect(() => {
    setIsCartOpen(false);
  }, [setIsCartOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  }, [isLoggedIn, setAuthModalMode, setIsAuthModalOpen]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const headers = getAuthHeaders();

    apiFetch('/api/payment/key/', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.key_id) setRazorpayKey(data.key_id);
      })
      .catch(() => {});

    apiFetch('/api/addresses/', { headers })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAddresses(data);
          const def = data.find((a: SavedAddress) => a.is_default);
          if (def) setSelectedAddressId(def.id);
          else if (data.length) setSelectedAddressId(data[0].id);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, getAuthHeaders]);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveAddress = async () => {
    setError('');
    const { full_name, phone, line1, city, state, pincode } = addressForm;
    if (!full_name || !phone || !line1 || !city || !state || !pincode) {
      setError('Please fill all required address fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/addresses/create/', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(prev => [data, ...prev]);
        setSelectedAddressId(data.id);
        setShowAddressForm(false);
        setAddressForm(emptyAddress);
      } else {
        if (res.status === 401) {
          setError('Session expired. Please log in again.');
          setIsAuthModalOpen(true);
          setAuthModalMode('login');
        } else {
          setError(data.error || 'Failed to save address.');
        }
      }
    } catch {
      setError('Network error.');
    }
    setLoading(false);
  };

  const handlePay = async () => {
    if (!selectedAddressId) {
      setError('Please select or add an address.');
      return;
    }
    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }
    if (!razorpayKey) {
      setError('Payment gateway not configured.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway.');
        setLoading(false);
        return;
      }

      const orderRes = await apiFetch('/api/payment/create-order/', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_id: selectedAddressId,
          items: items.map(item => ({ product_id: item.product.id, quantity: item.quantity })),
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderRes.status === 401) {
          setError('Session expired. Please log in again.');
          setIsAuthModalOpen(true);
          setAuthModalMode('login');
        } else {
          setError(orderData.error || 'Failed to create order.');
          if (orderData.details) {
            setError(orderData.details.map((d: { product_name: string; requested: number; available: number }) =>
              `${d.product_name}: requested ${d.requested}, available ${d.available}`).join('; '));
          }
        }
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'The Archives',
        description: `Order ${orderData.order_id}`,
        order_id: orderData.razorpay_order_id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await apiFetch('/api/payment/verify/', {
              method: 'POST',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              clearCart();
              navigate(`/order-confirmation?order_id=${verifyData.order_id}`);
            } else {
              setError('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          } catch {
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await apiFetch('/api/orders/cancel/', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderData.order_id }),
              });
            } catch {}
            setError('Payment was cancelled.');
            setLoading(false);
          },
        },
        prefill: {
          name: addresses.find(a => a.id === selectedAddressId)?.full_name || '',
          contact: addresses.find(a => a.id === selectedAddressId)?.phone || '',
        },
        theme: { color: '#4338ca' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <p style={{ color: 'var(--arc-text-body)' }}>Please sign in to checkout.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <h1 className="font-display text-3xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Your cart is empty</h1>
          <button
            onClick={() => navigate('/catalog')}
            className="text-sm uppercase tracking-[0.18em] border-b pb-1 transition-colors"
            style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}
          >
            Browse Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <h1 className="font-display text-4xl mb-10" style={{ color: 'var(--arc-text-light)' }}>Checkout</h1>

        {error && (
          <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* Address Section */}
        <div className="mb-10">
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Delivery Address</h2>

          {addresses.length > 0 && !showAddressForm && (
            <div className="space-y-3 mb-4">
              {addresses.map(addr => (
                <label
                  key={addr.id}
                  className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: selectedAddressId === addr.id ? 'var(--arc-glass-strong)' : 'transparent',
                    border: `1px solid ${selectedAddressId === addr.id ? 'var(--arc-indigo)' : 'var(--arc-border)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--arc-text-light)' }}>{addr.full_name}</p>
                    <p className="text-sm" style={{ color: 'var(--arc-text-body)' }}>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm" style={{ color: 'var(--arc-text-body)' }}>{addr.city}, {addr.state} {addr.pincode}</p>
                    <p className="text-sm" style={{ color: 'var(--arc-text-muted)' }}>{addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!showAddressForm && (
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-sm uppercase tracking-[0.18em] border-b pb-1 transition-colors"
              style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}
            >
              + Add New Address
            </button>
          )}

          {showAddressForm && (
            <div className="p-6 rounded-lg" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['full_name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'] as const).map(field => (
                  <div key={field} className={field === 'line1' || field === 'line2' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--arc-text-muted)' }}>
                      {field.replace(/_/g, ' ').replace('line1', 'Address Line 1').replace('line2', 'Address Line 2').replace('pincode', 'Pincode')}
                      {field !== 'line2' && <span style={{ color: '#fca5a5' }}>*</span>}
                    </label>
                    <input
                      name={field}
                      value={addressForm[field]}
                      onChange={handleAddressChange}
                      className="w-full px-3 py-2 rounded-md text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--arc-border)', color: 'var(--arc-text-light)' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveAddress}
                  disabled={loading}
                  className="px-6 py-2 text-sm uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
                  style={{ background: 'var(--arc-indigo)', color: 'var(--arc-text-light)' }}
                >
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  onClick={() => { setShowAddressForm(false); setAddressForm(emptyAddress); setError(''); }}
                  className="px-6 py-2 text-sm uppercase tracking-wider rounded-md transition-colors"
                  style={{ border: '1px solid var(--arc-border)', color: 'var(--arc-text-body)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="mb-10">
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Order Summary</h2>
          <div className="rounded-lg overflow-hidden" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
            {items.map(item => (
              <div key={item.product.id} className="flex items-center gap-4 p-4" style={{ borderBottom: '1px solid var(--arc-border)' }}>
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--arc-text-light)' }}>{item.product.name}</p>
                  <p className="text-xs" style={{ color: 'var(--arc-text-muted)' }}>Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--arc-text-light)' }}>
                  ₹{(item.product.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center p-4">
              <span className="text-lg" style={{ color: 'var(--arc-text-body)' }}>Total</span>
              <span className="font-display text-2xl" style={{ color: 'var(--arc-text-light)' }}>₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading || !selectedAddressId || items.length === 0}
          className="w-full py-4 text-sm uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
          style={{ background: 'var(--arc-indigo)', color: 'var(--arc-text-light)' }}
        >
          {loading ? 'Processing...' : `Pay ₹${totalPrice.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
