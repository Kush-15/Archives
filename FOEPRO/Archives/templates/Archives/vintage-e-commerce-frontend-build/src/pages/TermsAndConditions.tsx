import { Link } from 'react-router-dom';

interface Section {
  number: string;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    number: '01',
    title: 'Company Information',
    content: (
      <div className="space-y-3">
        <p>The Archives™ is operated by The Archives™ LLP.</p>
        <p>For any queries, support, or grievances, users may contact:</p>
        <div className="mt-4 pl-4" style={{ borderLeft: '2px solid var(--arc-border)' }}>
          <p>Email: <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a></p>
          <p>Phone: <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>8779116254</a></p>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Eligibility to Use the Website',
    content: (
      <div className="space-y-3">
        <p>By using this website, you represent and warrant that:</p>
        <ul className="space-y-2 mt-2">
          <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>You are at least 18 years of age, or</span></li>
          <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>You are using the website under the supervision of a parent or legal guardian.</span></li>
        </ul>
        <p>Users agree to provide accurate and complete information during checkout and account creation.</p>
      </div>
    ),
  },
  {
    number: '03',
    title: 'Nature of Products',
    content: (
      <div className="space-y-3">
        <p>The Archives™ specialises in vintage, collectible, and refurbished electronic items. Products listed on the website may include:</p>
        <ul className="space-y-2 mt-2">
          {['Pre-owned electronics', 'Refurbished electronics', 'Restored electronics', 'Collectible or discontinued electronic devices'].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">Because of the vintage nature of many products, items may show cosmetic wear, aging, or minor imperfections; packaging and accessories may not always be original; and product performance may differ from modern electronics. All products are described to the best of our knowledge and testing.</p>
      </div>
    ),
  },
  {
    number: '04',
    title: 'Product Condition Disclaimer',
    content: (
      <div className="space-y-3">
        <p>Due to the nature of vintage electronics:</p>
        <ul className="space-y-2 mt-2">
          {['Some products may be refurbished or restored', 'Certain items may be sold as collectible pieces', 'Manufacturer warranties are typically expired or unavailable'].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">Unless explicitly stated otherwise, products are sold as available based on their vintage condition. The Archives™ makes reasonable efforts to ensure items are functional, but long-term reliability cannot always be guaranteed due to the age of certain components.</p>
      </div>
    ),
  },
  {
    number: '05',
    title: 'Orders and Payments',
    content: (
      <div className="space-y-3">
        <p>By placing an order on the website, you agree that:</p>
        <ul className="space-y-2 mt-2">
          {['All purchases are subject to product availability', 'Prices are listed in Indian Rupees (INR)', 'Orders may be canceled if payment fails, fraudulent activity is suspected, or the product becomes unavailable'].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">The Archives™ reserves the right to refuse or cancel orders at its discretion.</p>
      </div>
    ),
  },
  {
    number: '06',
    title: 'Shipping and Delivery',
    content: (
      <div className="space-y-3">
        <p>The Archives™ will arrange shipment of purchased products using reliable courier services. Shipping timelines may vary depending on location of the customer, courier operations, and product packaging requirements.</p>
        <p>Customers are responsible for providing accurate shipping information. The Archives™ is not responsible for delays caused by courier service disruptions, weather events, or force majeure events.</p>
      </div>
    ),
  },
  {
    number: '07',
    title: 'Return and Refund Policy',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Eligibility for Returns</h4>
          <p className="mb-2">Customers may request a return if:</p>
          <ul className="space-y-2">
            <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>The item received is damaged during transit</span></li>
            <li className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>The item received is significantly different from the description</span></li>
          </ul>
          <p className="mt-2">Return requests must be initiated within 7 days of delivery.</p>
        </div>
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Non-Returnable Cases</h4>
          <p className="mb-2">Returns may not be accepted if:</p>
          <ul className="space-y-2">
            {['The product has been misused or tampered with', 'The return request is made after the allowed period', 'The issue relates to normal vintage wear or cosmetic aging'].map(item => (
              <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Refund Processing</h4>
          <p>If a return is approved, the item must be shipped back to The Archives™. Once inspected, a refund will be issued to the original payment method. Shipping costs may be deducted where applicable.</p>
        </div>
      </div>
    ),
  },
  {
    number: '08',
    title: 'Intellectual Property',
    content: (
      <p>The brand "The Archives™" and its associated materials may include website content, images, product descriptions, and brand identity. Unless otherwise stated, such materials are provided under Creative Commons licensing and fair use principles, while still recognising the brand identity of The Archives™. Unauthorised misuse of brand identity or misleading representation of affiliation with The Archives™ is prohibited.</p>
    ),
  },
  {
    number: '09',
    title: 'Limitation of Liability',
    content: (
      <div className="space-y-3">
        <p>To the fullest extent permitted by applicable law, The Archives™ shall not be liable for:</p>
        <ul className="space-y-2 mt-2">
          {['Indirect or consequential damages', 'Loss of data', 'Compatibility issues with modern systems', 'Failure of vintage components after reasonable use'].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">Customers acknowledge that vintage electronics may carry inherent functional risks due to age.</p>
      </div>
    ),
  },
  {
    number: '10',
    title: 'User Conduct',
    content: (
      <div className="space-y-3">
        <p>Users agree not to:</p>
        <ul className="space-y-2 mt-2">
          {['Use the website for fraudulent activity', 'Attempt unauthorised access to website systems', 'Disrupt website functionality', 'Misrepresent identity during transactions'].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">Violation of these terms may result in account termination or order cancellation.</p>
      </div>
    ),
  },
  {
    number: '11',
    title: 'Governing Law and Jurisdiction',
    content: (
      <p>These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms shall fall under the exclusive jurisdiction of the High Court of Mumbai.</p>
    ),
  },
  {
    number: '12',
    title: 'Changes to Terms',
    content: (
      <div className="space-y-3">
        <p>The Archives™ reserves the right to update or modify these Terms at any time. Changes will be effective upon posting on the website. Users are encouraged to review the Terms periodically.</p>
      </div>
    ),
  },
  {
    number: '13',
    title: 'Contact Information',
    content: (
      <div className="space-y-2">
        <p>The Archives™ LLP</p>
        <p>Email: <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a></p>
        <p>Phone: <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>8779116254</a></p>
      </div>
    ),
  },
];

export function TermsAndConditions() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Legal</p>
          <h1 className="arc-page-title animate-slide-up">Terms &amp; Conditions</h1>
          <div className="flex flex-col sm:flex-row gap-6 mt-6">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--arc-text-muted)' }}>
              LAST UPDATED: 12 MARCH 2026
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--arc-text-muted)' }}>
              THE ARCHIVES™ LLP · MUMBAI, INDIA
            </p>
          </div>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            These Terms and Conditions govern the use of the website and services operated by The Archives™ LLP.
            By accessing or purchasing from this website, you agree to comply with and be bound by these Terms.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <div
              key={section.number}
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
                  §{section.number}
                </span>
                <h2 className="mt-2" style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--arc-text-muted)',
                  lineHeight: '1.6',
                }}>
                  {section.title}
                </h2>
              </div>
              <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--arc-border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>
            Also see
          </p>
          <Link
            to="/privacy"
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
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
