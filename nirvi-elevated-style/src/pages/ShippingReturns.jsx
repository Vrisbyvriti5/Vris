import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const ShippingReturns = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-[#2d2d2d]">
      <Navbar />
      
      <main className="mx-auto max-w-5xl px-6 pt-32 pb-24 sm:px-12 md:px-16 lg:px-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Centered Heading */}
          <div className="text-center mb-16 border-b border-gray-100 pb-10">
            <h1 className="text-[15px] font-black uppercase tracking-[0.4em] text-black">
              Shipping, Returns and Care
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • Quality Assurance and Customer Support
            </p>
          </div>

          {/* Detailed Content */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">
            
            <p>
              VRISBYVRITI is dedicated to ensuring that your handcrafted essentials reach you in perfect condition and that your experience with our brand remains seamless from purchase to delivery. Because our products often feature delicate upcycled materials and manual finishes, we take extra care in our inspection and fulfillment processes. This policy outlines our standards for shipping, our fair approach to returns, and essential care guidance to help your pieces last a lifetime.
            </p>

            <p>
              By transacting on our Platform, you agree to the terms set forth below. We believe in honest, realistic communication, and we strive to provide clear timelines and practical solutions for every order.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">1. Shipping and Fulfillment Policy</h2>
              <p>
                1.1. **Processing Window:** Most orders at VRISBYVRITI are processed within 1 to 2 working days. This window allows us to verify product availability, conduct a final quality check, and pack the item securely to protect its shape and finish during transit. For products requiring custom finishing, we may require an additional day, and we will notify you of any such extension.
              </p>
              <p className="mt-4">
                1.2. **Delivery Timelines:** Standard delivery typically takes between 3 to 7 working days after dispatch, depending on your location and courier service availability. While we work with reliable logistics partners, please note that timelines can be affected by external factors such as weather conditions, public holidays, or service interruptions in specific zones. We prioritize realistic updates over aggressive promises.
              </p>
              <p className="mt-4">
                1.3. **Address Accuracy:** It is the User’s responsibility to provide a complete and accurate shipping address, email, and reachable phone number. Incomplete data or incorrect pin codes are the leading causes of delivery delays. If you notice an error in your shipping details, please contact us immediately; changes are generally possible before dispatch but become difficult once the parcel is with the courier.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">2. Cancellation, Return and Refund Policy</h2>
              <p>
                2.1. **Order Cancellation:** You may cancel your order at any time before it has been dispatched. Once an order is handed over to our delivery partners, it cannot be cancelled, and the standard return process must be followed upon delivery.
              </p>
              <p className="mt-4">
                2.2. **Return Eligibility:** We accept return requests within 7 days of delivery. To be eligible, the product must be unused, undamaged, and in its original packaging with all tags and product cards intact. Handcrafted items often show natural variations in texture, stitch, or material grain—these are characteristics of the artisan process and are not considered defects.
              </p>
              <p className="mt-4">
                2.3. **Return Process and Refunds:** Every return request is reviewed individually. If a return is approved due to a verified quality issue or incorrect product delivery, we will initiate a refund. Refunds are typically processed within 5 to 7 working days after the returned item is received and inspected at our studio. The final credit to your account depends on your banking partner's processing times.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">3. Product Care and Maintenance</h2>
              <p>
                3.1. **Denim and Material Care:** To maintain the structural integrity of your VRISBYVRITI product, we recommend spot cleaning with a soft, damp cloth and a mild cleaning solution. Avoid full immersion in water or harsh machine washing unless specifically noted on the product-specific care card. Denim products should be air-dried in the shade to prevent color fading.
              </p>
              <p className="mt-4">
                3.2. **Handling Handcrafted Details:** Accessories featuring wool details or delicate paint/embellishments should be handled with care. Keep them away from rough surfaces that may pull at fibers or scratch the surface finish. When not in use, store your products in a dry place away from direct sunlight and moisture.
              </p>
              <p className="mt-4">
                3.3. **Structural Use:** Our bags, sleeves, and pouches are designed for specific utility. Avoid overstuffing your products beyond their intended capacity, as this can put unnecessary stress on seams, zippers, and handles. Respecting the capacity of your piece will significantly extend its useful life and maintain its original silhouette.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">4. Support and Assistance</h2>
              <p>
                4.1. If you encounter any issues with your delivery or have questions about the care of your product, our team is ready to assist. We believe that a stronger bridge between craft and consumer is built through helpful, human support.
              </p>
              <p className="mt-4 font-bold text-black uppercase tracking-wider">
                Support Email: <a href="mailto:project.vris@gmail.com" className="underline hover:text-[#e0b090] transition-colors">project.vris@gmail.com</a>
              </p>
              <p className="mt-1 font-bold text-black uppercase tracking-wider">
                Helpline: +91 96713 00024
              </p>
            </div>

          </div>
          
          <div className="mt-20 pt-10 border-t border-gray-100 text-[12px] text-gray-400 text-center tracking-[0.2em] uppercase font-medium">
            © {new Date().getFullYear()} VRISBYVRITI. ALL RIGHTS RESERVED.
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ShippingReturns;
