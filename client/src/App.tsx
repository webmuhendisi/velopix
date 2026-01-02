import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import PageViewTracker from "@/components/PageViewTracker";
import { Spinner } from "@/components/ui/spinner";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/home"));
const Products = lazy(() => import("@/pages/products"));
const Categories = lazy(() => import("@/pages/categories"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Repair = lazy(() => import("@/pages/repair"));
const RepairNew = lazy(() => import("@/pages/repair/new"));
const RepairTrack = lazy(() => import("@/pages/repair/track"));
const Search = lazy(() => import("@/pages/search"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Blog = lazy(() => import("@/pages/blog/index"));
const BlogPostDetail = lazy(() => import("@/pages/blog/[slug]"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const OrderTrack = lazy(() => import("@/pages/orders/track"));
const Wishlist = lazy(() => import("@/pages/wishlist"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminProductNew = lazy(() => import("@/pages/admin/products/new"));
const AdminProductEdit = lazy(() => import("@/pages/admin/products/[id]/edit"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminCategoryNew = lazy(() => import("@/pages/admin/categories/new"));
const AdminCategoryEdit = lazy(() => import("@/pages/admin/categories/[id]/edit"));
const AdminSlides = lazy(() => import("@/pages/admin/slides"));
const AdminInternetPackages = lazy(() => import("@/pages/admin/internet-packages"));
const AdminInternetPackageNew = lazy(() => import("@/pages/admin/internet-packages/new"));
const AdminInternetPackageEdit = lazy(() => import("@/pages/admin/internet-packages/[id]/edit"));
const AdminRepairServices = lazy(() => import("@/pages/admin/repair-services"));
const AdminRepairServiceNew = lazy(() => import("@/pages/admin/repair-services/new"));
const AdminRepairServiceEdit = lazy(() => import("@/pages/admin/repair-services/[id]/edit"));
const AdminRepairRequests = lazy(() => import("@/pages/admin/repair-requests"));
const AdminRepairRequestNew = lazy(() => import("@/pages/admin/repair-requests/new"));
const AdminCustomers = lazy(() => import("@/pages/admin/customers"));
const AdminCustomerDetail = lazy(() => import("@/pages/admin/customers/[phone]"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminContact = lazy(() => import("@/pages/admin/contact"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminBlogList = lazy(() => import("@/pages/admin/blog/index"));
const AdminBlogNew = lazy(() => import("@/pages/admin/blog/new"));
const AdminBlogEdit = lazy(() => import("@/pages/admin/blog/[id]/edit"));
const AdminShippingRegions = lazy(() => import("@/pages/admin/shipping-regions"));
const AdminCampaigns = lazy(() => import("@/pages/admin/campaigns"));
const AdminCampaignDetail = lazy(() => import("@/pages/admin/campaigns/[id]"));
const AdminNewsletter = lazy(() => import("@/pages/admin/newsletter"));
const AdminReviews = lazy(() => import("@/pages/admin/reviews"));
const FAQ = lazy(() => import("@/pages/faq"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const AdminFAQs = lazy(() => import("@/pages/admin/faqs"));
const AdminProfile = lazy(() => import("@/pages/admin/profile"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner className="w-8 h-8" />
  </div>
);

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/categories" component={Categories} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/repair" component={Repair} />
        <Route path="/repair/new" component={RepairNew} />
        <Route path="/repair/track" component={RepairTrack} />
        <Route path="/search" component={Search} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPostDetail} />
        <Route path="/orders/track" component={OrderTrack} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/faq" component={FAQ} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/products/new" component={AdminProductNew} />
        <Route path="/admin/products/:idOrSlug/edit" component={AdminProductEdit} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/categories/new" component={AdminCategoryNew} />
        <Route path="/admin/categories/:id/edit" component={AdminCategoryEdit} />
        <Route path="/admin/slides" component={AdminSlides} />
        <Route path="/admin/internet-packages" component={AdminInternetPackages} />
        <Route path="/admin/internet-packages/new" component={AdminInternetPackageNew} />
        <Route path="/admin/internet-packages/:id/edit" component={AdminInternetPackageEdit} />
        <Route path="/admin/repair-services" component={AdminRepairServices} />
        <Route path="/admin/repair-services/new" component={AdminRepairServiceNew} />
        <Route path="/admin/repair-services/:id/edit" component={AdminRepairServiceEdit} />
        <Route path="/admin/repair-requests" component={AdminRepairRequests} />
        <Route path="/admin/repair-requests/new" component={AdminRepairRequestNew} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/customers/:phone" component={AdminCustomerDetail} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/shipping-regions" component={AdminShippingRegions} />
        <Route path="/admin/contact" component={AdminContact} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/blog" component={AdminBlogList} />
        <Route path="/admin/blog/new" component={AdminBlogNew} />
        <Route path="/admin/blog/:id/edit" component={AdminBlogEdit} />
        <Route path="/admin/campaigns" component={AdminCampaigns} />
        <Route path="/admin/campaigns/:id" component={AdminCampaignDetail} />
        <Route path="/admin/newsletter" component={AdminNewsletter} />
        <Route path="/admin/reviews" component={AdminReviews} />
        <Route path="/admin/faqs" component={AdminFAQs} />
        <Route path="/admin/profile" component={AdminProfile} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <PageViewTracker />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
