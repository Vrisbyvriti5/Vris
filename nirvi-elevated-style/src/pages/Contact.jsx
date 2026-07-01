import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, Instagram, Twitter, MessageSquare, ArrowRight } from 'lucide-react';
import { contactAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const emptyForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const supportCards = [
  {
    icon: Phone,
    title: 'Call Support',
    detail: '+91 86071 87086',
    note: 'Active orders & time-sensitive help.',
    href: 'tel:+918607187086',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Mail,
    title: 'Email VRIS',
    detail: 'Vrisbyvriti5@gmail.com',
    note: 'Care questions & custom requests.',
    href: 'mailto:Vrisbyvriti5@gmail.com',
    color: 'bg-[#e0b090]/10 text-[#e0b090]',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    detail: 'Direct Message',
    note: 'Quick chats and style advice.',
    href: 'https://wa.me/918607187086',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/project.vris?igsh=MWNsbmcxd2Qxanl0Mw==' },
  { icon: Twitter, label: 'Twitter', href: '#' },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name: String(formData.name || '').trim(),
      email: String(formData.email || '').trim().toLowerCase(),
      subject: String(formData.subject || '').trim(),
      message: String(formData.message || '').trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setSubmitError('Please fill all fields before sending.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await contactAPI.createMessage(payload);
      setSubmitMessage(response.message || 'Message sent successfully.');
      setFormData(emptyForm);
      toast({ title: 'Success', description: 'We will get back to you shortly.' });
    } catch (error) {
      setSubmitError(error.data?.message || 'Unable to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />
      
      <main className="w-full pt-[96px] md:pt-[104px] pb-24 px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="mx-auto max-w-7xl">
          
          {/* Header Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-white border border-[#ebedf0] px-8 py-12 sm:px-12 sm:py-16 shadow-sm"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none">
              <img 
                src="/contact_hero_abstract_1777843379645.png" 
                alt="Abstract Background" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block rounded-full bg-[#e0b090]/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#e0b090]">
                Contact & Support
              </span>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
                We're here for <span className="text-[#e0b090]">anything</span> you need.
              </h1>
              <p className="mt-4 text-base leading-7 text-[#6b7280] max-w-xl font-light">
                Whether it's an order update, a style question, or just saying hello, we're ready to help you with the VRIS experience.
              </p>
            </div>
          </motion.div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
            
            {/* Sidebar Details */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-10"
            >
              {/* Support Cards */}
              <div className="grid gap-4">
                {supportCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <a 
                      key={card.title} 
                      href={card.href}
                      className="group flex items-center gap-4 rounded-3xl border border-[#ebedf0] bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.color} transition-transform group-hover:rotate-6`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">{card.title}</h3>
                        <p className="mt-1 text-base font-semibold text-[#4b5563]">{card.detail}</p>
                        <p className="mt-1 text-xs text-[#9ca3af]">{card.note}</p>
                      </div>
                      <ArrowRight className="text-gray-300 group-hover:text-[#e0b090] transition-colors" size={20} />
                    </a>
                  );
                })}
              </div>

              {/* Detail Blocks */}
              <div className="rounded-[2rem] bg-white border border-[#ebedf0] p-8 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#111827] mb-6">Store Details</h4>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Clock className="text-[#e0b090] shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Studio Hours</p>
                      <p className="mt-1 text-sm text-[#6b7280]">Monday – Friday: 10am – 7pm</p>
                      <p className="text-xs text-[#9ca3af]">Response within 24 hours guaranteed.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <MapPin className="text-[#e0b090] shrink-0" size={20} />
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Our Base</p>
                      <p className="mt-1 text-sm text-[#6b7280]">Panipat</p>
                      <p className="text-sm text-[#6b7280]">Haryana</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af] mb-4">Follow us</p>
                  <div className="flex gap-4">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <a 
                          key={social.label} 
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-[#111827] hover:text-white"
                        >
                          <Icon size={20} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="rounded-[2.5rem] bg-white border border-[#ebedf0] p-8 sm:p-10 shadow-sm"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111827]">Send a message</h2>
                <p className="mt-2 text-sm text-[#6b7280]">Fill out the form below and we'll be in touch.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={updateField('name')}
                      className="h-14 w-full rounded-2xl border border-[#ebedf0] bg-[#f9fafb] px-5 text-sm transition-all focus:border-[#e0b090] focus:bg-white focus:ring-4 focus:ring-[#e0b090]/5 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] ml-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={updateField('email')}
                      className="h-14 w-full rounded-2xl border border-[#ebedf0] bg-[#f9fafb] px-5 text-sm transition-all focus:border-[#e0b090] focus:bg-white focus:ring-4 focus:ring-[#e0b090]/5 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] ml-1">Subject</label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={updateField('subject')}
                    className="h-14 w-full rounded-2xl border border-[#ebedf0] bg-[#f9fafb] px-5 text-sm transition-all focus:border-[#e0b090] focus:bg-white focus:ring-4 focus:ring-[#e0b090]/5 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9ca3af] ml-1">Message</label>
                  <textarea
                    placeholder="Tell us more about your request..."
                    rows={5}
                    value={formData.message}
                    onChange={updateField('message')}
                    className="w-full rounded-2xl border border-[#ebedf0] bg-[#f9fafb] px-5 py-4 text-sm transition-all focus:border-[#e0b090] focus:bg-white focus:ring-4 focus:ring-[#e0b090]/5 outline-none resize-none"
                  />
                </div>

                {submitError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-red-50 p-4 text-sm text-red-600 font-medium">
                    {submitError}
                  </motion.div>
                )}
                {submitMessage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600 font-medium">
                    {submitMessage}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#111827] text-white transition-all hover:bg-[#1f2937] active:scale-95 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Send size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
