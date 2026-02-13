import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-archive-900 text-archive-300 py-20 mt-32">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="font-editorial text-3xl text-cream mb-6">The Archives</h3>
            <p className="text-archive-400 max-w-md leading-relaxed">
              A curated collection of vintage electronics, preserved and presented 
              as the cultural artifacts they are. Each piece tells a story of 
              innovation, design, and human ingenuity.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm uppercase tracking-wider text-archive-500 mb-6">Navigate</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/catalog" className="text-archive-300 hover:text-cream transition-colors duration-300">
                  Collection
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=audio" className="text-archive-300 hover:text-cream transition-colors duration-300">
                  Audio
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=computing" className="text-archive-300 hover:text-cream transition-colors duration-300">
                  Computing
                </Link>
              </li>
              <li>
                <Link to="/catalog?category=photography" className="text-archive-300 hover:text-cream transition-colors duration-300">
                  Photography
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm uppercase tracking-wider text-archive-500 mb-6">Information</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-archive-300 hover:text-cream transition-colors duration-300 cursor-pointer">
                  About
                </span>
              </li>
              <li>
                <span className="text-archive-300 hover:text-cream transition-colors duration-300 cursor-pointer">
                  Shipping
                </span>
              </li>
              <li>
                <span className="text-archive-300 hover:text-cream transition-colors duration-300 cursor-pointer">
                  Returns
                </span>
              </li>
              <li>
                <span className="text-archive-300 hover:text-cream transition-colors duration-300 cursor-pointer">
                  Contact
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-archive-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-archive-500">
            © {new Date().getFullYear()} The Archives. All rights reserved.
          </p>
          <p className="text-sm text-archive-500">
            Curating history, one artifact at a time.
          </p>
        </div>
      </div>
    </footer>
  );
}
