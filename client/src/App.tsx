import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import PageViewTracker from "@/components/PageViewTracker";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import Categories from "@/pages/categories";
import ProductDetail from "@/pages/product-detail";
import Repair from "@/pages/repair";
import RepairNew from "@/pages/repair/new";
import RepairTrack from "@/pages/repair/track";
import Search from "@/pages/search";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Blog from "@/pages/blog/index";
import BlogPostDetail from "@/pages/blog/[slug]";
import Login from "@/pages/login";
import Register from "@/pages/register";
import OrderTrack from "@/pages/orders/track";
import Wishlist from "@/pages/wishlist";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminProductNew from "@/pages/admin/products/new";
import AdminProductEdit from "@/pages/admin/products/[id]/edit";
import AdminCategories from "@/pages/admin/categories";
import AdminCategoryNew from "@/pages/admin/categories/new";
import AdminCategoryEdit from "@/pages/admin/categories/[id]/edit";
import AdminSlides from "@/pages/admin/slides";
import AdminInternetPackages from "@/pages/admin/internet-packages";
import AdminInternetPackageNew from "@/pages/admin/internet-packages/new";
import AdminInternetPackageEdit from "@/pages/admin/internet-packages/[id]/edit";
import AdminRepairServices from "@/pages/admin/repair-services";
import AdminRepairServiceNew from "@/pages/admin/repair-services/new";
import AdminRepairServiceEdit from "@/pages/admin/repair-services/[id]/edit";
import AdminRepairRequests from "@/pages/admin/repair-requests";
import AdminRepairRequestNew from "@/pages/admin/repair-requests/new";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomerDetail from "@/pages/admin/customers/[phone]";
import AdminOrders from "@/pages/admin/orders";
import AdminContact from "@/pages/admin/contact";
import AdminSettings from "@/pages/admin/settings";
import AdminBlogList from "@/pages/admin/blog/index";
import AdminBlogNew from "@/pages/admin/blog/new";
import AdminBlogEdit from "@/pages/admin/blog/[id]/edit";
import AdminShippingRegions from "@/pages/admin/shipping-regions";
import AdminCampaigns from "@/pages/admin/campaigns";
import AdminCampaignDetail from "@/pages/admin/campaigns/[id]";
import AdminNewsletter from "@/pages/admin/newsletter";
import AdminReviews from "@/pages/admin/reviews";
import FAQ from "@/pages/faq";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import AdminFAQs from "@/pages/admin/faqs";
import AdminProfile from "@/pages/admin/profile";

function Router() {
  return (
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
