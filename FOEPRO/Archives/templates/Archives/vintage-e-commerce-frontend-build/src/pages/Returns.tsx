import { Link } from 'react-router-dom';

export function Returns() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Information</p>
          <h1 className="arc-page-title animate-slide-up">Return Policy</h1>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            We want you to be completely satisfied with your purchase. Please review our return policy below.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Return Eligibility */}
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
                Return Eligibility
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>You may request a return if:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'The item received is damaged during transit',
                    'The item received is significantly different from the description',
                    'The item is defective and not functioning as described',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
                <p className="mt-3">Return requests must be initiated within <strong>7 days</strong> of delivery.</p>
              </div>
            </div>
          </div>

          {/* How to Return */}
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
                How to Return
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>Follow these steps to initiate a return:</p>
                <ol className="space-y-3 mt-2">
                  <li className="flex gap-3">
                    <span style={{ color: 'var(--arc-indigo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>01.</span>
                    <span>Contact us at <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a> with your order number and reason for return</span>
                  </li>
                  <li className="flex gap-3">
                    <span style={{ color: 'var(--arc-indigo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>02.</span>
                    <span>Include clear photos of any damage or defects</span>
                  </li>
                  <li className="flex gap-3">
                    <span style={{ color: 'var(--arc-indigo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>03.</span>
                    <span>Wait for approval and return shipping instructions</span>
                  </li>
                  <li className="flex gap-3">
                    <span style={{ color: 'var(--arc-indigo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>04.</span>
                    <span>Pack the item securely in its original packaging if possible</span>
                  </li>
                  <li className="flex gap-3">
                    <span style={{ color: 'var(--arc-indigo)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>05.</span>
                    <span>Ship the item back using the provided return label</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Non-Returnable Items */}
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
                Non-Returnable
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>Returns may not be accepted if:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'The product has been misused, modified, or tampered with',
                    'The return request is made after the 7-day window',
                    'The issue relates to normal vintage wear or cosmetic aging as described',
                    'The item was clearly marked "as-is" or "for parts only"',
                    'Consumable items like batteries or accessories have been used',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Refund Process */}
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
                Refund Process
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>Once we receive and inspect your returned item:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Inspection typically takes 2-3 business days',
                    'Approved refunds are processed to your original payment method',
                    'Bank refunds may take 5-10 business days to reflect',
                    'Original shipping costs may be deducted unless the return is due to our error',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Exchange */}
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
                §05
              </span>
              <h2 className="mt-2" style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                lineHeight: '1.6',
              }}>
                Exchanges
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>
                  Due to the unique nature of vintage electronics, direct exchanges are generally not available. 
                  If you'd like a different item, we recommend returning the original for a refund and placing 
                  a new order for the desired piece.
                </p>
                <p>
                  For special circumstances, please contact us and we'll do our best to accommodate your needs.
                </p>
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
            to="/shipping"
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
            Shipping Information →
          </Link>
        </div>
      </div>
    </div>
  );
}
