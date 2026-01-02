import { Laptop, Gamepad2, Smartphone, Monitor, Watch, Headphones, Wifi, Zap, RotateCcw, Wrench, HardDrive, Zap as PlaystationIcon, Monitor as DesktopIcon, Smartphone as PhoneIcon, HardDrive as HddIcon } from "lucide-react";

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  limitedStock?: number;
  originalPrice?: number;
  slug?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: any;
}

export interface RepairService {
  id: string;
  name: string;
  description: string;
  icon: any;
}

export interface InternetPackage {
  id: string;
  name: string;
  speed: number;
  price: number;
  provider: string;
  features: string[];
  highlighted?: boolean;
}

export const categories: Category[] = [
  { id: "laptop", name: "Notebook", icon: Laptop },
  { id: "gaming", name: "Gaming PC", icon: Gamepad2 },
  { id: "phone", name: "Telefon", icon: Smartphone },
  { id: "console", name: "Konsol", icon: Gamepad2 },
  { id: "monitor", name: "Monitör", icon: Monitor },
  { id: "watch", name: "Akıllı Saat", icon: Watch },
  { id: "audio", name: "Kulaklık", icon: Headphones },
  { id: "secondhand", name: "2. El Ürünler", icon: RotateCcw },
];

export const repairServices: RepairService[] = [
  { 
    id: "repair-1",
    name: "PlayStation Tamir",
    description: "PS4 ve PS5 tamir, parça değişimi",
    icon: PlaystationIcon
  },
  { 
    id: "repair-2",
    name: "PC Format",
    description: "Yazılım kurulumu, sistem temizliği",
    icon: DesktopIcon
  },
  { 
    id: "repair-3",
    name: "Telefon Tamir",
    description: "Ekran, pil, şarj değişimi",
    icon: PhoneIcon
  },
  { 
    id: "repair-4",
    name: "Bilgisayar Bakım",
    description: "Donanım tamir ve upgrade",
    icon: HardDrive
  },
  { 
    id: "repair-5",
    name: "Laptop Tamir",
    description: "Ekran, pil, soğutma tamiri",
    icon: Laptop
  },
  { 
    id: "repair-6",
    name: "İnşallah Tamir",
    description: "Tüm elektronik aletler",
    icon: Wrench
  },
];

export const products: Product[] = [
  {
    id: "1",
    title: "Lenovo V15 G2 Intel N4500",
    price: 400.00,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "2",
    title: "HP 250 G9 i5 256GB SSD",
    price: 550.00,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "3",
    title: "Gamepower Intense X20 27\"",
    price: 235.00,
    category: "monitor",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "4",
    title: "Samsung Galaxy Tab A9+",
    price: 270.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "5",
    title: "iPhone 15 Pro Max 256GB",
    price: 1410.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "6",
    title: "Xiaomi Mi14 Ultra 512GB",
    price: 1210.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "7",
    title: "Exa Trend3 i3 Laptop",
    price: 430.00,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "8",
    title: "Dell Inspiron G16 7630 RTX3050",
    price: 1300.00,
    category: "gaming",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  {
    id: "9",
    title: "Samsung S24 Ultra 256GB",
    price: 1030.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    isNew: true
  },
  // Second-hand products
  {
    id: "10",
    title: "Lenovo Ryzen 3 8GB 256GB İkinci El",
    price: 300.00,
    category: "secondhand",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "11",
    title: "ASUS VivoBook i5 8GB RAM 2. El",
    price: 380.00,
    category: "secondhand",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "12",
    title: "Apple MacBook Air M1 256GB İkinci El",
    price: 650.00,
    category: "secondhand",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    id: "13",
    title: "iPhone 13 128GB Temiz 2. El",
    price: 520.00,
    category: "secondhand",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
];

// Weekly special products with limited stock
export const weeklyProducts: Product[] = [
  {
    id: "w1",
    title: "iPhone 15 128GB Blue",
    price: 800.00,
    originalPrice: 950.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    limitedStock: 5
  },
  {
    id: "w2",
    title: "Dell G16 RTX 3050 Gaming",
    price: 1200.00,
    originalPrice: 1400.00,
    category: "gaming",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    limitedStock: 3
  },
  {
    id: "w3",
    title: "Samsung S24 Ultra",
    price: 950.00,
    originalPrice: 1150.00,
    category: "phone",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    limitedStock: 7
  },
  {
    id: "w4",
    title: "ASUS TUF 27\" Monitor",
    price: 280.00,
    originalPrice: 380.00,
    category: "monitor",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    limitedStock: 4
  },
  {
    id: "w5",
    title: "MacBook Air M1 256GB",
    price: 900.00,
    originalPrice: 1100.00,
    category: "laptop",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    limitedStock: 2
  }
];

export const internetPackages: InternetPackage[] = [
  {
    id: "inet-1",
    name: "Başlangıç Paketi",
    speed: 50,
    price: 39.99,
    provider: "Türk Telekom",
    features: [
      "50 Mbps hız",
      "Sınırsız veri",
      "24/7 destek",
      "Bedava kurulum"
    ]
  },
  {
    id: "inet-2",
    name: "Fiber Paket",
    speed: 100,
    price: 59.99,
    provider: "Vodafone",
    features: [
      "100 Mbps hız",
      "Fiber teknoloji",
      "Sınırsız veri",
      "Modem dahil",
      "24/7 destek"
    ],
    highlighted: true
  },
  {
    id: "inet-3",
    name: "Premium Paket",
    speed: 250,
    price: 79.99,
    provider: "Superonline",
    features: [
      "250 Mbps hız",
      "Gigabit hızlı",
      "Sınırsız veri",
      "Ücretsiz antivirus",
      "Öncelikli destek"
    ]
  },
  {
    id: "inet-4",
    name: "Ultra Hızlı",
    speed: 500,
    price: 99.99,
    provider: "TTNET",
    features: [
      "500 Mbps hız",
      "En hızlı bağlantı",
      "Sınırsız veri",
      "İP Telefon dahil",
      "VIP destek 24/7"
    ]
  }
];

export const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1505228395891-9a51e7e86e81?w=1400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    title: "Gaming Deneyimi",
    subtitle: "En güçlü GPU'lar ve yüksek frame rate"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    title: "Teknoloji Fuarı",
    subtitle: "Yılın en büyük indirimlerine hoşgeldiniz"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&auto=format&fit=crop&q=80&ixlib=rb-4.0.3",
    title: "iPhone 15 Pro",
    subtitle: "Yeni kamera teknolojisi ve A17 Pro çip"
  }
];
