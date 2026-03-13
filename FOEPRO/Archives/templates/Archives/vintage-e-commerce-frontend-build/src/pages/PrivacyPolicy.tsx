import { Link } from 'react-router-dom';

interface PolicySection {
  number: string;
  title: string;
  content: React.ReactNode;
}

const sections: PolicySection[] = [
  {
    number: '01',
    title: 'Who We Are',
    content: (
      <div className="space-y-3">
        <p>The Archives™ LLP ("The Archives™", "we", "our", or "us") operates the vintage electronics e-commerce platform at this website. We are based in Mumbai, India.</p>
        <p>This Privacy Policy explains how we collect, use, store, and protect your personal information when you visit our website or make a purchase.</p>
        <div className="mt-4 pl-4" style={{ borderLeft: '2px solid var(--arc-border)' }}>
          <p>Email: <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a></p>
          <p>Phone: <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>8779116254</a></p>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    title: 'Information We Collect',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Information you provide directly</h4>
          <ul className="space-y-2">
            {[
              'Name and email address when creating an account',
              'Phone number for order communication and delivery',
              'Shipping address for order fulfilment',
              'Payment information processed securely via our payment provider',
              'Reviews, ratings, and other content you submit',
            ].map(item => (
              <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Information collected automatically</h4>
          <ul className="space-y-2">
            {[
              'Browser type and device information',
              'Pages visited and time spent on the site',
              'IP address and general location',
              'Referring website or search terms',
            ].map(item => (
              <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Information via third-party sign-in</h4>
          <p>If you choose to sign in using Google, we receive your name, email address, and profile picture from Google in accordance with the permissions you grant. We do not receive your Google password.</p>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    title: 'How We Use Your Information',
    content: (
      <div className="space-y-3">
        <p>We use the information we collect to:</p>
        <ul className="space-y-2 mt-2">
          {[
            'Process and fulfil your orders',
            'Manage your account and authenticate your identity',
            'Send order confirmations, shipping updates, and support messages',
            'Improve our website, products, and services',
            'Detect and prevent fraudulent or unauthorised activity',
            'Comply with our legal obligations under Indian law',
          ].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
      </div>
    ),
  },
  {
    number: '04',
    title: 'Cookies and Tracking',
    content: (
      <div className="space-y-3">
        <p>We use cookies and similar technologies to maintain your session, remember your preferences, and understand how visitors use our site.</p>
        <ul className="space-y-2 mt-2">
          {[
            'Session cookies — keep you logged in during a visit',
            'Preference cookies — remember your cart and display settings',
            'Analytics cookies — help us understand site usage (aggregated, anonymised)',
          ].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">You may disable cookies in your browser settings. This may affect certain functionality, such as staying signed in.</p>
      </div>
    ),
  },
  {
    number: '05',
    title: 'Sharing Your Information',
    content: (
      <div className="space-y-3">
        <p>We share your information only where necessary:</p>
        <ul className="space-y-2 mt-2">
          {[
            'Courier and logistics partners — to deliver your order',
            'Payment processors — to securely handle transactions',
            'Authentication services (e.g. Google) — when you use third-party sign-in',
            'Law enforcement or regulatory authorities — when required by applicable Indian law',
          ].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">All third-party service providers are required to handle your data securely and in accordance with applicable law.</p>
      </div>
    ),
  },
  {
    number: '06',
    title: 'Data Retention',
    content: (
      <div className="space-y-3">
        <p>We retain your personal data for as long as your account is active or as needed to provide services. We may also retain data to comply with legal obligations, resolve disputes, and enforce our agreements.</p>
        <p>If you request account deletion, we will remove your personal information within a reasonable timeframe, except where retention is required by law.</p>
      </div>
    ),
  },
  {
    number: '07',
    title: 'Data Security',
    content: (
      <div className="space-y-3">
        <p>We take reasonable technical and organisational measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. These measures include:</p>
        <ul className="space-y-2 mt-2">
          {[
            'HTTPS encryption for all data transmitted to and from our website',
            'Secure storage of passwords using industry-standard hashing',
            'Restricted access to personal data by staff on a need-to-know basis',
          ].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">No method of transmission over the internet is completely secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
      </div>
    ),
  },
  {
    number: '08',
    title: 'Your Rights',
    content: (
      <div className="space-y-3">
        <p>You have the right to:</p>
        <ul className="space-y-2 mt-2">
          {[
            'Access the personal information we hold about you',
            'Request correction of inaccurate or incomplete data',
            'Request deletion of your account and associated data',
            'Opt out of non-transactional communications at any time',
          ].map(item => (
            <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
          ))}
        </ul>
        <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a>.</p>
      </div>
    ),
  },
  {
    number: '09',
    title: 'Children\'s Privacy',
    content: (
      <p>Our website is not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.</p>
    ),
  },
  {
    number: '10',
    title: 'Changes to This Policy',
    content: (
      <div className="space-y-3">
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically to stay informed about how we protect your information.</p>
        <p>Continued use of the website after any changes constitutes acceptance of the updated policy.</p>
      </div>
    ),
  },
  {
    number: '11',
    title: 'Governing Law',
    content: (
      <p>This Privacy Policy is governed by the laws of India, including the Information Technology Act, 2000 and its associated rules. Any disputes shall fall under the exclusive jurisdiction of the High Court of Mumbai.</p>
    ),
  },
  {
    number: '12',
    title: 'Contact Us',
    content: (
      <div className="space-y-2">
        <p>For any privacy-related queries or requests, contact:</p>
        <div className="mt-4 pl-4" style={{ borderLeft: '2px solid var(--arc-border)' }}>
          <p>The Archives™ LLP</p>
          <p>Email: <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a></p>
          <p>Phone: <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>8779116254</a></p>
        </div>
      </div>
    ),
  },
];

export function PrivacyPolicy() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Legal</p>
          <h1 className="arc-page-title animate-slide-up">Privacy Policy</h1>
          <div className="flex flex-col sm:flex-row gap-6 mt-6">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--arc-text-muted)' }}>
              LAST UPDATED: 12 MARCH 2026
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--arc-text-muted)' }}>
              THE ARCHIVES™ LLP · MUMBAI, INDIA
            </p>
          </div>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            Your privacy matters to us. This policy describes what personal information we collect, how we use it,
            and the choices available to you regarding your data.
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
            to="/terms"
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
            Terms &amp; Conditions →
          </Link>
        </div>
      </div>
    </div>
  );
}
