import React, { useEffect, useMemo, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { 
  User, Package, Heart, LogOut, CheckCircle2, ShieldAlert, 
  MapPin, Trash2, Eye, EyeOff, Camera, CreditCard, Wallet, 
  Ticket, Bell, HelpCircle, ShieldCheck, ChevronLeft, ChevronRight, AlertCircle,
  CalendarDays, Star, Crown, ShoppingBag, XCircle, RotateCcw, Box, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useCheckout } from '@/context/CheckoutContext';
import { authAPI, ordersAPI, productsAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Breadcrumb = () => (
  <nav className="flex text-[13px] font-medium text-gray-500 mb-6">
    <Link to="/" className="hover:text-black transition-colors">Home</Link>
    <span className="mx-2">›</span>
    <span className="text-[#e0b090] font-semibold">My Account</span>
  </nav>
);

const QuickActionCard = ({ icon: Icon, title, subtitle, to, onClick }) => (
  <div 
    onClick={onClick}
    className="flex-1 flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-[#ebd1c1] hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <div className="bg-[#f3f4f6] p-3.5 rounded-full text-gray-700 group-hover:bg-[#fbf5f1] group-hover:text-[#e0b090] transition-colors">
        <Icon size={22} strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="text-[15px] font-bold text-gray-900 font-display">{title}</h3>
        <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#e0b090] transition-colors" />
  </div>
);

const QuickActionsRail = ({ onSecurityClick, onAddressesClick }) => {
  const cardSlotClass = 'shrink-0 basis-full sm:basis-[calc((100%_-_0.75rem)/2)] lg:basis-[calc((100%_-_2.25rem)/4)] snap-start';

  return (
    <div className="relative w-full">
      <div
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
      >
        <div className={cardSlotClass} data-quick-action-card>
          <QuickActionCard icon={ShieldCheck} title="Login & Security" subtitle="Edit password & mobile" onClick={onSecurityClick} />
        </div>
        <div className={cardSlotClass} data-quick-action-card>
          <QuickActionCard icon={MapPin} title="Your Addresses" subtitle="Edit or add new" onClick={onAddressesClick} />
        </div>
        <Link to="/wishlist" className={cardSlotClass} data-quick-action-card>
          <QuickActionCard icon={Heart} title="Your Wishlist" subtitle="View saved items" />
        </Link>
        {/* <Link to="/custom-product-request" className={cardSlotClass} data-quick-action-card>
          <QuickActionCard icon={Palette} title="Custom Orders" subtitle="Request personalized products" />
        </Link> */}
      </div>
    </div>
  );
};

const OrderStatCard = ({ icon: Icon, count, label, colorClass, bgClass, iconColorClass }) => (
  <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-all cursor-default">
    <div className={`${bgClass} p-3 rounded-full ${iconColorClass}`}>
      <Icon size={20} strokeWidth={1.5} />
    </div>
    <div>
      <h4 className="text-xl font-bold text-gray-900 leading-none">{count}</h4>
      <p className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile, refreshProfile, loading } = useAuth();
  const { savedAddresses, deleteAddress } = useCheckout();
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section') || '';
  const [activeSection, setActiveSection] = useState(initialSection);
  const fileInputRef = useRef(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', dob: '', gender: '', defaultAddressEnabled: true,
  });

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dashboard Dynamic State
  const [orders, setOrders] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Mock Stats for UI (Fallback)
  const memberSince = useMemo(() => {
    try {
      if (user?.created_at) {
        const date = new Date(user.created_at);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }
    } catch(e) {}
    return 'Recently';
  }, [user]);
  const savedPincode = user?.pincode || 'Not Set';

  useEffect(() => {
    if (user) {
      setFormData({
        name: String(user?.name || ''), phone: String(user?.phone || user?.mobile || ''),
        addressLine1: String(user?.address_line1 || ''), addressLine2: String(user?.address_line2 || ''),
        city: String(user?.city || ''), state: String(user?.state || ''), pincode: String(user?.pincode || ''),
        dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '', gender: String(user?.gender || ''),
        defaultAddressEnabled: Boolean(user?.default_address_enabled),
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      ordersAPI.getMyOrders().then(res => {
        if (res.success) setOrders(res.data || []);
      }).catch(err => console.error('[Profile] Failed to fetch orders:', err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.slice(1);
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }, [location.hash]);

  useEffect(() => {
    productsAPI.getAll().then(res => {
      const items = res.data || res.products || res || [];
      // Prefer trending/new products, here we just take the first 6 as "Recommended"
      setRecommendedProducts(Array.isArray(items) ? items.slice(0, 6) : []);
    }).catch(err => console.error('[Profile] Failed to fetch recommended:', err));
    
    try {
      const viewed = JSON.parse(localStorage.getItem('vris_recently_viewed') || '[]');
      setRecentlyViewed(viewed);
    } catch(e) {}
  }, []);

  const profilePhone = useMemo(() => String(user?.phone || user?.mobile || '').trim(), [user]);
  
  const completionPercent = useMemo(() => {
    const completionItems = [
      Boolean(String(user?.name || '').trim()), Boolean(String(user?.email || '').trim()),
      Boolean(String(user?.phone || '').trim()), Boolean(String(user?.address_line1 || '').trim()),
      Boolean(String(user?.city || '').trim()), Boolean(String(user?.state || '').trim()),
      Boolean(String(user?.pincode || '').trim()), Boolean(user?.default_address_enabled),
    ];
    return Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100);
  }, [user]);

  const toggleSection = (section) => {
    const newSection = activeSection === section ? '' : section;
    setActiveSection(newSection);
    if (newSection) {
      setTimeout(() => document.getElementById(`${newSection}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  };

  const handleComingSoon = (title) => {
    toast({ title: 'Coming Soon', description: `${title} feature will be available shortly.` });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const nextName = String(formData.name || '').trim();
    const nextPhone = String(formData.phone || '').trim();
    const nextPincode = String(formData.pincode || '').trim();
    const nextErrors = {};

    if (!nextName) nextErrors.name = 'Name is required.';
    if (nextPhone && !/^\d{10,15}$/.test(nextPhone)) nextErrors.phone = 'Enter a valid 10 to 15 digit mobile number.';
    if (nextPincode && !/^\d{6}$/.test(nextPincode)) nextErrors.pincode = 'Enter a valid 6 digit pincode.';

    if (Object.keys(nextErrors).length > 0) { setFieldErrors(nextErrors); return; }

    setFieldErrors({}); setProfileSuccessMessage('');
    const result = await updateProfile({ ...formData, name: nextName, phone: nextPhone, pincode: nextPincode });

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Unable to update profile', description: result.message || 'Please try again.' });
      return;
    }

    setProfileSuccessMessage('Profile saved successfully.');
    toast({ title: 'Profile updated', description: 'Your profile details were saved successfully.' });
    setActiveSection('');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!passwordData.currentPassword) nextErrors.currentPassword = 'Current password is required.';
    if (!passwordData.newPassword) nextErrors.newPassword = 'New password is required.';
    if (passwordData.newPassword && passwordData.newPassword.length < 6) nextErrors.newPassword = 'New password must be at least 6 characters.';
    if (!passwordData.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required.';
    if (passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(nextErrors).length > 0) { setPasswordErrors(nextErrors); return; }

    setPasswordErrors({}); setPasswordSuccessMessage(''); setIsChangingPassword(true);
    try {
      await authAPI.changePassword(passwordData);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccessMessage('Password updated successfully.');
      toast({ title: 'Password changed', description: 'Your password was updated successfully.' });
      setTimeout(() => setActiveSection(''), 2000);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Unable to change password', description: error.data?.message || error.message || 'Failed to change password.' });
    } finally { setIsChangingPassword(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData(); form.append('avatar', file);
    try {
      await authAPI.uploadAvatar(form);
      await refreshProfile();
      toast({ title: 'Avatar updated', description: 'Your profile picture has been updated successfully.' });
      setIsAvatarModalOpen(false);
    } catch (error) { toast({ variant: 'destructive', title: 'Failed to update avatar', description: error.message || 'Please try again.' }); }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsDeletingAvatar(true);
      await authAPI.deleteAvatar();
      await refreshProfile();
      toast({ title: 'Avatar removed', description: 'Your profile picture has been removed successfully.' });
      setIsAvatarModalOpen(false);
    } catch (error) { 
      toast({ variant: 'destructive', title: 'Failed to remove avatar', description: error.message || 'Please try again.' }); 
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const pendingOrders = orders.filter(o => ['Pending', 'Processing'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
  const returnedOrders = orders.filter(o => o.status === 'Returned').length;
  const latestOrder = orders[0];
  const latestItem = latestOrder?.items?.[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-[96px] md:pt-[104px] pb-20 w-full px-4 sm:px-8 max-w-[1280px] mx-auto space-y-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 w-full bg-white rounded-2xl border border-gray-100 p-8 flex gap-6 shadow-sm animate-pulse">
            <div className="h-24 w-24 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-3 flex-1 pt-2">
              <div className="h-6 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-[96px] md:pt-[104px] pb-20 w-full px-5 text-center">
          <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold font-display text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6 font-body">Please login to view your personal dashboard.</p>
          <Link to="/login" className="inline-block px-8 py-3 bg-foreground text-background text-xs font-bold tracking-widest uppercase rounded-full hover:scale-105 transition-transform">
            Login Now
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />
      
      <div className="pt-[96px] md:pt-[104px] pb-24 w-full px-4 sm:px-8 max-w-[1280px] mx-auto space-y-4">
        
        {/* Header section */}
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 mb-1">My Account</h1>
          <Breadcrumb />
        </div>

        {/* TOP SUMMARY CARD (Exactly like reference) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col xl:flex-row gap-5 xl:gap-0 justify-between items-center relative overflow-hidden">
          
          {/* Left Side: Avatar & Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 w-full">
            <div 
              className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-full bg-[#fbf5f1] group cursor-pointer"
              onClick={() => user?.avatar_url ? setIsAvatarModalOpen(true) : fileInputRef.current?.click()}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.avatar_url}`} alt={user?.name} className="h-full w-full rounded-full object-cover" />
              ) : (
                <User size={40} className="text-[#e0b090]" strokeWidth={1.5} />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} onClick={e => e.stopPropagation()} />
            </div>

            <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
              <DialogContent className="sm:max-w-md gap-6">
                <DialogTitle className="sr-only">Profile Avatar Options</DialogTitle>
                <DialogDescription className="sr-only">View, update, or remove your profile avatar.</DialogDescription>
                
                {user?.avatar_url && (
                  <div className="flex justify-center mb-2">
                    <div className="h-64 w-64 md:h-80 md:w-80 overflow-hidden outline outline-1 outline-gray-200 shadow-sm rounded-full">
                      <img 
                        src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.avatar_url}`} 
                        alt="Profile Avatar Large" 
                        className="h-full w-full object-cover" 
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      setIsAvatarModalOpen(false);
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    }} 
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    Change Photo
                  </button>
                  <button 
                    onClick={handleRemoveAvatar} 
                    disabled={isDeletingAvatar}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-200 text-red-600 cursor-pointer text-sm font-medium rounded-full hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    {isDeletingAvatar ? 'Removing...' : 'Remove Photo'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            
            <div className="flex-1 text-center sm:text-left flex flex-col justify-center h-full pt-1">
              <h2 className="font-display text-2xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[13px] text-gray-500 mt-1">
                <span>{user?.email}</span>
                {profilePhone && <><span className="text-gray-300">•</span><span>{profilePhone}</span></>}
              </div>
              
              <div className="mt-2">
                {user?.phone_verified ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[#e8fbf3] px-2 py-0.5 text-[10px] font-bold text-[#10b981] border border-[#a7f3d0]">
                    <CheckCircle2 size={12} /> VERIFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-[#fef2f2] px-2 py-0.5 text-[10px] font-bold text-[#ef4444] border border-[#fecaca]">
                    <ShieldAlert size={12} /> UNVERIFIED
                  </span>
                )}
              </div>

              <div className="mt-5 max-w-sm">
                <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  <span>Profile Completion</span>
                  <span className="text-[#e0b090]">{completionPercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#e0b090]" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Stats & Edit Button */}
          <div className="flex flex-col sm:flex-row items-center gap-5 xl:border-l xl:border-gray-100 xl:pl-8 w-full xl:w-auto">
            <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start sm:gap-8 border-t border-gray-100 sm:border-t-0 pt-5 sm:pt-0">
              
              <div className="flex items-center gap-3">
                <div className="p-2 border border-gray-200 rounded-full"><CalendarDays size={18} className="text-gray-600" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Member Since</p>
                  <p className="text-sm font-bold text-gray-900">{memberSince}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 border border-gray-200 rounded-full"><MapPin size={18} className="text-gray-600" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Saved Pincode</p>
                  <p className="text-sm font-bold text-gray-900">{savedPincode}</p>
                </div>
              </div>

            </div>
            
            <button
              onClick={() => toggleSection('edit')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#ebd1c1] text-[#e0b090] text-[11px] font-extrabold uppercase tracking-widest hover:bg-[#fbf5f1] transition-colors"
            >
              {activeSection === 'edit' ? 'Close Editor' : 'Edit Profile'}
            </button>
          </div>

        </div>

        {/* Mobile OTP Verification Alert */}
        {!user?.phone_verified && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-[#fbf5f1] p-4 rounded-xl border border-[#ebd1c1]">
            <p className="text-sm text-[#d6a382] font-semibold mb-3 sm:mb-0">Verify your mobile number to unlock all features.</p>
            <div className="flex gap-3 w-full sm:w-auto">
              {!showOtpInput ? (
                <button
                  disabled={isSendingMobileOtp}
                  onClick={async () => {
                    setIsSendingMobileOtp(true);
                    try {
                      await authAPI.sendMobileOtp();
                      setShowOtpInput(true);
                      toast({ title: 'OTP sent' });
                    } catch (error) { toast({ variant: 'destructive', title: 'Could not send OTP' }); } 
                    finally { setIsSendingMobileOtp(false); }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#e0b090] text-white text-[11px] font-extrabold uppercase tracking-[0.16em] hover:bg-[#d6a382] transition-all disabled:opacity-60"
                >
                  {isSendingMobileOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6 digit OTP"
                    className="w-32 h-10 rounded-full border border-[#ebd1c1] px-4 text-sm focus:border-[#e0b090] outline-none"
                  />
                  <button
                    disabled={isVerifyingMobileOtp || mobileOtp.length !== 6}
                    onClick={async () => {
                      setIsVerifyingMobileOtp(true);
                      try {
                        await authAPI.verifyMobileOtp(mobileOtp);
                        await refreshProfile();
                        setMobileOtp(''); setShowOtpInput(false);
                        toast({ title: 'Mobile verified' });
                      } catch (error) { toast({ variant: 'destructive', title: 'OTP verification failed' }); } 
                      finally { setIsVerifyingMobileOtp(false); }
                    }}
                    className="px-6 rounded-full bg-gray-900 text-white text-[11px] font-extrabold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-60"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXPANDABLE FORMS */}
        <AnimatePresence mode="wait">
            {activeSection === 'edit' && (
              <motion.div key="edit" id="edit-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-4">Edit Profile Details</h3>
                  <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-5 sm:grid-cols-2 max-w-4xl">
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Full Name</label><input value={formData.name} onChange={(e) => setFormData(c => ({ ...c, name: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Mobile Number</label><input value={formData.phone} onChange={(e) => setFormData(c => ({ ...c, phone: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Email</label><input value={user?.email || ''} disabled className="h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-sm text-gray-400 cursor-not-allowed outline-none" /></div>
                    <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Address Line 1</label><input value={formData.addressLine1} onChange={(e) => setFormData(c => ({ ...c, addressLine1: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5 sm:col-span-2"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Address Line 2 (Optional)</label><input value={formData.addressLine2} onChange={(e) => setFormData(c => ({ ...c, addressLine2: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">City</label><input value={formData.city} onChange={(e) => setFormData(c => ({ ...c, city: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">State</label><input value={formData.state} onChange={(e) => setFormData(c => ({ ...c, state: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Pincode</label><input value={formData.pincode} onChange={(e) => setFormData(c => ({ ...c, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none" /></div>
                    <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Gender</label><select value={formData.gender} onChange={(e) => setFormData(c => ({ ...c, gender: e.target.value }))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] focus:ring-1 focus:ring-[#e0b090] outline-none"><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                    
                    <div className="sm:col-span-2 pt-4 flex justify-end gap-3 border-t border-gray-100">
                      <button type="button" onClick={() => toggleSection('edit')} className="px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-100">Cancel</button>
                      <button type="submit" className="px-8 py-2.5 rounded-full bg-[#111827] text-[11px] font-bold uppercase tracking-widest text-white shadow-md hover:bg-gray-800">Save Changes</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div key="security" id="security-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-4">Login & Security</h3>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                     <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Current Password</label><input type="password" value={passwordData.currentPassword} onChange={e => setPasswordData(c => ({...c, currentPassword: e.target.value}))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] outline-none" /></div>
                     <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">New Password</label><input type="password" value={passwordData.newPassword} onChange={e => setPasswordData(c => ({...c, newPassword: e.target.value}))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] outline-none" /></div>
                     <div className="space-y-1.5"><label className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Confirm Password</label><input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData(c => ({...c, confirmPassword: e.target.value}))} className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-[#e0b090] outline-none" /></div>
                     <div className="pt-3">
                       <button type="submit" className="px-8 py-2.5 rounded-full bg-[#111827] text-[11px] font-bold uppercase tracking-widest text-white shadow-md hover:bg-gray-800">Update Password</button>
                     </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeSection === 'addresses' && (
              <motion.div key="addresses" id="addresses-section" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-4">Your Addresses</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {savedAddresses?.map(addr => (
                      <div key={addr.id} className="p-5 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-start mb-2"><span className="font-bold text-gray-900 text-sm">{addr.fullName}</span><button onClick={()=>deleteAddress(addr.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></div>
                        <p className="text-xs text-gray-600 mb-2">{addr.mobile}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{addr.fullAddress}<br/>{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    ))}
                    <button onClick={() => toggleSection('edit')} className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:text-[#e0b090] hover:border-[#e0b090] transition-colors min-h-[160px]">
                      <MapPin size={24} className="mb-2" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Add New</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* QUICK ACTIONS ROW */}
        <QuickActionsRail
          onSecurityClick={() => toggleSection('security')}
          onAddressesClick={() => toggleSection('addresses')}
        />

        {/* MAIN DASHBOARD SPLIT ROW */}
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* LEFT COLUMN: Orders */}
          <div className="flex-1 space-y-4">
            
            {/* Order Summary */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-[17px] font-bold text-gray-900">Your Order Summary</h3>
                <Link to="/orders" className="text-[12px] font-bold text-[#e0b090] hover:underline">View All Orders</Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <OrderStatCard icon={ShoppingBag} count={pendingOrders} label="Pending Orders" bgClass="bg-[#e0b090]/10" iconColorClass="text-[#e0b090]" />
                <OrderStatCard icon={Box} count={deliveredOrders} label="Delivered Orders" bgClass="bg-green-50" iconColorClass="text-green-600" />
                <OrderStatCard icon={XCircle} count={cancelledOrders} label="Cancelled Orders" bgClass="bg-orange-50" iconColorClass="text-orange-500" />
                <OrderStatCard icon={RotateCcw} count={returnedOrders} label="Returns / Refunds" bgClass="bg-purple-50" iconColorClass="text-purple-600" />
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h3 className="font-display text-[17px] font-bold text-gray-900 mb-3 ml-1">Recent Orders</h3>
              {latestOrder ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center w-full">
                    <div className="h-20 w-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img src={latestItem?.product?.image ? (latestItem.product.image.startsWith('http') ? latestItem.product.image : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${latestItem.product.image}`) : (latestItem?.image ? (latestItem.image.startsWith('http') ? latestItem.image : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${latestItem.image}`) : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=200')} alt="Order Item" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{latestItem?.product?.name || latestItem?.name || 'VRIS Product'}</h4>
                      <p className="text-xs text-gray-500 mt-1">Order ID: #{String(latestOrder.id || '').slice(0,8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">Size: {latestItem?.size || 'One Size'}  •  Qty: {latestItem?.quantity || 1}</p>
                      <p className="text-[15px] font-bold text-gray-900 mt-1.5">₹{latestOrder.total_price || latestOrder.totalPrice}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:items-end w-full sm:w-auto gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className={`text-[13px] font-bold ${latestOrder.status === 'Delivered' ? 'text-green-600' : latestOrder.status === 'Cancelled' ? 'text-red-500' : 'text-orange-500'}`}>{latestOrder.status}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{latestOrder.created_at ? new Date(latestOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</p>
                    </div>
                    <Link to={`/orders/${latestOrder.id}`} className="w-full sm:w-auto px-5 py-2 rounded-full border border-gray-200 text-gray-900 text-[11px] font-bold uppercase tracking-widest hover:border-gray-900 transition-colors text-center">
                      View Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <ShoppingBag size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500 mb-4">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="inline-flex px-6 py-2 rounded-full bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Start Shopping</Link>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Rewards & Referrals */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-4">
            
            {/* Refer & Earn */}
            <div className="rounded-2xl bg-[#fff5f7] relative overflow-hidden shadow-sm border border-[#ffe4eb] flex flex-col justify-between">
              <div className="p-5 sm:p-6 relative z-10 w-[60%]">
                <h3 className="font-display text-[17px] font-bold text-gray-900 mb-1">Refer & Earn</h3>
                <p className="text-[12px] text-gray-600 mb-2">Invite your friends and earn</p>
                <h4 className="text-[15px] font-bold text-[#e0b090] mb-4">200 VRIS Credits</h4>
                <button onClick={() => handleComingSoon('Referral System')} className="px-5 py-2 rounded-full border border-gray-900 text-gray-900 text-[11px] font-extrabold uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                  Refer Now
                </button>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/2">
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400" alt="Refer & Earn" className="w-full h-full object-cover rounded-tl-full opacity-90" />
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SHOPPING SECTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-gray-100 mt-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-[17px] font-bold text-gray-900">Recently Viewed</h3>
              <Link to="/shop" className="text-[12px] font-bold text-[#e0b090] hover:underline">View All</Link>
            </div>
            {recentlyViewed.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recentlyViewed.map((item, i) => (
                  <Link to={`/product/${item.id}`} key={i} className="h-[180px] w-[140px] shrink-0 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden snap-start cursor-pointer group relative">
                    <img src={item.image ? (item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${item.image}`) : ''} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-[180px] rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Eye size={24} className="mb-2" />
                <span className="text-xs font-medium">No recently viewed items</span>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-[17px] font-bold text-gray-900">Recommended For You</h3>
              <Link to="/shop" className="text-[12px] font-bold text-[#e0b090] hover:underline">View All</Link>
            </div>
            {recommendedProducts.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {recommendedProducts.map((item, i) => {
                  const imageSrc = item.image ? item.image : (item.images?.[0] || '');
                  return (
                    <Link to={`/product/${item.id}`} key={i} className="h-[180px] w-[140px] shrink-0 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden snap-start cursor-pointer group relative">
                      <img src={imageSrc.startsWith('http') ? imageSrc : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${imageSrc}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="h-[180px] rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <Box size={24} className="mb-2" />
                <span className="text-xs font-medium">No recommendations yet</span>
              </div>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default Profile;
