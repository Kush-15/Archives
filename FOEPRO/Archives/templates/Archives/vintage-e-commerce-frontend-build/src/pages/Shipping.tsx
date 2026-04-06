import { Link } from 'react-router-dom';

export function Shipping() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Information</p>
          <h1 className="arc-page-title animate-slide-up">Shipping Information</h1>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            We take great care in packaging and shipping each vintage item to ensure it arrives safely at your doorstep.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Domestic Shipping */}
          <div
            className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-10 animate-fade-in"
            style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--arc-border)' }}
          >
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--arc-indigo)',
                opacity: 0.7,
              }}>
                §01
              </span>
              <h2 className="mt-2" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                lineHeight: '1.6',
              }}>
                Domestic Shipping
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>We ship to all locations within India using trusted courier partners.</p>
                <div className="mt-4">
                  <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Standard Delivery</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Delivery Time: 5-7 business days</span></li>
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Free shipping on orders above ₹5,000</span></li>
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Flat ₹150 for orders below ₹5,000</span></li>
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Express Delivery</h4>
                  <ul className="space-y-2">
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Delivery Time: 2-3 business days</span></li>
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Additional ₹250 for express shipping</span></li>
                    <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>Available for select metro cities</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Packaging */}
          <div
            className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-10 animate-fade-in"
            style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--arc-border)' }}
          >
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--arc-indigo)',
                opacity: 0.7,
              }}>
                §02
              </span>
              <h2 className="mt-2" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                lineHeight: '1.6',
              }}>
                Packaging
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>Given the vintage and delicate nature of our products, we take extra care in packaging:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Double-boxed packaging for fragile items',
                    'Anti-static materials for electronic components',
                    'Custom foam inserts for high-value pieces',
                    'Moisture-resistant wrapping for sensitive equipment',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Order Tracking */}
          <div
            className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-10 animate-fade-in"
            style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--arc-border)' }}
          >
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--arc-indigo)',
                opacity: 0.7,
              }}>
                §03
              </span>
              <h2 className="mt-2" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                lineHeight: '1.6',
              }}>
                Order Tracking
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>Stay updated on your order status:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Order confirmation email sent immediately after purchase',
                    'Shipping notification with tracking number when dispatched',
                    'Real-time tracking via courier partner website',
                    'SMS updates for delivery milestones',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div
            className="grid md:grid-cols-[120px_1fr] gap-6 md:gap-10 animate-fade-in"
            style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--arc-border)' }}
          >
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--arc-indigo)',
                opacity: 0.7,
              }}>
                §04
              </span>
              <h2 className="mt-2" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                lineHeight: '1.6',
              }}>
                Important Notes
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <ul className="space-y-2">
                  {[
                    'Delivery times are estimates and may vary during peak seasons or due to unforeseen circumstances',
                    'Please ensure someone is available to receive the package, especially for high-value items',
                    'We recommend inspecting the package upon delivery and reporting any damage immediately',
                    'Remote locations may require additional delivery time',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--arc-border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>
            Also see
          </p>
          <Link
            to="/returns"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--arc-indigo)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--arc-indigo)',
              paddingBottom: '2px',
              opacity: 0.8,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
          >
            Return Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
