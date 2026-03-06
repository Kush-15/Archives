export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-left">
          <p className="t-eyebrow">For Collectors</p>
          <h2 className="footer-cta-title t-section-title">
            Own the archive
          </h2>
          <div className="footer-contacts">
            <a href="mailto:hello@thearchives.com" className="footer-contact-link">
              <span className="t-eyebrow">Email</span>
              <span className="footer-contact-val">hello@thearchives.com</span>
            </a>
          </div>
        </div>

        <div className="footer-right">
          <p className="t-eyebrow footer-form-label">Reserve an Instrument</p>
          <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-field">
              <label className="t-eyebrow">Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="form-field">
              <label className="t-eyebrow">Email</label>
              <input type="email" placeholder="your@email.com" />
            </div>
            <div className="form-field">
              <label className="t-eyebrow">Interest</label>
              <input type="text" placeholder="e.g. Leica M6, SLRs..." />
            </div>
            <button type="submit" className="btn-submit">
              Submit Enquiry {'->'}
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="t-eyebrow">© {new Date().getFullYear()} The Archives. All rights reserved.</span>
        <a href="/catalog" className="t-eyebrow footer-link">
          Collection
        </a>
      </div>
    </footer>
  );
}
