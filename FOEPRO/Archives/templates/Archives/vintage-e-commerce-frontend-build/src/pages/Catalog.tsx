import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, categories, eras } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { getDisplayRating, getStoredRatings } from '@/utils/ratings';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedEra, setSelectedEra] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    setUserRatings(getStoredRatings());
  }, []);

  useEffect(() => {
    console.log(selectedRating);
  }, [selectedRating]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by era
    if (selectedEra) {
      result = result.filter(p => p.era === selectedEra);
    }

    // Filter by price
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filter by rating
    if (selectedRating) {
      result = result.filter(product => product.rating >= Number(selectedRating));
    }

    const ratingForSort = (productId: string) => userRatings[productId];

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        result.sort((a, b) => {
          const aRating = getDisplayRating(a, ratingForSort(a.id));
          const bRating = getDisplayRating(b, ratingForSort(b.id));
          return bRating - aRating || b.year - a.year;
        });
        break;
      case 'newest':
        result.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0) || b.year - a.year);
        break;
    }

    return result;
  }, [selectedCategory, selectedEra, priceRange, selectedRating, sortBy, userRatings]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedEra('');
    setPriceRange([0, 5000]);
    setSelectedRating('');
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = selectedCategory || selectedEra || priceRange[0] > 0 || priceRange[1] < 5000 || selectedRating;

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-4 animate-slide-up">
            The Collection
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-archive-900 animate-slide-up">
              All Artifacts
            </h1>
            <p className="text-archive-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-archive-200">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="md:hidden flex items-center gap-2 text-archive-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-archive-900" />
            )}
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex flex-wrap items-center gap-4">
            {/* Category */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-archive-200 rounded-full text-sm cursor-pointer hover:border-archive-400 transition-colors focus:outline-none focus:border-archive-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-archive-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Era */}
            <div className="relative">
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-archive-200 rounded-full text-sm cursor-pointer hover:border-archive-400 transition-colors focus:outline-none focus:border-archive-500"
              >
                <option value="">All Eras</option>
                {eras.map(era => (
                  <option key={era.id} value={era.id}>{era.name}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-archive-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                placeholder="Min"
                className="w-24 px-3 py-2 bg-white border border-archive-200 rounded-full text-sm focus:outline-none focus:border-archive-500"
              />
              <span className="text-archive-400">—</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                placeholder="Max"
                className="w-24 px-3 py-2 bg-white border border-archive-200 rounded-full text-sm focus:outline-none focus:border-archive-500"
              />
            </div>

            {/* Ratings */}
            <div className="relative">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-white border border-archive-200 rounded-full text-sm cursor-pointer hover:border-archive-400 transition-colors focus:outline-none focus:border-archive-500"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-archive-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-archive-500 hover:text-archive-900 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none px-4 py-2 pr-10 bg-white border border-archive-200 rounded-full text-sm cursor-pointer hover:border-archive-400 transition-colors focus:outline-none focus:border-archive-500"
            >
              <option value="newest">Newest</option>
              <option value="rating-desc">Ratings: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-archive-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mobile Filters Panel */}
        {isFiltersOpen && (
          <div className="md:hidden mb-8 p-6 bg-white rounded-lg shadow-sm animate-fade-in">
            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm text-archive-600 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-archive-50 border border-archive-200 rounded text-sm focus:outline-none focus:border-archive-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Era */}
              <div>
                <label className="block text-sm text-archive-600 mb-2">Era</label>
                <select
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value)}
                  className="w-full px-4 py-3 bg-archive-50 border border-archive-200 rounded text-sm focus:outline-none focus:border-archive-500"
                >
                  <option value="">All Eras</option>
                  {eras.map(era => (
                    <option key={era.id} value={era.id}>{era.name}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm text-archive-600 mb-2">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    placeholder="Min"
                    className="flex-1 px-4 py-3 bg-archive-50 border border-archive-200 rounded text-sm focus:outline-none focus:border-archive-500"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    placeholder="Max"
                    className="flex-1 px-4 py-3 bg-archive-50 border border-archive-200 rounded text-sm focus:outline-none focus:border-archive-500"
                  />
                </div>
              </div>

              {/* Ratings */}
              <div>
                <label className="block text-sm text-archive-600 mb-2">Ratings</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-4 py-3 bg-archive-50 border border-archive-200 rounded text-sm focus:outline-none focus:border-archive-500"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-3 text-sm text-archive-600 border border-archive-200 rounded hover:bg-archive-50 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-editorial text-2xl text-archive-600 mb-4">No artifacts found</p>
            <p className="text-archive-500 mb-6">Try adjusting your filters</p>
            <button
              onClick={clearFilters}
              className="text-sm uppercase tracking-wider text-archive-900 border-b border-archive-900 pb-1"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
