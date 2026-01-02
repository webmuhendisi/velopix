import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Lock, User as UserIcon, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchProfile();
  }, [token, setLocation]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Profil bilgileri yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Hata",
        description: "Yeni şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Hata",
        description: "Şifre en az 6 karakter olmalıdır",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Şifre güncellenemedi");
      }

      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla güncellendi",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Şifre güncellenemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profil</h1>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Hesap bilgilerinizi ve şifrenizi yönetin</p>
        </div>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              <CardTitle>Hesap Bilgileri</CardTitle>
            </div>
            <CardDescription>Kullanıcı bilgileriniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input value={profile?.username || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Rol</Label>
              <Input value={profile?.role || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Hesap Oluşturulma Tarihi</Label>
              <Input 
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleString("tr-TR") : ""} 
                disabled 
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Son Güncelleme</Label>
              <Input 
                value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString("tr-TR") : ""} 
                disabled 
                className="mt-1" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <CardTitle>Şifre Değiştir</CardTitle>
            </div>
            <CardDescription>Güvenliğiniz için düzenli olarak şifrenizi değiştirin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mevcut Şifre *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Mevcut şifrenizi girin"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Yeni Şifre *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Yeni Şifre Tekrar *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Yeni şifrenizi tekrar girin"
                  required
                  minLength={6}
                />
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Güvenli bir şifre için en az 6 karakter kullanın ve harf, rakam kombinasyonu tercih edin.
                </AlertDescription>
              </Alert>
              <Button type="submit" disabled={saving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

