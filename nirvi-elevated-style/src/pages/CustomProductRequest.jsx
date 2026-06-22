import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  ClipboardList,
  FileText,
  Gift,
  ImagePlus,
  LockKeyhole,
  MessageSquare,
  PackageCheck,
  Palette,
  Percent,
  Ruler,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tags,
  Truck,
  UploadCloud,
  WalletCards,
  WandSparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { contactAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_REFERENCE_IMAGES = 5;
const MAX_REFERENCE_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const emptyForm = {
  productName: '',
  productCategory: '',
  collectionStyle: '',
  quantity: '',
  size: 'Standard Size',
  color: '',
  material: '',
  budget: '',
  description: '',
};

const productCategoryOptions = [
  'Cap',
  'Totebag',
  'Laptop Sleeve',
  'Pouch',
  'Shoes',
  'Other',
];

const collageProducts = [
  {
    label: 'Tote Bag',
    image: 'https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758994067-18f20fe07328-1.webp',
    heroClass: 'left-[4%] top-[7%] w-[27%] -rotate-6',
    promoClass: 'left-[4%] bottom-2 w-[34%] -rotate-6',
  },
  {
    label: 'Cap',
    image: 'https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758994039-bdc5ac1f5113-2.webp',
    heroClass: 'left-[38%] top-[2%] w-[25%] rotate-6',
    promoClass: 'left-[24%] bottom-[66px] w-[27%] rotate-3',
  },
  {
    label: 'Laptop Sleeve',
    image: 'https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993954-28b9451f558f-5.webp',
    heroClass: 'right-[4%] top-[10%] w-[28%] rotate-7',
    promoClass: 'right-[2%] bottom-[54px] w-[34%] rotate-6',
  },
  {
    label: 'Key Charm',
    image: 'https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993840-1c94af79900d-8.webp',
    heroClass: 'left-[24%] bottom-[6%] w-[25%] rotate-3',
    promoClass: 'left-[43%] bottom-1 w-[27%] rotate-2',
  },
  {
    label: 'Flex',
    image: 'https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/product-1777758993981-4060f07f2750-4.webp',
    heroClass: 'right-[22%] bottom-[4%] w-[27%] -rotate-5',
    promoClass: 'right-[18%] bottom-2 w-[30%] -rotate-4',
  },
];

const promoProducts = [
  {
    label: 'Tote Bag',
    image: collageProducts[0].image,
    promoClass: 'left-[3%] bottom-0 w-[31%] -rotate-6',
  },
  {
    label: 'Cap',
    image: collageProducts[1].image,
    promoClass: 'left-[27%] bottom-[34px] w-[25%] rotate-3',
  },
  {
    label: 'Laptop Sleeve',
    image: collageProducts[2].image,
    promoClass: 'right-[3%] bottom-[28px] w-[31%] rotate-6',
  },
  {
    label: 'Flex',
    image: collageProducts[4].image,
    promoClass: 'right-[21%] bottom-0 w-[28%] -rotate-4',
  },
];

const collectionStyleOptions = [
  'Anime Theme',
  'Cartoon Theme',
  'Festive Theme',
  'Couple Theme',
  'Custom Artwork',
  'Other',
];

const colorOptions = ['Black', 'White', 'Blue', 'Pink', 'Brown', 'Other'];
const materialOptions = ['Denim', 'Leather', 'Cotton', 'Metal', 'Threads', 'Other'];
const budgetOptions = ['Under ₹500', '₹500–₹1000', '₹1000–₹2500', '₹2500+'];
const sizeOptions = ['Standard Size'];

const featureBadges = [
  {
    icon: Percent,
    title: '100% Customizable',
    subtitle: 'Tailored to your style',
    className: 'bg-[#fff1f4] text-[#ff3b6b]',
  },
  {
    icon: ShieldCheck,
    title: 'Premium Quality',
    subtitle: 'Made with perfection',
    className: 'bg-[#fff1f4] text-[#ff3b6b]',
  },
  {
    icon: LockKeyhole,
    title: 'Secure & Private',
    subtitle: 'Your ideas are safe with us',
    className: 'bg-[#fff1f4] text-[#ff3b6b]',
  },
  {
    icon: Truck,
    title: 'On-time Delivery',
    subtitle: 'Delivered as per timeline',
    className: 'bg-[#fff1f4] text-[#ff3b6b]',
  },
];

const howItWorks = [
  {
    icon: ClipboardList,
    title: 'Submit Request',
    text: 'Fill in the details and upload reference images.',
  },
  {
    icon: Tags,
    title: 'Get Quotation',
    text: "We'll send you the best possible quote.",
  },
  {
    icon: WandSparkles,
    title: 'Confirm & Create',
    text: 'Once confirmed, we start creating your product.',
  },
  {
    icon: Gift,
    title: 'Deliver to You',
    text: 'Your custom product will be delivered to your doorstep.',
  },
];

const trustBadges = [
  {
    icon: Percent,
    title: '100% Customizable',
    subtitle: 'Tailored to your needs',
    className: 'bg-orange-50 text-orange-500',
  },
  {
    icon: ShieldCheck,
    title: 'Premium Quality',
    subtitle: 'Made with perfection',
    className: 'bg-[#fff1f4] text-[#ff3b6b]',
  },
  {
    icon: LockKeyhole,
    title: 'Secure & Private',
    subtitle: 'Your ideas are safe with us',
    className: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Truck,
    title: 'On-time Delivery',
    subtitle: 'Delivered as per timeline',
    className: 'bg-amber-50 text-amber-500',
  },
];

const inputClass =
  'h-[52px] w-full rounded-xl border border-[#d9dee7] bg-white px-4 text-[13px] font-medium text-[#111827] outline-none transition-all placeholder:text-[#7a8495] focus:border-[#ff3b6b] focus:ring-4 focus:ring-[#ff3b6b]/10';

const selectTriggerClass =
  'h-[52px] rounded-xl border-[#d9dee7] bg-white px-4 text-[13px] font-medium text-[#111827] shadow-none outline-none transition-all focus:border-[#ff3b6b] focus:ring-4 focus:ring-[#ff3b6b]/10 data-[placeholder]:text-[#7a8495]';

const FieldShell = ({ icon: Icon, index, label, required = true, helper, className, children }) => (
  <div className={cn('space-y-2', className)}>
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fff1f4] text-[#ff3b6b]">
        <Icon size={15} strokeWidth={2} />
      </span>
      <label className="text-[13px] font-extrabold text-[#111827]">
        {index}. {label}
        {required ? <span className="ml-1 text-[#ff3b6b]">*</span> : null}
      </label>
    </div>
    <div className="sm:pl-10">
      {children}
      {helper ? <p className="mt-2 text-[11px] font-medium leading-5 text-[#6b7280]">{helper}</p> : null}
    </div>
  </div>
);

const CustomSelect = ({ value, onValueChange, placeholder, options }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={selectTriggerClass}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      position="popper"
      className="z-[70] rounded-xl border-[#f1c7d2] bg-white p-1 shadow-[0_18px_45px_rgba(17,24,39,0.12)]"
    >
      <SelectGroup>
        {options.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className="cursor-pointer rounded-lg py-2.5 pl-8 pr-3 text-[13px] font-semibold text-[#111827] focus:bg-[#fff1f4] focus:text-[#ff3b6b]"
          >
            {option}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
);

const FeatureBadge = ({ item }) => {
  const Icon = item.icon;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', item.className)}>
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-[11px] font-extrabold text-[#111827]">{item.title}</span>
        <span className="mt-0.5 block text-[9px] font-medium text-[#6b7280]">{item.subtitle}</span>
      </span>
    </div>
  );
};

const SidebarCard = ({ children, className }) => (
  <div className={cn('rounded-2xl border border-[#e9edf4] bg-white p-4 shadow-[0_8px_28px_rgba(17,24,39,0.04)] sm:p-5', className)}>
    {children}
  </div>
);

const CollageImageCard = ({ item, className, sizes = '(min-width: 1024px) 180px, 38vw' }) => (
  <div
    className={cn(
      'absolute aspect-square overflow-hidden rounded-2xl border-[3px] border-white bg-[#fff7fa] shadow-[0_16px_34px_rgba(76,29,44,0.12)] transition-transform duration-500 hover:z-40 hover:scale-[1.03]',
      className,
    )}
  >
    <img
      src={item.image}
      alt={item.label}
      className="h-full w-full object-cover"
      loading="eager"
      decoding="async"
      sizes={sizes}
      draggable={false}
    />
  </div>
);

const ProductHeroCollage = () => (
  <div className="relative min-h-[280px] sm:min-h-[330px] lg:min-h-[350px]" aria-label="NIRVI custom product collage">
    <div className="absolute inset-4 rounded-[2rem] bg-[#fff1f4]/55" />
    {collageProducts.map((item) => (
      <CollageImageCard key={item.label} item={item} className={item.heroClass} />
    ))}
  </div>
);

const ProductPromoCollage = () => (
  <div className="absolute inset-x-4 bottom-4 h-[120px]">
    {promoProducts.map((item) => (
      <CollageImageCard key={item.label} item={item} className={item.promoClass} sizes="90px" />
    ))}
  </div>
);

const CustomProductRequest = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const referenceImagesRef = useRef([]);
  const [formData, setFormData] = useState(emptyForm);
  const [referenceImages, setReferenceImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  useEffect(() => () => {
    referenceImagesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const updateField = (field) => (eventOrValue) => {
    const value = typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    setFormError('');
    setFormSuccess('');
  };

  const addReferenceImages = (fileList) => {
    const incomingFiles = Array.from(fileList || []);
    if (incomingFiles.length === 0) return;

    const nextSlots = MAX_REFERENCE_IMAGES - referenceImages.length;
    if (nextSlots <= 0) {
      toast({
        variant: 'destructive',
        title: 'Image limit reached',
        description: 'You can upload up to 5 reference images.',
      });
      return;
    }

    const acceptedFiles = [];
    const rejectedFiles = [];

    incomingFiles.forEach((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type) || file.size > MAX_REFERENCE_IMAGE_SIZE) {
        rejectedFiles.push(file);
        return;
      }

      if (acceptedFiles.length < nextSlots) {
        acceptedFiles.push(file);
      }
    });

    if (rejectedFiles.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Some images were skipped',
        description: 'Use PNG, JPG, or WEBP images up to 5MB each.',
      });
    }

    if (incomingFiles.length > nextSlots) {
      toast({
        title: 'Only 5 images allowed',
        description: 'Extra images were ignored to keep the request focused.',
      });
    }

    const mappedImages = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setReferenceImages((current) => [...current, ...mappedImages]);
  };

  const removeReferenceImage = (id) => {
    setReferenceImages((current) => {
      const imageToRemove = current.find((item) => item.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const resetForm = () => {
    referenceImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setReferenceImages([]);
    setFormData(emptyForm);
  };

  const validateForm = () => {
    const requiredFields = [
      ['Product Name', formData.productName],
      ['Product Category', formData.productCategory],
      ['Collection Style', formData.collectionStyle],
      ['Quantity', formData.quantity],
      ['Size', formData.size],
      ['Color', formData.color],
      ['Material', formData.material],
      ['Budget', formData.budget],
      ['Description', formData.description],
    ];

    const missingField = requiredFields.find(([, value]) => !String(value || '').trim());
    if (missingField) {
      return `Please fill ${missingField[0]}.`;
    }

    if (Number(formData.quantity) < 1) {
      return 'Quantity should be at least 1.';
    }

    if (referenceImages.length === 0) {
      return 'Please upload at least one reference image.';
    }

    return '';
  };

  const buildRequestMessage = () => {
    const referenceImageNames = referenceImages.map((item) => item.file.name).join(', ') || 'None';

    return [
      'Custom Product Request',
      `Product Name: ${formData.productName}`,
      `Product Category: ${formData.productCategory}`,
      `Collection Style: ${formData.collectionStyle}`,
      `Quantity: ${formData.quantity}`,
      `Size: ${formData.size}`,
      `Color: ${formData.color}`,
      `Material: ${formData.material}`,
      `Budget: ${formData.budget}`,
      `Reference Image Files: ${referenceImageNames}`,
      '',
      'Description:',
      formData.description,
    ].join('\n');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        name: user?.name || 'Custom Product Request',
        email: user?.email || 'custom-request@nirvi.local',
        subject: `Custom Product Request - ${formData.productName}`,
        message: buildRequestMessage(),
      };

      await contactAPI.createMessage(payload);
      setFormSuccess('Your request has been submitted. Our team will review it within 24-48 hours.');
      toast({
        title: 'Request submitted',
        description: 'Our team will review your custom product idea shortly.',
      });
      resetForm();
    } catch (error) {
      setFormError(error.data?.message || error.message || 'Unable to submit your request right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addReferenceImages(event.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />

      <main className="pt-[96px] md:pt-[104px]">
        <section className="w-full bg-black overflow-hidden">
          <img src="https://nirvi-images-2026.s3.ap-south-1.amazonaws.com/products/custom1.png" alt="Custom Product Request" className="w-full h-auto object-cover" />
        </section>

        <section className="px-5 py-5 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-2xl border border-[#e9edf4] bg-white p-5 shadow-[0_8px_28px_rgba(17,24,39,0.04)] sm:p-6"
            >
              <div className="mb-6">
                <h2 className="font-display text-2xl font-extrabold text-[#111827]">Tell us about your custom product</h2>
                <p className="mt-2 text-[13px] font-medium leading-6 text-[#5b6474]">
                  Fill in the details below and our team will get back to you with the best solutions.
                </p>
              </div>

              <div className="space-y-6">
                <FieldShell icon={ShoppingBag} index="1" label="Product Name">
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={updateField('productName')}
                    placeholder="Enter a name for your custom product"
                    className={inputClass}
                  />
                  <p className="mt-2 text-[11px] font-medium text-[#6b7280]">Example: Anime Spider Laptop Sleeve</p>
                </FieldShell>

                <FieldShell icon={Tags} index="2" label="Product Category">
                  <CustomSelect
                    value={formData.productCategory}
                    onValueChange={updateField('productCategory')}
                    placeholder="Select a product category"
                    options={productCategoryOptions}
                  />
                </FieldShell>

                <FieldShell icon={Palette} index="3" label="Collection Style">
                  <CustomSelect
                    value={formData.collectionStyle}
                    onValueChange={updateField('collectionStyle')}
                    placeholder="Select collection style"
                    options={collectionStyleOptions}
                  />
                </FieldShell>

                <div className="grid gap-6 md:grid-cols-2">
                  <FieldShell
                    icon={PackageCheck}
                    index="4"
                    label="Quantity"
                    helper="Minimum order quantity may vary by product"
                  >
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={formData.quantity}
                      onChange={updateField('quantity')}
                      placeholder="Enter quantity"
                      className={inputClass}
                    />
                  </FieldShell>

                  <FieldShell
                    icon={Ruler}
                    index="5"
                    label="Size"
                    helper="Standard size is selected for this request"
                  >
                    <CustomSelect
                      value={formData.size}
                      onValueChange={updateField('size')}
                      placeholder="Select size"
                      options={sizeOptions}
                    />
                  </FieldShell>
                </div>

                <FieldShell icon={Palette} index="6" label="Color">
                  <CustomSelect
                    value={formData.color}
                    onValueChange={updateField('color')}
                    placeholder="Select a color"
                    options={colorOptions}
                  />
                </FieldShell>

                <FieldShell icon={Box} index="7" label="Material">
                  <CustomSelect
                    value={formData.material}
                    onValueChange={updateField('material')}
                    placeholder="Select material"
                    options={materialOptions}
                  />
                </FieldShell>

                <FieldShell icon={WalletCards} index="8" label="Budget">
                  <CustomSelect
                    value={formData.budget}
                    onValueChange={updateField('budget')}
                    placeholder="Select your budget"
                    options={budgetOptions}
                  />
                </FieldShell>

                <FieldShell icon={FileText} index="9" label="Description">
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={updateField('description')}
                      maxLength={500}
                      rows={5}
                      placeholder="Tell us about your design, artwork placement, theme, colors, font style, and any special instructions."
                      className="min-h-[132px] w-full resize-none rounded-xl border border-[#d9dee7] bg-white px-4 py-4 text-[13px] font-medium leading-6 text-[#111827] outline-none transition-all placeholder:text-[#7a8495] focus:border-[#ff3b6b] focus:ring-4 focus:ring-[#ff3b6b]/10"
                    />
                    <span className="absolute bottom-3 right-4 text-[11px] font-semibold text-[#6b7280]">
                      {formData.description.length}/500
                    </span>
                  </div>
                </FieldShell>

                <FieldShell
                  icon={ImagePlus}
                  index="10"
                  label="Upload Reference Images"
                  helper="Upload images that help us understand your idea better"
                >
                  <div className="flex flex-wrap items-stretch gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        'flex min-h-[120px] w-full max-w-[300px] flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition-all sm:w-[300px]',
                        isDragging
                          ? 'border-[#ff3b6b] bg-[#fff1f4]'
                          : 'border-[#ff8cab] bg-[#fff7fa] hover:border-[#ff3b6b] hover:bg-[#fff1f4]',
                      )}
                    >
                      <UploadCloud size={34} className="text-[#ff3b6b]" strokeWidth={1.8} />
                      <span className="mt-3 text-[12px] font-semibold text-[#4b5563]">Click to upload or drag and drop</span>
                      <span className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#6b7280]">
                        PNG, JPG, WEBP up to 5MB (Max 5 images)
                      </span>
                    </button>

                    {referenceImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative h-[120px] w-[86px] overflow-hidden rounded-xl border border-[#ffd6df] bg-[#fff1f4] shadow-sm"
                      >
                        <img src={image.previewUrl} alt="Reference preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(image.id)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#111827] shadow-sm transition-colors hover:text-[#ff3b6b]"
                          aria-label="Remove reference image"
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    ))}

                    {referenceImages.length > 0 && referenceImages.length < MAX_REFERENCE_IMAGES ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-[120px] w-[86px] flex-col items-center justify-center rounded-xl border border-dashed border-[#9aa4b5] bg-white text-[#111827] transition-all hover:border-[#ff3b6b] hover:text-[#ff3b6b]"
                      >
                        <ImagePlus size={22} strokeWidth={1.8} />
                        <span className="mt-2 text-[10px] font-bold">Add More</span>
                      </button>
                    ) : null}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      hidden
                      onChange={(event) => {
                        addReferenceImages(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </div>
                </FieldShell>
              </div>

              <div className="mt-8 space-y-4">
                {formError ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">
                    {formError}
                  </div>
                ) : null}
                {formSuccess ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
                    {formSuccess}
                  </div>
                ) : null}

                <p className="text-[12px] font-medium text-[#6b7280]">
                  <span className="text-[#ff3b6b]">*</span> Required fields
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-lg bg-[#ff3b6b] px-7 text-[12px] font-extrabold uppercase tracking-wide text-white shadow-[0_14px_28px_rgba(255,59,107,0.24)] transition-all hover:bg-[#f7255b] hover:shadow-[0_18px_34px_rgba(255,59,107,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    <Send size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                  <p className="text-center text-[12px] font-medium text-[#7a8495]">
                    Our team will review your request and get back to you within 24-48 hours.
                  </p>
                </div>
              </div>
            </motion.form>

            <aside className="space-y-4">
              <SidebarCard>
                <h3 className="font-display text-lg font-extrabold text-[#111827]">How it works?</h3>
                <div className="mt-5 space-y-5">
                  {howItWorks.map((step, index) => {
                    const Icon = step.icon;
                    const hasConnector = index < howItWorks.length - 1;

                    return (
                      <div key={step.title} className="relative flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f4] text-[#ff3b6b]">
                            <Icon size={22} strokeWidth={1.8} />
                          </span>
                          {hasConnector ? <span className="absolute top-[52px] h-8 border-l border-dashed border-[#ff3b6b]" /> : null}
                        </div>
                        <div className="pt-1">
                          <p className="text-[13px] font-extrabold text-[#111827]">
                            {index + 1}. {step.title}
                          </p>
                          <p className="mt-2 text-[12px] font-medium leading-6 text-[#5b6474]">{step.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SidebarCard>

              <SidebarCard className="bg-[#fff1f4]">
                <h3 className="font-display text-lg font-extrabold text-[#111827]">Need help?</h3>
                <p className="mt-2 text-[13px] font-medium leading-6 text-[#5b6474]">
                  Our support team is here to help you.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg border border-[#ff6d91] bg-white/60 text-[12px] font-extrabold uppercase tracking-wide text-[#ff3b6b] transition-all hover:bg-white hover:shadow-sm"
                >
                  Contact Support
                  <MessageSquare size={17} strokeWidth={1.8} />
                </Link>
              </SidebarCard>

              <SidebarCard className="relative min-h-[265px] overflow-hidden bg-[#fff1f4]">
                <div className="relative z-10 max-w-[170px]">
                  <h3 className="font-display text-xl font-extrabold leading-tight text-[#111827]">
                    Your idea,
                    <br />
                    Our creation!
                  </h3>
                  <p className="mt-3 text-[12px] font-semibold leading-5 text-[#4b5563]">
                    Let's make something extraordinary together.
                  </p>
                </div>
                <Sparkles className="absolute right-8 top-8 text-[#ffadc0]" size={34} strokeWidth={1.5} />
                <ProductPromoCollage />
              </SidebarCard>

              <SidebarCard>
                <div className="space-y-4">
                  {trustBadges.map((badge) => {
                    const Icon = badge.icon;
                    return (
                      <div key={badge.title} className="flex items-center gap-4">
                        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', badge.className)}>
                          <Icon size={20} strokeWidth={1.9} />
                        </span>
                        <span>
                          <span className="block text-[13px] font-extrabold text-[#111827]">{badge.title}</span>
                          <span className="mt-1 block text-[11px] font-medium text-[#6b7280]">{badge.subtitle}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SidebarCard>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CustomProductRequest;
