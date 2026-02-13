import { useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useLayoutEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero text animation
      if (heroTextRef.current) {
        gsap.fromTo(
          heroTextRef.current.children,
          { y: 60, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.15
          }
        );
      }

      // Scroll-triggered animations
      gsap.utils.toArray<HTMLElement>('.gsap-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none'
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-slide-up');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const featuredProducts = products.filter(p => p.featured).slice(0, 6);
  const heroProduct = products.find(p => p.id === 'apple-macintosh-128k');

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen relative flex items-center pt-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 noise pointer-events-none" />
        
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div ref={heroTextRef}>
            <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-6">
              Est. 2024 — Curated Collection
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-archive-900 mb-8">
              Artifacts of
              <br />
              <em className="text-archive-600">Innovation</em>
            </h1>
            <p className="text-lg md:text-xl text-archive-600 max-w-lg leading-relaxed mb-10">
              A museum-grade collection of vintage electronics. Each piece authenticated, 
              restored, and presented as the cultural artifact it is.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-3 px-8 py-4 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-all duration-500 group"
              >
                Explore Collection
                <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button className="px-8 py-4 border border-archive-300 text-archive-700 text-sm uppercase tracking-wider hover:bg-archive-100 transition-all duration-500">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-[4/5] bg-archive-100 rounded-lg overflow-hidden relative group">
              <img
                src={heroProduct?.images[0] || 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800'}
                alt="Featured vintage electronics"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-archive-900/40 via-transparent to-transparent" />
              
              {/* Badge */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-cream/90 backdrop-blur-sm rounded-full">
                <span className="text-xs uppercase tracking-wider text-archive-700">Featured Artifact</span>
              </div>
              
              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="text-cream/80 text-sm mb-2">{heroProduct?.era}</p>
                <h3 className="font-editorial text-2xl md:text-3xl text-cream mb-2">
                  {heroProduct?.name}
                </h3>
                <p className="text-cream text-xl">${heroProduct?.price.toLocaleString()}</p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-8 -right-8 w-24 h-24 border border-archive-300 rounded-full hidden lg:block" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-archive-200 hidden lg:block" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-archive-400">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-12 bg-archive-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-archive-600 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Editorial Section */}
      <section className="py-32 bg-archive-900 text-cream relative overflow-hidden">
        <div className="absolute inset-0 noise opacity-5" />
        
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-3 gap-16 items-center">
            <div className="lg:col-span-2">
              <p className="reveal-on-scroll opacity-0 translate-y-8 text-sm uppercase tracking-[0.3em] text-archive-400 mb-6">
                The Philosophy
              </p>
              <h2 className="reveal-on-scroll opacity-0 translate-y-8 font-display text-4xl md:text-6xl lg:text-7xl leading-tight mb-8">
                Technology as 
                <br />
                <em className="text-archive-400">Cultural Heritage</em>
              </h2>
              <p className="reveal-on-scroll opacity-0 translate-y-8 text-lg text-archive-300 max-w-2xl leading-relaxed">
                Every circuit board tells a story. Every dial and button represents countless hours 
                of human ingenuity. We don't just sell vintage electronics—we preserve the material 
                culture of the information age.
              </p>
            </div>

            <div className="reveal-on-scroll opacity-0 translate-y-8 grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="font-editorial text-5xl md:text-6xl text-cream mb-2">200+</p>
                <p className="text-sm uppercase tracking-wider text-archive-400">Artifacts</p>
              </div>
              <div>
                <p className="font-editorial text-5xl md:text-6xl text-cream mb-2">50</p>
                <p className="text-sm uppercase tracking-wider text-archive-400">Years Span</p>
              </div>
              <div>
                <p className="font-editorial text-5xl md:text-6xl text-cream mb-2">100%</p>
                <p className="text-sm uppercase tracking-wider text-archive-400">Authenticated</p>
              </div>
              <div>
                <p className="font-editorial text-5xl md:text-6xl text-cream mb-2">∞</p>
                <p className="text-sm uppercase tracking-wider text-archive-400">Stories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section ref={featuredRef} className="py-32">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="reveal-on-scroll opacity-0 translate-y-8">
              <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-4">
                Featured Collection
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-archive-900">
                Selected Artifacts
              </h2>
            </div>
            <Link
              to="/catalog"
              className="reveal-on-scroll opacity-0 translate-y-8 inline-flex items-center gap-2 text-archive-600 hover:text-archive-900 transition-colors group"
            >
              <span className="text-sm uppercase tracking-wider">View All</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="reveal-on-scroll opacity-0 translate-y-8"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-32 bg-parchment">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="reveal-on-scroll opacity-0 translate-y-8 text-sm uppercase tracking-[0.3em] text-archive-500 mb-4">
              Browse By Category
            </p>
            <h2 className="reveal-on-scroll opacity-0 translate-y-8 font-display text-4xl md:text-5xl text-archive-900">
              Curated Categories
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Audio', count: 4, image: 'https://images.unsplash.com/photo-1558584673-aa8e87c8b650?w=400', path: '/catalog?category=audio' },
              { name: 'Computing', count: 3, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', path: '/catalog?category=computing' },
              { name: 'Photography', count: 3, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', path: '/catalog?category=photography' },
              { name: 'Gaming', count: 2, image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400', path: '/catalog?category=gaming' },
            ].map((category, index) => (
              <Link
                key={category.name}
                to={category.path}
                className="reveal-on-scroll opacity-0 translate-y-8 group relative aspect-[3/4] overflow-hidden rounded-lg"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-archive-900/80 via-archive-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-cream/60 text-sm mb-1">{category.count} artifacts</p>
                  <h3 className="font-editorial text-2xl text-cream group-hover:underline decoration-1 underline-offset-4">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-32">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <div className="reveal-on-scroll opacity-0 translate-y-8 max-w-3xl mx-auto text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-6">
              Stay Informed
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-archive-900 mb-6">
              New Acquisitions
            </h2>
            <p className="text-lg text-archive-600 mb-10 max-w-xl mx-auto">
              Be the first to know when rare artifacts become available. 
              Join our collectors' circle.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-6 py-4 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
