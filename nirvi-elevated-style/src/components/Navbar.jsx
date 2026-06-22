import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, LayoutDashboard, Menu, Search, ShoppingBag, Sparkles, TrendingUp, User, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import useDebouncedValue from '@/hooks/use-debounced-value';
import { CATEGORY_TO_COLLECTION, PRODUCT_COLLECTIONS, toCategoryLabel } from '@/lib/product-taxonomy';
import AnnouncementBar from './AnnouncementBar';

const categoryGroups = PRODUCT_COLLECTIONS.map((collection) => ({
  collection,
  categories: Object.entries(CATEGORY_TO_COLLECTION)
    .filter(([, group]) => group === collection)
    .map(([category]) => category),
}));

const storeHighlights = [
  {
    title: 'New Arrivals',
    copy: 'Fresh drops, latest silhouettes, and newly finished artisan pieces.',
    to: '/shop?sort=newest',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1778099980713-2096723600f8-newarrivals.webp',
  },
  {
    title: 'Bestsellers',
    copy: 'Customer-loved totes, charms, caps, and daily carry favorites.',
    to: '/shop?sort=bestseller',
    image: 'https://vris-images-2026.s3.ap-south-1.amazonaws.com/products/product-1778099980589-2a5058b668e5-ChatGPT%20Image%20May%207,%202026,%2002_08_35%20AM.webp',
  },
];

const storeEdits = [
  { label: 'Featured Picks', to: '/shop?sort=featured', description: 'A curated edit of standout VRIS pieces.' },
  { label: 'Gift Ready', to: '/shop?cat=keychains', description: 'Small handcrafted pieces made for thoughtful gifting.' },
  { label: 'Everyday Carry', to: '/shop?cat=totebags', description: 'Totes, sleeves, and pouches built for regular use.' },
  { label: 'Accessory Edit', to: '/shop?collection=Wool', description: 'Soft details, bracelets, and bag charms with personality.' },
];

const links = [
  { to: '/custom-product-request', label: 'Create' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?sort=bestseller', label: 'Trending' },
  { to: '/vris-plus', label: 'PLUS', badge: 'NEW' },
  { to: '/contact', label: 'Contact Us' },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const isUserAdmin = isAuthenticated && user?.role === 'admin';
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const currentQuery = searchParams.get('q') || '';
  const currentSort = searchParams.get('sort') || '';
  const isCheckoutPage = location.pathname === '/checkout';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSearchValue, setDesktopSearchValue] = useState(currentQuery);
  const [mobileSearchValue, setMobileSearchValue] = useState(currentQuery);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuCloseTimeoutRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const debouncedSearchValue = useDebouncedValue(desktopSearchValue, 250);
  const desktopNavLinkBase = 'text-sm font-medium tracking-wide transition-colors uppercase';
  const desktopNavLinkActive = 'text-white';
  const desktopNavLinkIdle = 'text-gray-400 hover:text-white';
  const authButtonBase = 'inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors';
  const profileDropdownItemClass = 'block w-full cursor-pointer rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900';
  const searchInputBaseClass = 'h-9 w-full rounded-full bg-white/10 border border-white/20 pl-9 text-sm text-white placeholder:text-gray-400 outline-none transition focus:bg-white/20 focus:border-white/30 focus:ring-4 focus:ring-white/10';
  const searchInputClass = `${searchInputBaseClass} pr-11`;
  const mobileSearchInputClass = `${searchInputBaseClass} pr-24`;
  const searchClearClass = 'absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 transition-colors hover:text-gray-700';
  const mobileSearchClearClass = 'absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700';
  const mobileSearchSubmitClass = 'absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90';

  const navigateToSearch = useCallback((rawQuery, options = {}) => {
    const normalizedQuery = rawQuery.trim();

    if (location.pathname !== '/shop' && !normalizedQuery) {
      return;
    }

    const nextParams = new URLSearchParams(location.pathname === '/shop' ? location.search : '');

    if (normalizedQuery) {
      nextParams.set('q', normalizedQuery);
    } else {
      nextParams.delete('q');
    }

    const nextSearch = nextParams.toString();

    navigate(
      {
        pathname: '/shop',
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: options.replace ?? location.pathname === '/shop' },
    );
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    setDesktopSearchValue(currentQuery);
    setMobileSearchValue(currentQuery);
  }, [currentQuery]);

  useEffect(() => () => {
    if (profileMenuCloseTimeoutRef.current) {
      window.clearTimeout(profileMenuCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const normalizedQuery = debouncedSearchValue.trim();
    const currentNormalizedQuery = currentQuery.trim();

    if (normalizedQuery === currentNormalizedQuery) {
      return;
    }

    navigateToSearch(debouncedSearchValue);
  }, [currentQuery, debouncedSearchValue, navigateToSearch]);

  const handleClearDesktopSearch = () => {
    setDesktopSearchValue('');
  };

  const handleClearMobileSearch = () => {
    setMobileSearchValue('');

    if (currentQuery) {
      navigateToSearch('');
    }
  };

  const handleMobileSearchSubmit = (event) => {
    event.preventDefault();
    navigateToSearch(mobileSearchValue);
    setMobileOpen(false);
  };

  const focusSearchInput = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const isDesktopViewport = window.matchMedia('(min-width: 768px)').matches;
    const targetInput = isDesktopViewport
      ? desktopSearchInputRef.current || mobileSearchInputRef.current
      : mobileSearchInputRef.current || desktopSearchInputRef.current;

    targetInput?.focus();
  };

  useEffect(() => {
    if (currentQuery) {
      focusSearchInput();
    }
  }, [currentQuery]);

  const clearProfileMenuCloseTimer = () => {
    if (profileMenuCloseTimeoutRef.current) {
      window.clearTimeout(profileMenuCloseTimeoutRef.current);
      profileMenuCloseTimeoutRef.current = null;
    }
  };

  const openProfileMenu = () => {
    clearProfileMenuCloseTimer();
    setIsProfileMenuOpen(true);
  };

  const closeProfileMenuWithDelay = () => {
    clearProfileMenuCloseTimer();
    profileMenuCloseTimeoutRef.current = window.setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 120);
  };

  const getShopSortLinkClass = (sort) => [
    desktopNavLinkBase,
    location.pathname === '/shop' && currentSort === sort ? desktopNavLinkActive : desktopNavLinkIdle,
  ].join(' ');

  const getMobileLinkClass = () => {
    return 'text-sm font-medium tracking-wide uppercase transition-colors text-gray-400 hover:text-white';
  };

  const getDesktopLinkClass = () => {
    return `group flex h-full items-center text-sm font-medium tracking-wide uppercase transition-colors text-gray-400 hover:text-white`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-black">
      <AnnouncementBar />
      <nav className="w-full relative">
        <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 flex items-center justify-between gap-4 h-14 md:h-16">
        {/* Left: hamburger + logo */}
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden shrink-0 text-white p-1"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className="inline-flex items-center" aria-label="Go to homepage">
            <img
              src="/Navbar_logo.png"
              alt="VRIS"
              className="h-14 w-auto object-contain md:h-16"
              loading="eager"
              decoding="async"
            />
          </Link>
        </div>

        {/* Center: nav links */}
        <div className="hidden lg:flex items-center gap-8 h-full">
          {/* Create */}
          <Link
            to="/custom-product-request"
            className={getDesktopLinkClass('/custom-product-request')}
          >
            <span className="relative">
              Create
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>

          {/* Shop */}
          <Link
            to="/shop"
            className={getDesktopLinkClass('/shop')}
          >
            <span className="relative">
              Shop
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>





          {/* Trending (with Mega Menu) */}
          <div className="group/mega h-full flex items-center static">
            <Link
              to="/shop?sort=bestseller"
              className={getDesktopLinkClass('/shop?sort=bestseller')}
            >
              <span className="relative">
                Trending
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#ef4444] tracking-normal">
                  HOT
                </span>
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Link>
            {!isCheckoutPage && (
              <div className="absolute left-0 right-0 top-[64px] hidden group-hover/mega:block bg-white/95 backdrop-blur-md border-b border-border shadow-xl">
                <div className="max-w-7xl mx-auto grid grid-cols-[0.9fr_1.6fr] gap-10 px-8 py-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-400">Trending Edit</p>
                    <h3 className="mt-3 font-display text-2xl font-bold text-gray-950">Discover what is moving now</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      Browse fresh arrivals, bestsellers, and curated edits designed for everyday utility with a handcrafted finish.
                    </p>
                    <div className="mt-6 grid gap-3">
                      {storeEdits.map((edit) => (
                        <Link
                          key={edit.label}
                          to={edit.to}
                          className="group/edit rounded-lg border border-gray-100 bg-white px-4 py-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
                        >
                          <span className="flex items-center justify-between gap-3 text-sm font-bold text-gray-900">
                            {edit.label}
                            <ArrowRight size={14} className="transition-transform group-hover/edit:translate-x-1" />
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-gray-500">{edit.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {storeHighlights.map((highlight) => (
                      <Link
                        key={highlight.title}
                        to={highlight.to}
                        className="group/highlight relative aspect-[5/3] overflow-hidden rounded-lg bg-gray-100 shadow-sm"
                      >
                        <img
                          src={highlight.image}
                          alt={highlight.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/highlight:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur">
                            {highlight.title === 'New Arrivals' ? <Sparkles size={12} /> : <TrendingUp size={12} />}
                            Trending
                          </span>
                          <h4 className="mt-3 text-lg font-bold">{highlight.title}</h4>
                          <p className="mt-1 text-xs leading-5 text-white/80">{highlight.copy}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* VRIS Plus */}
          <Link
            to="/vris-plus"
            className={getDesktopLinkClass('/vris-plus')}
          >
            <span className="relative">
              PLUS
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#e0b090] tracking-normal">
                NEW
              </span>
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>

          {/* Contact Us */}
          <Link
            to="/contact"
            className={getDesktopLinkClass('/contact')}
          >
            <span className="relative">
              Contact Us
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
            </span>
          </Link>
        </div>

        <div className="hidden md:block min-w-0 flex-1 max-w-sm lg:max-w-md xl:max-w-xl ml-4 lg:ml-8">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              ref={desktopSearchInputRef}
              type="text"
              value={desktopSearchValue}
              onChange={(e) => setDesktopSearchValue(e.target.value)}
              placeholder="Search for products, brands and more"
              className={searchInputClass}
            />
            {desktopSearchValue ? (
              <button
                type="button"
                onClick={handleClearDesktopSearch}
                className={searchClearClass}
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* Right: quick actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4">
          {isUserAdmin && (
            <>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-white/10 max-sm:hidden"
              >
                <LayoutDashboard size={14} />
                Admin Panel
              </Link>
              <Link
                to="/admin"
                className="text-white hover:text-gray-300 transition-colors p-1 sm:hidden"
                aria-label="Open admin panel"
              >
                <LayoutDashboard size={18} />
              </Link>
            </>
          )}
          <Link
            to="/wishlist"
            className={[
              'transition-colors p-1',
              location.pathname === '/wishlist' ? 'text-white' : 'text-white hover:text-gray-300',
            ].join(' ')}
            aria-label="Open wishlist"
          >
            <Heart size={18} />
          </Link>
            <Link to="/cart" className="relative text-white hover:text-gray-300 transition-colors p-1 mr-1 sm:mr-2" aria-label="Open cart">
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-foreground text-background text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div
              className="relative"
              onMouseEnter={openProfileMenu}
              onMouseLeave={closeProfileMenuWithDelay}
              onFocus={openProfileMenu}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  closeProfileMenuWithDelay();
                }
              }}
            >
                <Link
                  to="/profile"
                  className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-label="Open profile menu"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.name || 'Profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={16} />
                  )}
                </Link>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none hidden sm:block"
                      role="menu"
                      onMouseEnter={clearProfileMenuCloseTimer}
                      onMouseLeave={closeProfileMenuWithDelay}
                    >
                      <div className="rounded-t-xl bg-gray-900 p-4 text-white">
                        <p className="text-sm font-semibold tracking-wide">
                          Hello {user?.name || 'User'}
                      </p>
                      <p className="mt-1 text-xs text-gray-300">
                        {user?.phone || user?.mobile || user?.email || 'Signed in account'}
                      </p>
                    </div>

                    <div className="px-2 py-2">
                      <Link to="/orders" className={profileDropdownItemClass} role="menuitem">
                        Orders
                      </Link>
                      <Link to="/contact" className={profileDropdownItemClass} role="menuitem">
                        Contact Us
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 px-3 py-2">
                      <Link
                        to="/vris-plus"
                        className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-gray-100"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-1.5">
                          <img
                            src="/Navbar_logo.png"
                            alt="VRIS Logo"
                            className="h-[24px] w-auto object-contain"
                          />
                          <span className="font-bold text-sm tracking-wide text-gray-800">VRIS</span>
                        </span>
                        <span className="rounded bg-purple-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          Plus
                        </span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-100 px-2 py-2">
                      <Link to="/custom-product-request" className={profileDropdownItemClass} role="menuitem">
                        Custom Orders
                      </Link>
                      <Link to="/profile?section=edit#address-section" className={profileDropdownItemClass} role="menuitem">
                        Edit Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className={profileDropdownItemClass}
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <NavLink
                to="/login"
                className={({ isActive }) => [
                  authButtonBase,
                  isActive ? 'border-white bg-white text-black' : 'border-white/20 text-white hover:bg-white/10',
                ].join(' ')}
              >
                Login
              </NavLink>
              <NavLink
                to="/login?mode=signup"
                className={({ isActive }) => [
                  authButtonBase,
                  isActive ? 'border-white bg-white text-black' : 'border-white/20 text-white hover:bg-white/10',
                ].join(' ')}
              >
                Signup
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar (Outside) - Visible on Home and Shop Pages */}
      {(location.pathname === '/' || location.pathname === '/shop') && (
        <div className="md:hidden border-t border-white/10 bg-black px-4 py-1.5">
        <form className="relative" onSubmit={handleMobileSearchSubmit}>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            ref={mobileSearchInputRef}
            type="text"
            value={mobileSearchValue}
            onChange={(e) => setMobileSearchValue(e.target.value)}
            placeholder="Search for products, brands and more"
            className={mobileSearchInputClass}
          />
          {mobileSearchValue ? (
            <button
              type="button"
              onClick={handleClearMobileSearch}
              className={mobileSearchClearClass}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
          <button
            type="submit"
            className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90"
            aria-label="Search products"
          >
            <Search size={15} />
          </button>
        </form>
      </div>
      )}

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/10 bg-black overflow-hidden"
          >
            <div className="px-5 sm:px-8 py-5 flex flex-col gap-5">

              {isUserAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => [
                    'text-sm font-medium tracking-wide uppercase transition-colors',
                    isActive ? 'text-white' : 'text-gray-400 hover:text-white',
                  ].join(' ')}
                >
                  Admin Panel
                </NavLink>
              )}
              {links.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className={getMobileLinkClass(l)}
                >
                  {l.label}
                </Link>
              ))}

              <Link
                to="/vris-plus"
                onClick={() => setMobileOpen(false)}
                className="flex cursor-pointer items-center justify-between transition-colors group"
              >
                <span className="flex items-center gap-1.5">
                  <img
                    src="/Navbar_logo.png"
                    alt="VRIS Logo"
                    className="h-[36px] w-auto object-contain"
                  />
                  <span className="font-bold text-sm tracking-wide text-gray-400 group-hover:text-white transition-colors">VRIS</span>
                </span>
                <span className="rounded bg-purple-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Plus
                </span>
              </Link>

              <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) => [
                        'text-sm font-medium tracking-wide uppercase transition-colors',
                        isActive ? 'text-white' : 'text-gray-400 hover:text-white',
                      ].join(' ')}
                    >
                      Profile
                    </NavLink>
                    <NavLink
                      to="/orders"
                      className={({ isActive }) => [
                        'text-sm font-medium tracking-wide uppercase transition-colors',
                        isActive ? 'text-white' : 'text-gray-400 hover:text-white',
                      ].join(' ')}
                    >
                      Orders
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-full border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <NavLink
                      to="/login"
                      className={({ isActive }) => [
                        authButtonBase,
                        'w-full',
                        isActive ? 'border-white bg-white text-black' : 'border-white/20 text-white hover:bg-white/10',
                      ].join(' ')}
                    >
                      Login
                    </NavLink>
                    <NavLink
                      to="/login?mode=signup"
                      className={({ isActive }) => [
                        authButtonBase,
                        'w-full',
                        isActive ? 'border-white bg-white text-black' : 'border-white/20 text-white hover:bg-white/10',
                      ].join(' ')}
                    >
                      Signup
                    </NavLink>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
