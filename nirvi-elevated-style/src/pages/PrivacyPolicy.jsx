import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
              Privacy and Data Policy
            </h1>
            <p className="mt-4 text-[11px] text-gray-400 uppercase tracking-widest">
              VRISBYVRITI • Effective Date: August 04, 2024
            </p>
          </div>

          {/* Legal Text */}
          <div className="space-y-10 text-[14px] leading-[1.8] text-[#4a4a4a]">

            <p>
              VRISBYVRITI (“we”, “us” or “our”) manages and operates the website VRISBYVRITI along with its corresponding mobile and tablet applications (collectively referred to as “the Platform”). Through the Platform, we offer a diverse range of lifestyle and fashion products, listed from time-to-time (“Products”) to users of VRISBYVRITI (“User” or “Users” or “you” or “your”). We are deeply committed to protecting your personal data and ensuring that your privacy is respected at every stage of your interaction with our Platform.
            </p>

            <p>
              This Privacy and Data Policy (“Policy”) explains how we collect, use, disclose, and safeguard your information when you visit our Platform. Please read this Policy carefully. If you do not agree with the terms of this privacy policy, please do not access the Platform. By continuing to use VRISBYVRITI, you signify your acceptance of the practices described in this document.
            </p>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">1. Applicability and Scope</h2>
              <p>
                1.1. This Policy applies to all Users who access the Platform, regardless of whether they are registered members or guest visitors. It covers all personal information collected through our website, mobile applications, and any related services, sales, marketing, or events.
              </p>
              <p className="mt-4">
                1.2. VRISBYVRITI reserves the unilateral right to modify, add, or remove portions of this Policy at any time without prior individual notice. Any changes will be effective immediately upon posting to the Platform. It is your responsibility to review this Policy periodically to stay informed of updates. Your continued use of the Platform following the posting of changes will mean that you accept and agree to the revisions.
              </p>
              <p className="mt-4">
                1.3. This Policy is incorporated into and subject to our Terms and Conditions. It governs the processing of any data provided by you or collected by us in the course of providing our fashion retail services.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">2. Comprehensive Information Collection</h2>
              <p>
                2.1. **Voluntary Personal Information:** We collect information that you voluntarily provide to us when you register on the Platform, express an interest in obtaining information about us or our products, or otherwise contact us. This includes, but is not limited to: your full legal name, primary and secondary email addresses, mobile and landline telephone numbers, billing and shipping addresses, and date of birth for age verification purposes.
              </p>
              <p className="mt-4">
                2.2. **Automatic Technical Information:** Our servers automatically collect certain information when you access or use our Platform. This data includes your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and information about how and when you use our Platform. This information is primarily needed to maintain the security and operation of our Platform, and for our internal analytics and reporting purposes.
              </p>
              <p className="mt-4">
                2.3. **Transactional and Payment Data:** If you purchase products from VRISBYVRITI, we collect data necessary to process your payment, such as your payment instrument number (credit/debit card numbers), CVV, and expiration dates. However, all payment data is stored and processed by our third-party payment processors (e.g., Razorpay, Stripe), and you should review their privacy policies and contact them directly to respond to your questions.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">3. Strategic Use of Information</h2>
              <p>
                3.1. **Fulfillment of Services:** We use the information we collect primarily to facilitate account creation and logon processes, and to fulfill and manage your orders, payments, returns, and exchanges made through the Platform.
              </p>
              <p className="mt-4">
                3.2. **Communication and Marketing:** With your explicit consent, we may use your personal information to send you marketing and promotional communications. We may also send you administrative information, such as product announcements and updates to our terms, conditions, and policies. You can opt-out of our marketing emails at any time.
              </p>
              <p className="mt-4">
                3.3. **Business Operations and Analytics:** We use information to protect our services, including fraud monitoring and prevention. We also use data to evaluate and improve our products, services, marketing, and your overall experience through data analysis, identifying usage trends, and determining the effectiveness of our promotional campaigns.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">4. Data Sharing and Third-Party Disclosure</h2>
              <p>
                4.1. **Third-Party Service Providers:** We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing, data analysis, email delivery, hosting services, customer service, and marketing efforts.
              </p>
              <p className="mt-4">
                4.2. **Legal Obligations:** We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process, such as in response to a court order or a subpoena.
              </p>
              <p className="mt-4">
                4.3. **Business Transfers:** We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">5. Your Rights and Data Control</h2>
              <p>
                5.1. **Account Information:** You may at any time review or change the information in your account or terminate your account by logging into your account settings and updating your profile. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, and/or comply with legal requirements.
              </p>
              <p className="mt-4">
                5.2. **Cookies and Similar Technologies:** Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Platform.
              </p>
              <p className="mt-4">
                5.3. **Email Marketing:** You can unsubscribe from our marketing email list at any time by clicking on the unsubscribe link in the emails that we send or by contacting us using the details provided below. You will then be removed from the marketing email list — however, we will still need to send you service-related emails that are necessary for the administration and use of your account.
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">6. Data Retention and Security</h2>
              <p>
                6.1. **Security Measures:** We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Platform is at your own risk.
              </p>
              <p className="mt-4">
                6.2. **Retention Period:** We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
              </p>
            </div>

            <div>
              <h2 className="text-[15px] font-bold text-black mb-5 uppercase tracking-widest">7. Contact and Support</h2>
              <p>
                7.1. If you have questions or comments about this policy, you may contact our Grievance Officer at project.vris@gmail.com or by post to:
              </p>
              <p className="mt-4 font-bold text-black">
                VRISBYVRITI
              </p>
              <p className="text-gray-600">
                Bennett University, Plot Nos 8-11, TechZone II,<br />
                Greater Noida, Uttar Pradesh 201310<br />
                Phone: +91 96713 00024
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

export default PrivacyPolicy;
