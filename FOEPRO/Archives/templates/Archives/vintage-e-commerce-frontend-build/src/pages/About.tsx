import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Our Story</p>
          <h1 className="arc-page-title animate-slide-up">About The Archives</h1>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            A curated collection of vintage electronics, preserved and presented as the cultural artifacts they are.
          </p>
        </div>

        {/* Mission Section */}
        <div className="space-y-12">
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
                Our Mission
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>
                  The Archives was born from a deep appreciation for the craftsmanship and innovation of vintage electronics. 
                  We believe these devices are more than mere gadgets — they are pieces of history that tell the story of 
                  human ingenuity and the evolution of technology.
                </p>
                <p>
                  Our mission is to preserve, restore, and share these remarkable artifacts with collectors, enthusiasts, 
                  and anyone who appreciates the beauty of well-designed technology from eras past.
                </p>
              </div>
            </div>
          </div>

          {/* What We Do */}
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
                What We Do
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-3">
                <p>We specialise in:</p>
                <ul className="space-y-2 mt-2">
                  {[
                    'Sourcing rare and collectible vintage electronics from around the world',
                    'Professional restoration and refurbishment to bring classic devices back to life',
                    'Expert authentication and condition assessment',
                    'Careful preservation to maintain the integrity and value of each piece',
                  ].map(item => (
                    <li key={item} className="flex gap-3"><span style={{ color: 'var(--arc-indigo)' }}>—</span><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Our Values */}
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
                Our Values
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Authenticity</h4>
                  <p>Every item in our collection is carefully verified and documented. We provide complete transparency about the condition, history, and provenance of each piece.</p>
                </div>
                <div>
                  <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Quality</h4>
                  <p>We only offer items that meet our high standards. Each piece is thoroughly tested and, where necessary, professionally restored using period-appropriate techniques and parts.</p>
                </div>
                <div>
                  <h4 className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)' }}>Preservation</h4>
                  <p>We are committed to preserving these technological artifacts for future generations. Every sale contributes to keeping the legacy of vintage electronics alive.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
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
                Get In Touch
              </h2>
            </div>
            <div style={{ color: 'var(--arc-text-body)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              <div className="space-y-2">
                <p>The Archives LLP</p>
                <p>Mumbai, India</p>
                <div className="mt-4 pl-4" style={{ borderLeft: '2px solid var(--arc-border)' }}>
                  <p>Email: <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>thearchiveselectronics@gmail.com</a></p>
                  <p>Phone: <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>8779116254</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--arc-border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>
            Explore
          </p>
          <Link
            to="/catalog"
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
            View Collection →
          </Link>
        </div>
      </div>
    </div>
  );
}
