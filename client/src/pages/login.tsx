import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
    console.log("Login:", { email, password });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-border rounded-2xl p-8 shadow-lg"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold font-heading text-foreground mb-2">
                Giriş Yap
              </h1>
              <p className="text-muted-foreground">
                Hesabınıza giriş yapın veya{" "}
                <Link href="/register" className="text-primary font-bold hover:underline">
                  yeni hesap oluşturun
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold mb-2">E-mail Adresi</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold mb-2">Şifre</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Beni Hatırla</span>
                </label>
                <Link href="#forgot" className="text-primary font-bold hover:underline">
                  Şifremi Unuttum?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold mt-6"
              >
                Giriş Yap
              </Button>
            </form>

            {/* Social Login */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">VEYA</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-full"
              >
                Google ile Giriş Yap
              </Button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Giriş yaparak{" "}
              <a href="#" className="font-bold hover:text-foreground">
                Hizmet Şartlarını
              </a>{" "}
              kabul edersiniz
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
