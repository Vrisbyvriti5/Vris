import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { CheckoutProvider } from "@/context/CheckoutContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { FilterProvider } from "@/context/FilterContext";
import { AdminDataProvider } from "@/context/AdminDataContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import ScrollToTop from "./components/ScrollToTop";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";
import { AdminProtectedRoute, AdminPublicRoute } from "./components/admin/AdminRoute";
import VRISLoader from "./components/VRISLoader";
import AppPreloader from "./components/AppPreloader";

const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const CustomProductRequest = lazy(() => import("./pages/CustomProductRequest"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Faq = lazy(() => import("./pages/Faq"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns"));
const Sustainability = lazy(() => import("./pages/Sustainability"));
const Careers = lazy(() => import("./pages/Careers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VRISPlus = lazy(() => import("./pages/VRISPlus"));

const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductFormPage = lazy(() => import("./pages/admin/AdminProductFormPage"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUserRequests = lazy(() => import("./pages/admin/AdminUserRequests"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();
const RouteFallback = () => <VRISLoader />;

const App = () => (
  <AppPreloader>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CatalogProvider>
        <FilterProvider>
          <AdminAuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <CheckoutProvider>
                <WishlistProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <ScrollToTop />
                      <FloatingWhatsAppButton />
                      <Suspense fallback={<RouteFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/oauth-success" element={<OAuthSuccess />} />
                          <Route path="/signup" element={<Navigate to="/login?mode=signup" replace />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/custom-product-request" element={<CustomProductRequest />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/faq" element={<Faq />} />
                          <Route path="/shipping-returns" element={<ShippingReturns />} />
                          <Route path="/sustainability" element={<Sustainability />} />
                          <Route path="/careers" element={<Careers />} />
                          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                          <Route path="/vris-plus" element={<VRISPlus />} />


                          <Route
                            path="/admin/login"
                            element={(
                              <AdminPublicRoute>
                                <AdminLogin />
                              </AdminPublicRoute>
                            )}
                          />
                          <Route
                            path="/admin"
                            element={(
                              <AdminProtectedRoute>
                                <AdminLayout />
                              </AdminProtectedRoute>
                            )}
                          >
                            <Route index element={<AdminDashboard />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="products/new" element={<AdminProductFormPage />} />
                            <Route path="products/:productId/edit" element={<AdminProductFormPage />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="user-requests" element={<AdminUserRequests />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                          </Route>

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </TooltipProvider>
                </WishlistProvider>
              </CheckoutProvider>
            </CartProvider>
          </AdminDataProvider>
        </AdminAuthProvider>
        </FilterProvider>
      </CatalogProvider>
    </AuthProvider>
  </QueryClientProvider>
  </AppPreloader>
);

export default App;
