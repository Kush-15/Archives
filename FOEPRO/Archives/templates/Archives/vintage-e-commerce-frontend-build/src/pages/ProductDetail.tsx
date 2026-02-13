import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { RatingStars } from '@/components/RatingStars';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getDisplayRating, getDisplayRatingCount, getStoredRatings, saveStoredRating } from '@/utils/ratings';
import * as THREE from 'three';

// 3D Product Component with vintage electronics look
function ProductBox({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.02 : 1}
    >
      {/* Main Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 1, 0.7]} />
        <meshStandardMaterial 
          color={color} 
          roughness={0.4} 
          metalness={0.3}
          envMapIntensity={0.8}
        />
      </mesh>
      
      {/* Screen/Display */}
      <mesh position={[0, 0.1, 0.36]}>
        <boxGeometry args={[1.2, 0.6, 0.02]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.1} 
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </mesh>
      
      {/* Control Panel */}
      <mesh position={[0, -0.35, 0.36]}>
        <boxGeometry args={[1.4, 0.2, 0.02]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          roughness={0.6} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Buttons/Knobs */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.35, 0.38]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
          <meshStandardMaterial 
            color="#444" 
            roughness={0.3} 
            metalness={0.6}
          />
        </mesh>
      ))}
      
      {/* Brand plate */}
      <mesh position={[0, 0.42, 0.36]}>
        <boxGeometry args={[0.4, 0.06, 0.01]} />
        <meshStandardMaterial 
          color="#c0c0c0" 
          roughness={0.2} 
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// 3D Viewer Component
function ProductViewer3D({ color }: { color: string }) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <ProductBox color={color} />
          <Environment preset="city" />
          <ContactShadows
            position={[0, -0.8, 0]}
            opacity={0.4}
            scale={5}
            blur={2.5}
          />
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { isLoggedIn, isSaved, toggleSavedItem, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [show3D, setShow3D] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const product = products.find(p => p.id === id);
  const relatedProducts = products
    .filter(p => p.id !== id && (p.category === product?.category || p.era === product?.era))
    .slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const ratings = getStoredRatings();
    if (id) {
      setUserRating(ratings[id] ?? null);
    }
  }, [id]);

  if (!product) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12">
          <h1 className="font-editorial text-3xl text-archive-900 mb-4">Artifact Not Found</h1>
          <p className="text-archive-500 mb-6">This piece may have been acquired by another collector.</p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 text-archive-900 border-b border-archive-900 pb-1"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    toggleSavedItem(product.id);
  };

  const handleRate = (value: number) => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    saveStoredRating(product.id, value);
    setUserRating(value);
  };

  const saved = isSaved(product.id);
  const displayRating = getDisplayRating(product, userRating);
  const displayRatingCount = getDisplayRatingCount(product, userRating);
  const ratingLabel = displayRatingCount === 1 ? 'rating' : 'ratings';

  return (
    <div className="pt-24 pb-20">
      {/* Breadcrumb */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 py-6">
        <nav className="flex items-center gap-2 text-sm text-archive-500">
          <Link to="/" className="hover:text-archive-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-archive-900 transition-colors">Collection</Link>
          <span>/</span>
          <span className="text-archive-700 truncate">{product.name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Image/3D Viewer */}
          <div className="space-y-4">
            <div className="aspect-square bg-archive-100 rounded-lg overflow-hidden relative">
              {show3D ? (
                <ProductViewer3D color={product.color} />
              ) : (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}
              
              {/* Toggle 3D */}
              <button
                onClick={() => setShow3D(!show3D)}
                className="absolute bottom-4 right-4 px-4 py-2 bg-cream/90 backdrop-blur-sm rounded-full text-sm flex items-center gap-2 hover:bg-cream transition-colors"
              >
                {show3D ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Image
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    View in 3D
                  </>
                )}
              </button>
            </div>
            
            {/* Instructions when 3D is active */}
            {show3D && (
              <p className="text-sm text-archive-500 text-center animate-fade-in">
                Drag to rotate · Auto-rotating display
              </p>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:pt-8">
            <div className="stagger-children">
              {/* Era & Category */}
              <p className="text-sm uppercase tracking-[0.2em] text-archive-500 mb-4">
                {product.era} · {product.category}
              </p>

              {/* Name */}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-archive-900 mb-4">
                {product.name}
              </h1>

              {/* Tagline */}
              <p className="font-editorial text-xl text-archive-600 italic mb-8">
                "{product.tagline}"
              </p>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-archive-200">
                <span className="font-editorial text-4xl text-archive-900">
                  ${product.price.toLocaleString()}
                </span>
                <span className="text-sm text-archive-500">
                  Includes authentication certificate
                </span>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-sm uppercase tracking-wider text-archive-500 mb-4">About This Piece</h2>
                <p className="text-archive-700 leading-relaxed">
                  {product.longDescription}
                </p>
              </div>

              {/* Specs */}
              <div className="mb-8">
                <h2 className="text-sm uppercase tracking-wider text-archive-500 mb-4">Specifications</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="py-3 border-b border-archive-100">
                      <dt className="text-sm text-archive-500">{spec.label}</dt>
                      <dd className="text-archive-900">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 text-sm uppercase tracking-wider transition-all duration-300 ${
                    addedToCart
                      ? 'bg-green-700 text-cream'
                      : 'bg-archive-900 text-cream hover:bg-archive-800'
                  }`}
                >
                  {addedToCart ? '✓ Added to Collection' : isLoggedIn ? 'Add to Collection' : 'Sign in to Add'}
                </button>
                <button
                  onClick={handleSave}
                  className={`px-6 py-4 border transition-colors ${
                    saved 
                      ? 'border-archive-900 bg-archive-900 text-cream' 
                      : 'border-archive-300 text-archive-700 hover:border-archive-500'
                  }`}
                  aria-label={saved ? 'Remove from saved' : 'Save item'}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill={saved ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="mt-8 pb-8 border-b border-archive-200">
                <div className="flex items-center gap-3">
                  <RatingStars rating={displayRating} size={18} />
                  <span className="text-archive-700">
                    {displayRating.toFixed(1)} ({displayRatingCount} {ratingLabel})
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm uppercase tracking-wider text-archive-500 mb-3">Rate this artifact</p>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = index + 1;
                      const isActive = userRating ? value <= userRating : false;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRate(value)}
                          className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${
                            isActive
                              ? 'border-archive-900 bg-archive-900 text-cream'
                              : 'border-archive-300 text-archive-700 hover:border-archive-500'
                          }`}
                          aria-label={`Rate ${value} out of 5`}
                          aria-pressed={userRating === value}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        </button>
                      );
                    })}
                    <span className="text-sm text-archive-500">
                      {userRating ? `Your rating: ${userRating}/5` : 'Tap a star to rate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-archive-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <svg className="w-6 h-6 mx-auto text-archive-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-xs text-archive-500">Authenticated</p>
                </div>
                <div>
                  <svg className="w-6 h-6 mx-auto text-archive-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-xs text-archive-500">Secure Shipping</p>
                </div>
                <div>
                  <svg className="w-6 h-6 mx-auto text-archive-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-xs text-archive-500">14-Day Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-32">
            <div className="flex items-end justify-between gap-6 mb-12">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-4">
                  Related Artifacts
                </p>
                <h2 className="font-display text-3xl md:text-4xl text-archive-900">
                  You May Also Appreciate
                </h2>
              </div>
              <Link
                to="/catalog"
                className="hidden md:inline-flex items-center gap-2 text-archive-600 hover:text-archive-900 transition-colors group"
              >
                <span className="text-sm uppercase tracking-wider">View All</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
