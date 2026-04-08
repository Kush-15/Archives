import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// --- Types ---
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

// --- Stripe Checkout Form Component ---
const StripeCheckoutForm = ({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, 
      },
      redirect: "if_required"
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Unexpected state encountered.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-lg" style={{ background: 'var(--arc-glass-strong)', border: '1px solid var(--arc-border)' }}>
      <PaymentElement className="mb-6" />
      
      {error && (
        <div className="mb-4 text-sm" style={{ color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 text-sm uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
          style={{ background: 'var(--arc-indigo)', color: 'var(--arc-text-light)' }}
        >
          {loading ? 'Processing Protocol...' : `Pay ₹${amount.toLocaleString()}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 text-sm uppercase tracking-wider rounded-md transition-colors"
          style={{ border: '1px solid var(--arc-border)', color: 'var(--arc-text-body)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// --- Main Checkout Component ---
export function Checkout() {
  const { items, totalPrice, clearCart, closeCart } = useCart();
  const { isLoggedIn, getAuthHeaders, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Stripe specifics
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    closeCart();
  }, [closeCart]);

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
        if (data.publishable_key) {
           setStripePromise(loadStripe(data.publishable_key));
        }
      })
      .catch(() => {
        setError('Failed to initialize payment gateway. Please refresh the page.');
      });

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
      .catch(() => {
        setError('Failed to load saved addresses. Please try again.');
      });
  }, [isLoggedIn, getAuthHeaders]);

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

  // Generate Stripe Intent
  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      setError('Please select or add an address.');
      return;
    }
    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }
    if (!stripePromise) {
      setError('Payment gateway not configured correctly.');
      return;
    }

    setError('');
    setLoading(true);

    try {
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
        }
        setLoading(false);
        return;
      }
      
      setClientSecret(orderData.clientSecret);
      setLoading(false);

    } catch {
      setError('Something went wrong contacting the server.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
      // Cross-verify with our backend
      try {
        const verifyRes = await apiFetch('/api/payment/verify/', {
           method: 'POST',
           headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
           body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });
        const verifyData = await verifyRes.json();
        
        if (verifyData.status === 'success') {
          clearCart();
          navigate(`/order-confirmation?order_id=${verifyData.order_id}`);
        } else {
          setError('Order recorded but payment verification mismatch. Please contact support.');
        }
      } catch {
         setError('Failed to verify payment with our servers.');
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

        {/* Provide Stripe fallback if intent active */}
        {clientSecret && stripePromise ? (
           <div className="mb-10 animate-fade-in">
              <h2 className="font-display text-xl mb-4" style={{ color: 'var(--arc-text-light)' }}>Complete Payment</h2>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
                 <StripeCheckoutForm 
                    amount={totalPrice} 
                    onSuccess={handlePaymentSuccess} 
                    onCancel={() => setClientSecret('')} 
                 />
              </Elements>
           </div>
        ) : (
          <>
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
                    {(['full_name', 'phone', 'line1', 'line2', 'city', 'state', 'pincode'] as const).map(field => {
                      const fieldNameMap: Record<string, string> = {
                        full_name: 'Full Name',
                        phone: 'Phone',
                        line1: 'Address Line 1',
                        line2: 'Address Line 2 (Optional)',
                        city: 'City',
                        state: 'State',
                        pincode: 'Pincode',
                      };
                      return (
                      <div key={field} className={field === 'line1' || field === 'line2' ? 'md:col-span-2' : ''}>
                        <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--arc-text-muted)' }}>
                          {fieldNameMap[field]}
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
                      );
                    })}
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

            {/* Initiate Process */}
            <button
              onClick={handleProceedToPayment}
              disabled={loading || !selectedAddressId || items.length === 0}
              className="w-full py-4 text-sm uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
              style={{ background: 'var(--arc-indigo)', color: 'var(--arc-text-light)' }}
            >
              {loading ? 'Processing...' : `Continue to Payment`}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
