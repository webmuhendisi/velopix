import { ReactNode, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Folder,
  ShoppingCart,
  Wifi,
  Wrench,
  Image,
  Phone,
  Settings,
  LogOut,
  FileText,
  ClipboardList,
  Users,
  Truck,
  Sparkles,
  Mail,
  MessageCircle,
  HelpCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Ürünler",
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Kategoriler",
    icon: Folder,
    href: "/admin/categories",
  },
  {
    title: "Kampanyalar",
    icon: Sparkles,
    href: "/admin/campaigns",
  },
  {
    title: "Siparişler",
    icon: ShoppingCart,
    href: "/admin/orders",
  },
  {
    title: "Kargo Bölgeleri",
    icon: Truck,
    href: "/admin/shipping-regions",
  },
  {
    title: "Internet Paketleri",
    icon: Wifi,
    href: "/admin/internet-packages",
  },
  {
    title: "Tamir Servisleri",
    icon: Wrench,
    href: "/admin/repair-services",
  },
  {
    title: "Tamir Kayıtları",
    icon: ClipboardList,
    href: "/admin/repair-requests",
  },
  {
    title: "Müşteriler",
    icon: Users,
    href: "/admin/customers",
  },
  {
    title: "Slider Yönetimi",
    icon: Image,
    href: "/admin/slides",
  },
  {
    title: "İletişim Bilgileri",
    icon: Phone,
    href: "/admin/contact",
  },
  {
    title: "Site Ayarları",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    title: "Blog",
    icon: FileText,
    href: "/admin/blog",
  },
  {
    title: "E-Bülten",
    icon: Mail,
    href: "/admin/newsletter",
  },
  {
    title: "Ürün Yorumları",
    icon: MessageCircle,
    href: "/admin/reviews",
  },
  {
    title: "SSS Yönetimi",
    icon: HelpCircle,
    href: "/admin/faqs",
  },
  {
    title: "Profil",
    icon: User,
    href: "/admin/profile",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setLocation("/admin/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">VeloPix Admin</h2>
                <p className="text-xs text-muted-foreground">Yönetim Paneli</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menü</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Çıkış Yap</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {localStorage.getItem("adminUser")
                  ? JSON.parse(localStorage.getItem("adminUser") || "{}").username
                  : "Admin"}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

