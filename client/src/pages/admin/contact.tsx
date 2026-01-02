import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Mail, Phone, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  mapEmbed: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminContact() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ContactSettings>({
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    mapEmbed: "",
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchData();
    fetchMessages();
  }, [token, setLocation]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/contact-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const settings = await res.json();
      
      // Map settings to form data
      const settingsMap: Record<string, string> = {};
      settings.forEach((setting: { key: string; value: string }) => {
        settingsMap[setting.key] = setting.value || "";
      });

      setFormData({
        phone: settingsMap.contact_phone || "",
        email: settingsMap.contact_email || "",
        address: settingsMap.contact_address || "",
        workingHours: settingsMap.contact_working_hours || "",
        mapEmbed: settingsMap.contact_map_embed || "",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ayarlar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = [
        { key: "contact_phone", value: formData.phone, type: "text" },
        { key: "contact_email", value: formData.email, type: "text" },
        { key: "contact_address", value: formData.address, type: "text" },
        { key: "contact_working_hours", value: formData.workingHours, type: "text" },
        { key: "contact_map_embed", value: formData.mapEmbed, type: "text" },
      ];

      await Promise.all(
        settings.map((setting) =>
          fetch(`/api/admin/settings/${setting.key}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ value: setting.value, type: setting.type }),
          })
        )
      );

      toast({ title: "Başarılı", description: "İletişim bilgileri güncellendi" });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Güncelleme başarısız",
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
            <h1 className="text-3xl font-bold">İletişim Bilgileri</h1>
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
          <h1 className="text-3xl font-bold">İletişim Bilgileri</h1>
          <p className="text-muted-foreground">İletişim bilgilerini düzenleyin</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>İletişim Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+90 533 833 21 11"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="info@velopixcomputer.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Adres *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  rows={3}
                  placeholder="VeloPix Computer Mağazası, Merkez Sok. No:123, İstanbul"
                />
              </div>
              <div>
                <Label htmlFor="workingHours">Çalışma Saatleri</Label>
                <Textarea
                  id="workingHours"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  rows={4}
                  placeholder="Pazartesi - Cuma: 09:00 - 18:00&#10;Cumartesi - Pazar: 10:00 - 17:00"
                />
              </div>
              <div>
                <Label htmlFor="mapEmbed">Harita Embed Kodu (Google Maps iframe)</Label>
                <Textarea
                  id="mapEmbed"
                  value={formData.mapEmbed}
                  onChange={(e) => setFormData({ ...formData, mapEmbed: e.target.value })}
                  rows={6}
                  placeholder='<iframe src="https://www.google.com/maps/embed?..." width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Google Maps'ten "Haritayı paylaş" → "HTML'ye yerleştir" seçeneğinden alınan iframe kodunu yapıştırın
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Contact Messages */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim Mesajları ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Henüz mesaj bulunmuyor</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gönderen</TableHead>
                      <TableHead>Konu</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{msg.name}</p>
                            {msg.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {msg.email}
                              </p>
                            )}
                            {msg.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {msg.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{msg.subject || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              msg.status === "new"
                                ? "default"
                                : msg.status === "read"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {msg.status === "new" && "Yeni"}
                            {msg.status === "read" && "Okundu"}
                            {msg.status === "replied" && "Yanıtlandı"}
                            {msg.status === "archived" && "Arşivlendi"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(msg.createdAt).toLocaleString("tr-TR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMessage(msg);
                                setIsMessageDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Görüntüle
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Detail Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mesaj Detayı</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <Label>Gönderen</Label>
                  <p className="font-medium">{selectedMessage.name}</p>
                  {selectedMessage.email && (
                    <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                  )}
                  {selectedMessage.phone && (
                    <p className="text-sm text-muted-foreground">{selectedMessage.phone}</p>
                  )}
                </div>
                {selectedMessage.subject && (
                  <div>
                    <Label>Konu</Label>
                    <p>{selectedMessage.subject}</p>
                  </div>
                )}
                <div>
                  <Label>Mesaj</Label>
                  <p className="whitespace-pre-line text-muted-foreground">{selectedMessage.message}</p>
                </div>
                <div>
                  <Label>Durum</Label>
                  <Select
                    value={selectedMessage.status}
                    onValueChange={async (value) => {
                      try {
                        await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: value }),
                        });
                        toast({ title: "Başarılı", description: "Durum güncellendi" });
                        fetchMessages();
                        setSelectedMessage({ ...selectedMessage, status: value });
                      } catch (error) {
                        toast({
                          title: "Hata",
                          description: "Durum güncellenemedi",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yeni</SelectItem>
                      <SelectItem value="read">Okundu</SelectItem>
                      <SelectItem value="replied">Yanıtlandı</SelectItem>
                      <SelectItem value="archived">Arşivlendi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                    Kapat
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

