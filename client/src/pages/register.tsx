import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { User, Mail, Lock, Phone, Eye, EyeOff, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic
    console.log("Register:", formData);
  };

  const passwordStrength = formData.password.length >= 8 ? "Güçlü" : "Zayıf";

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
                Hesap Oluştur
              </h1>
              <p className="text-muted-foreground">
                Zaten bir hesabınız var mı?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Giriş Yap
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold mb-2">Ad Soyad</label>
                <div className="relative">
                  <Input
                    type="text"
                    name="name"
                    placeholder="Adınız Soyadınız"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold mb-2">E-mail Adresi</label>
                <div className="relative">
                  <Input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold mb-2">Telefon</label>
                <div className="relative">
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="+90 5XX XXX XXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10"
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold mb-2">Şifre</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                {formData.password && (
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    <Check className={`w-4 h-4 ${formData.password.length >= 8 ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className={formData.password.length >= 8 ? "text-green-600" : "text-muted-foreground"}>
                      {passwordStrength}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold mb-2">Şifre Onayı</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-1" />
                <span>
                  <a href="#" className="font-bold text-primary hover:underline">
                    Hizmet Şartlarını
                  </a>{" "}
                  ve{" "}
                  <a href="#" className="font-bold text-primary hover:underline">
                    Gizlilik Politikasını
                  </a>{" "}
                  kabul ederim
                </span>
              </label>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full font-bold mt-6"
              >
                Hesap Oluştur
              </Button>
            </form>

            {/* Social Register */}
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
                Google ile Kaydol
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
