import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, InternetPackage } from "@/lib/data";

export interface CartItem {
  id: string;
  product?: Product;
  internetPackage?: InternetPackage;
  quantity: number;
  type: "product" | "internet";
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addInternetPackageToCart: (internetPackage: InternetPackage, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "velopix_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.type === "product" && item.product?.id === product.id
      );
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.type === "product" && item.product?.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { 
        id: `product-${product.id}-${Date.now()}`, 
        product, 
        quantity,
        type: "product" as const
      }];
    });
  };

  const addInternetPackageToCart = (internetPackage: InternetPackage, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.type === "internet" && item.internetPackage?.id === internetPackage.id
      );
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.type === "internet" && item.internetPackage?.id === internetPackage.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { 
        id: `internet-${internetPackage.id}-${Date.now()}`, 
        internetPackage, 
        quantity,
        type: "internet" as const
      }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      if (item.type === "product" && item.product) {
        const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
        return total + price * item.quantity;
      } else if (item.type === "internet" && item.internetPackage) {
        const price = typeof item.internetPackage.price === 'string' ? parseFloat(item.internetPackage.price) : item.internetPackage.price;
        return total + price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        addInternetPackageToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

