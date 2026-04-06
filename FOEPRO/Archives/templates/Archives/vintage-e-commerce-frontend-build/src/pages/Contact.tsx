import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Form is non-functional for now - just show success message
    setSubmitted(true);
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow" style={{ marginBottom: '1rem' }}>Get In Touch</p>
          <h1 className="arc-page-title animate-slide-up">Contact Us</h1>
          <p className="mt-6" style={{ color: 'var(--arc-text-body)', lineHeight: '1.75', maxWidth: '700px' }}>
            Have a question about a product, your order, or just want to say hello? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                marginBottom: '1.5rem',
              }}>
                Contact Information
              </h2>
              <div className="space-y-4" style={{ color: 'var(--arc-text-body)', lineHeight: '1.8' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)', marginBottom: '0.5rem' }}>Email</h3>
                  <a href="mailto:thearchiveselectronics@gmail.com" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>
                    thearchiveselectronics@gmail.com
                  </a>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)', marginBottom: '0.5rem' }}>Phone</h3>
                  <a href="tel:8779116254" style={{ color: 'var(--arc-indigo)', textDecoration: 'none' }}>
                    +91 8779116254
                  </a>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--arc-text-light)', marginBottom: '0.5rem' }}>Address</h3>
                  <p>The Archives LLP</p>
                  <p>Mumbai, Maharashtra</p>
                  <p>India</p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                marginBottom: '1.5rem',
              }}>
                Business Hours
              </h2>
              <div className="space-y-2" style={{ color: 'var(--arc-text-body)' }}>
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span style={{ color: 'var(--arc-text-light)' }}>10:00 AM - 7:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span style={{ color: 'var(--arc-text-light)' }}>11:00 AM - 5:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span style={{ color: 'var(--arc-text-muted)' }}>Closed</span>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--arc-text-muted)',
                marginBottom: '1.5rem',
              }}>
                Response Time
              </h2>
              <p style={{ color: 'var(--arc-text-body)', lineHeight: '1.8' }}>
                We typically respond to inquiries within 24-48 hours during business days. 
                For urgent matters regarding existing orders, please include your order number in the subject line.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--arc-text-muted)',
              marginBottom: '1.5rem',
            }}>
              Send a Message
            </h2>

            {submitted ? (
              <div 
                className="p-8 text-center animate-fade-in"
                style={{ 
                  background: 'var(--arc-card)', 
                  border: '1px solid var(--arc-border)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ color: 'var(--arc-indigo)', marginBottom: '1rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{ color: 'var(--arc-text-light)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Message Sent</h3>
                <p style={{ color: 'var(--arc-text-muted)', fontSize: '0.9rem' }}>
                  Thank you for reaching out. We'll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="name"
                    style={{ 
                      display: 'block',
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.6rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--arc-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--arc-card)',
                      border: '1px solid var(--arc-border)',
                      borderRadius: '4px',
                      color: 'var(--arc-text-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--arc-indigo)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--arc-border)'}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="email"
                    style={{ 
                      display: 'block',
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.6rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--arc-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--arc-card)',
                      border: '1px solid var(--arc-border)',
                      borderRadius: '4px',
                      color: 'var(--arc-text-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--arc-indigo)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--arc-border)'}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="subject"
                    style={{ 
                      display: 'block',
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.6rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--arc-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--arc-card)',
                      border: '1px solid var(--arc-border)',
                      borderRadius: '4px',
                      color: 'var(--arc-text-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--arc-indigo)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--arc-border)'}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="message"
                    style={{ 
                      display: 'block',
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.6rem', 
                      letterSpacing: '0.12em', 
                      textTransform: 'uppercase', 
                      color: 'var(--arc-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'var(--arc-card)',
                      border: '1px solid var(--arc-border)',
                      borderRadius: '4px',
                      color: 'var(--arc-text-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      resize: 'vertical',
                      minHeight: '150px',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--arc-indigo)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--arc-border)'}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    background: 'var(--arc-indigo)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--arc-border)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>
            Learn More
          </p>
          <Link
            to="/about"
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
            About The Archives →
          </Link>
        </div>
      </div>
    </div>
  );
}
