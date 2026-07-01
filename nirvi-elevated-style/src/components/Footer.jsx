import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const customerLinks = [
  { to: '/contact', label: 'Contact and Support' },
  { to: '/shipping-returns', label: 'Shipping, Returns and Care' },
];

const companyLinks = [
  { to: '/about', label: 'Our Story' },
  { to: '/privacy-policy', label: 'Privacy and Data Policy' },
];

const categoryLinks = [
  { to: '/shop?cat=dresses', label: 'Dresses' },
  { to: '/shop?cat=tops', label: 'Tops' },
  { to: '/shop?cat=skirts', label: 'Skirts' },
];

const Footer = () => {
  return (
    <footer className="bg-[#1B2430] text-white border-t border-white/10">
      <div className="w-full px-5 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-display text-2xl font-bold text-white mb-4">VRISBYVRITI</h3>
            <p className="text-sm text-[#e5e5e5] leading-relaxed font-body">
              At VrisbyVriti we create timeless statement pieces designed to make you feel confident, effortless, and uniquely you. With a focus on quality, versatility, and thoughtful craftsmanship, many of our designs can be customized to suit your personal style.
            </p>

            <div className="mt-5 space-y-2 text-sm text-[#e5e5e5] font-body">
              <p className="inline-flex items-center gap-2">
                <Phone size={16} />
                +91 86071 87086
              </p>
              <p className="inline-flex items-center gap-2">
                <Mail size={16} />
                Vrisbyvriti5@gmail.com
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin size={16} />
                Panipat, Haryana
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm text-[#e5e5e5] font-body">
              {customerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-[#e5e5e5] font-body">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-[#e5e5e5] font-body">
              {categoryLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold tracking-widest text-white uppercase">VRISBYVRITI</h3>
            <p className="text-sm text-[#e5e5e5] font-body mt-1">Slow fashion essentials, designed with care and built for repeat use.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/project.vris?igsh=MWNsbmcxd2Qxanl0Mw==" target="_blank" rel="noopener noreferrer" className="text-[#e5e5e5] hover:text-white transition-colors" aria-label="Open VRIS Instagram">
              <Instagram size={20} />
            </a>
            <a href="https://www.linkedin.com/company/vris/" target="_blank" rel="noopener noreferrer" className="text-[#e5e5e5] hover:text-white transition-colors" aria-label="Open VRIS LinkedIn">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-[#e5e5e5] font-body">
          © {new Date().getFullYear()} VRISBYVRITI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
