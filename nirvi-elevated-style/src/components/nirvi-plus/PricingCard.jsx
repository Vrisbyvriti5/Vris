import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { plusAPI } from '@/lib/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PricingCard = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    'Free & Fast Delivery',
    'Early Access to new collections',
    'Exclusive discounts & coupons',
    'VIP Customer Support',
    'Surprise gifts with orders',
  ];

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please login to subscribe to NirviPlus.',
      });
      navigate('/login?redirect=/nirvi-plus');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // Step 1: Create subscription/order on backend
      const orderData = await plusAPI.createSubscription();

      // Step 2: Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_yourkey', // Fallback for dev
        amount: orderData.amount,
        currency: 'INR',
        name: 'NIRVI',
        description: 'NirviPlus Membership',
        image: '/Navbar_logo.png',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Step 3: Verify payment on backend
            const verifyData = await plusAPI.verifySubscription({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyData.success) {
              toast({
                title: 'Welcome to NirviPlus!',
                description: 'Your membership is active. Check your email for details.',
                duration: 5000,
              });
              // Refresh page or update context to show active status
              setTimeout(() => window.location.reload(), 2000);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: err.message,
            });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || user?.mobile || '',
        },
        theme: {
          color: '#e0b090', // Pink accent
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="pricing-section" className="bg-background py-16 pt-16 px-5 sm:px-8 md:px-12 lg:px-16 border-b border-border">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center items-stretch gap-8 md:gap-10">
        {/* Free Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="flex-1 relative bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-sm flex flex-col"
        >
          <div className="text-center flex-grow">
            <h3 className="text-xl font-display font-bold text-foreground mb-2">Nirvi Free</h3>
            <p className="text-muted-foreground font-body text-sm mb-6">Standard shopping experience</p>
            
            <div className="flex items-end justify-center gap-1 mb-8">
              <span className="text-4xl font-display font-bold text-foreground">₹0</span>
              <span className="text-muted-foreground font-body mb-1">/month</span>
            </div>

            <button
              disabled
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-bold uppercase tracking-widest text-xs transition-colors cursor-not-allowed mb-4"
            >
              Current Plan
            </button>

            <div className="mt-4 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Check className="text-gray-400" size={12} />
                </div>
                <span className="text-gray-500 font-body text-sm">Standard Delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Check className="text-gray-400" size={12} />
                </div>
                <span className="text-gray-500 font-body text-sm">Standard Support</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plus Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "100px" }}
          className="flex-1 relative overflow-visible z-10 bg-white border-2 border-[#e0b090] rounded-3xl p-8 md:p-10 shadow-xl flex flex-col"
        >
          {/* Best Value Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#e0b090] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-md z-20">
            Best Value
          </div>

          <div className="text-center flex-grow relative z-10">
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">NirviPlus Membership</h3>
            <p className="text-muted-foreground font-body text-sm mb-6">Upgrade your lifestyle today.</p>
            
            <div className="flex items-end justify-center gap-1 mb-8">
              <span className="text-5xl font-display font-bold text-foreground">₹99</span>
              <span className="text-muted-foreground font-body mb-1">/month</span>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-[#e0b090] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#d6a382] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-70 mb-4"
            >
              {isProcessing ? 'Processing...' : 'Start Membership'}
            </button>
            <p className="text-xs text-gray-400 font-body mt-2 text-center">Cancel anytime. No hidden fees.</p>

            <div className="mt-6 space-y-4 text-left">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#e0b090]/10 flex items-center justify-center shrink-0">
                    <Check className="text-[#e0b090]" size={12} />
                  </div>
                  <span className="text-gray-700 font-body text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingCard;
