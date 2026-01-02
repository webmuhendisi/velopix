import { useEffect, useState, useRef } from "react";
import React from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";

interface RepairService {
  id: string;
  name: string;
  description: string | null;
}

export default function RepairNew() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [services, setServices] = useState<RepairService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    deviceSerialNumber: "",
    problemDescription: "",
    repairServiceId: "",
  });

  useSEO({
    title: "Tamir Talebi Oluştur - VeloPix",
    description: "Elektronik cihazlarınız için tamir talebi oluşturun. Hızlı ve güvenilir tamir hizmeti.",
  });

  useEffect(() => {
    // Get service ID from URL params
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get("service");
    if (serviceId) {
      setFormData((prev) => ({ ...prev, repairServiceId: serviceId }));
    }

    fetch("/api/repair-services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length + images.length > 5) {
      toast({
        title: "Hata",
        description: "En fazla 5 fotoğraf yükleyebilirsiniz",
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} dosyası 5MB'dan büyük`);
        }
        if (!file.type.startsWith("image/")) {
          throw new Error(`${file.name} bir resim dosyası değil`);
        }

        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/repair-requests/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`${file.name} yüklenemedi`);
        }

        const data = await res.json();
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast({
        title: "Başarılı",
        description: `${uploadedUrls.length} fotoğraf yüklendi`,
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Fotoğraflar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create repair request
      const res = await fetch("/api/repair-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: images.length > 0 ? images : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Tamir talebi oluşturulamadı");
      }

      const data = await res.json();
      setTrackingNumber(data.trackingNumber);

      setSubmitted(true);
      toast({
        title: "Başarılı",
        description: "Tamir talebiniz oluşturuldu. Takip numaranızı kaydedin!",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Tamir talebi oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <CardTitle className="text-2xl text-green-800">
                  Tamir Talebiniz Oluşturuldu!
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-6 border-2 border-green-200">
                <p className="text-sm text-muted-foreground mb-2">Takip Numaranız</p>
                <p className="text-3xl font-bold text-green-600 mb-4">{trackingNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Bu numarayı kaydedin. Tamir durumunuzu takip etmek için kullanacaksınız.
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/repair/track" className="flex-1">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Tamir Durumunu Takip Et
                  </Button>
                </Link>
                <Link href="/repair" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Ana Sayfaya Dön
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/repair">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tamir Talebi Oluştur</CardTitle>
            <p className="text-muted-foreground">
              Lütfen aşağıdaki formu doldurun. En kısa sürede size dönüş yapacağız.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customerName">Ad Soyad *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    required
                    placeholder="Adınız ve soyadınız"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefon *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    required
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">E-posta</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="repairServiceId">Tamir Servisi</Label>
                  <Select
                    value={formData.repairServiceId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, repairServiceId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Servis seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deviceType">Cihaz Tipi *</Label>
                  <Select
                    value={formData.deviceType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deviceType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cihaz tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Telefon">Telefon</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Bilgisayar">Bilgisayar</SelectItem>
                      <SelectItem value="PlayStation">PlayStation</SelectItem>
                      <SelectItem value="Xbox">Xbox</SelectItem>
                      <SelectItem value="Konsol">Konsol</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deviceBrand">Marka *</Label>
                  <Input
                    id="deviceBrand"
                    value={formData.deviceBrand}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceBrand: e.target.value })
                    }
                    required
                    placeholder="Örn: Apple, Samsung, Sony"
                  />
                </div>
                <div>
                  <Label htmlFor="deviceModel">Model *</Label>
                  <Input
                    id="deviceModel"
                    value={formData.deviceModel}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceModel: e.target.value })
                    }
                    required
                    placeholder="Örn: iPhone 13, Galaxy S21"
                  />
                </div>
                <div>
                  <Label htmlFor="deviceSerialNumber">Seri Numarası</Label>
                  <Input
                    id="deviceSerialNumber"
                    value={formData.deviceSerialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceSerialNumber: e.target.value })
                    }
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="problemDescription">Sorun Açıklaması *</Label>
                <Textarea
                  id="problemDescription"
                  value={formData.problemDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, problemDescription: e.target.value })
                  }
                  required
                  rows={6}
                  placeholder="Cihazınızda yaşadığınız sorunu detaylı olarak açıklayın..."
                />
              </div>
              <div>
                <Label>Cihaz Fotoğrafları (Opsiyonel - En fazla 5 adet)</Label>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="deviceImages"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages || images.length >= 5}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingImages ? "Yükleniyor..." : "Fotoğraf Yükle"}
                    </Button>
                    {images.length > 0 && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        {images.length}/5 fotoğraf
                      </span>
                    )}
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Cihaz fotoğrafı ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <Link href="/repair" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    İptal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {submitting ? "Gönderiliyor..." : "Talep Oluştur"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

