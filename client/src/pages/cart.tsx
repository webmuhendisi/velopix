import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, Truck, Lock, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";
import { useExchangeRate } from "@/hooks/useExchangeRate";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { usdToTry } = useExchangeRate();

  const subtotal = getTotalPrice();
  const shipping = subtotal > 50 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold font-heading mb-8">Alışveriş Sepeti</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Sepetiniz boş</p>
                <Link href="/products">
                  <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">Alışverişe Devam Et</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border border-border rounded-lg p-4 flex gap-4 hover:shadow-lg transition-all"
                  >
                    {item.type === "product" && item.product ? (
                      <>
                        <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                          <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-2">{item.product.title}</h3>
                          <div className="flex flex-col">
                            <p className="text-primary font-bold text-lg">
                              ${typeof item.product.price === 'string' ? parseFloat(item.product.price).toFixed(2) : item.product.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ≈ {usdToTry(item.product.price).toFixed(2)} ₺
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="flex items-center border border-border rounded-lg">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-secondary"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-secondary"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : item.type === "internet" && item.internetPackage ? (
                      <>
                        <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center">
                          <Wifi className="w-12 h-12 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold mb-2">{item.internetPackage.name}</h3>
                          <p className="text-sm text-muted-foreground mb-1">{item.internetPackage.provider}</p>
                          <p className="text-sm text-muted-foreground mb-1">{item.internetPackage.speed} Mbps</p>
                          <p className="text-primary font-bold text-lg">
                            ${(typeof item.internetPackage.price === 'string' ? parseFloat(item.internetPackage.price) : item.internetPackage.price).toFixed(2)}/ay
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="flex items-center border border-border rounded-lg">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-secondary"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-secondary"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-secondary rounded-2xl p-6 h-fit sticky top-20"
          >
            <h2 className="text-xl font-bold mb-4">Sipariş Özeti</h2>
            
            <div className="space-y-3 mb-6 pb-6 border-b border-border">
              <div className="flex justify-between text-sm">
                <span>Ara Toplam</span>
                <div className="flex flex-col items-end">
                  <span>${subtotal.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">≈ {usdToTry(subtotal).toFixed(2)} ₺</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Kargo
                </span>
                <span>{shipping === 0 ? "Ücretsiz" : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="flex justify-between mb-6 font-bold text-lg">
              <span>Toplam</span>
              <div className="flex flex-col items-end">
                <span className="text-primary">${total.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground font-normal">≈ {usdToTry(total).toFixed(2)} ₺</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold mb-3">
                Ödemeye Geç
              </Button>
            </Link>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-4 h-4" />
              Güvenli ödeme
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
