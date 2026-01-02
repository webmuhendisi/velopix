import { useEffect, useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "../layout";
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
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Video, Search, Plus, User, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RepairService {
  id: string;
  name: string;
  description: string | null;
}

interface MediaFile {
  url: string;
  type: "image" | "video";
  name: string;
}

interface Customer {
  phone: string;
  name: string;
  email: string | null;
  totalRepairs: number;
  lastRepairDate: string | null;
}

export default function AdminRepairRequestNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [repairServices, setRepairServices] = useState<RepairService[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [showCustomerFields, setShowCustomerFields] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
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
    status: "pending",
    estimatedPrice: "",
  });

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchRepairServices();
    fetchCustomers();
  }, [token, setLocation]);

  const fetchRepairServices = async () => {
    try {
      const res = await fetch("/api/admin/repair-services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRepairServices(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch repair services", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          setLocation("/admin/login");
          return;
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          console.error("Failed to fetch customers:", error.error || "Unknown error");
        } else {
          console.error("Failed to fetch customers: Server returned non-JSON response");
        }
        return;
      }
      
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      // Don't show error to user, just log it - customers list is optional
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.phone.includes(customerSearchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
  );

  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || "",
    });
    setShowCustomerFields(true);
    setCustomerSearchOpen(false);
    setCustomerSearchTerm("");
  };

  const handleCreateNewCustomer = () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      toast({
        title: "Hata",
        description: "İsim ve telefon numarası zorunludur",
        variant: "destructive",
      });
      return;
    }
    setFormData({
      ...formData,
      customerName: newCustomerForm.name,
      customerPhone: newCustomerForm.phone,
      customerEmail: newCustomerForm.email || "",
    });
    setShowCustomerFields(true);
    setShowNewCustomerDialog(false);
    setNewCustomerForm({ name: "", phone: "", email: "" });
    fetchCustomers(); // Refresh customer list
    toast({
      title: "Başarılı",
      description: "Müşteri bilgileri eklendi",
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = type === "image" ? 10 : 5; // Resim için 10, video için 5
    const currentTypeCount = mediaFiles.filter(m => m.type === type).length;

    if (files.length + currentTypeCount > maxFiles) {
      toast({
        title: "Hata",
        description: `En fazla ${maxFiles} ${type === "image" ? "fotoğraf" : "video"} yükleyebilirsiniz`,
        variant: "destructive",
      });
      return;
    }

    setUploadingMedia(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // Resim 5MB, Video 50MB
        
        if (file.size > maxSize) {
          throw new Error(`${file.name} dosyası ${type === "image" ? "5MB" : "50MB"}'dan büyük`);
        }

        const formData = new FormData();
        formData.append("image", file); // Backend'de field name "image" olarak bekleniyor

        const res = await fetch("/api/repair-requests/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`${file.name} yüklenemedi`);
        }

        const data = await res.json();
        return {
          url: data.url,
          type: type,
          name: file.name,
        } as MediaFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setMediaFiles((prev) => [...prev, ...uploadedFiles]);
      toast({
        title: "Başarılı",
        description: `${uploadedFiles.length} ${type === "image" ? "fotoğraf" : "video"} yüklendi`,
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || `${type === "image" ? "Fotoğraflar" : "Videolar"} yüklenirken bir hata oluştu`,
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.deviceType || !formData.deviceBrand || !formData.deviceModel || !formData.problemDescription) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deviceType: formData.deviceType,
        deviceBrand: formData.deviceBrand,
        deviceModel: formData.deviceModel,
        problemDescription: formData.problemDescription,
        status: formData.status,
      };

      if (formData.customerEmail) {
        payload.customerEmail = formData.customerEmail;
      }
      if (formData.deviceSerialNumber) {
        payload.deviceSerialNumber = formData.deviceSerialNumber;
      }
      if (formData.repairServiceId) {
        payload.repairServiceId = formData.repairServiceId;
      }
      if (formData.estimatedPrice) {
        payload.estimatedPrice = formData.estimatedPrice;
      }

      // Sadece resimleri gönder (videolar şu an desteklenmiyor backend'de)
      const imageUrls = mediaFiles.filter(m => m.type === "image").map(m => m.url);
      if (imageUrls.length > 0) {
        payload.images = imageUrls;
      }

      const res = await fetch("/api/admin/repair-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Kayıt oluşturulamadı");
      }

      toast({ title: "Başarılı", description: "Tamir kaydı oluşturuldu" });
      setLocation("/admin/repair-requests");
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kayıt oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/repair-requests">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Yeni Tamir Kaydı</h1>
            <p className="text-muted-foreground">Manuel olarak yeni bir tamir kaydı oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Müşteri Ara ve Seç</Label>
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {formData.customerName ? (
                          <span>{formData.customerName} - {formData.customerPhone}</span>
                        ) : (
                          <span className="text-muted-foreground">Müşteri ara...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder="İsim, telefon veya e-posta ile ara..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="border-0 focus-visible:ring-0"
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            {customerSearchTerm ? "Müşteri bulunamadı" : "Müşteri bulunamadı"}
                          </div>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.phone}
                              className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{customer.name}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{customer.phone}</span>
                                  </div>
                                  {customer.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span>{customer.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div
                          className="flex items-center gap-2 p-3 hover:bg-accent cursor-pointer border-t"
                          onClick={() => {
                            setCustomerSearchOpen(false);
                            setShowNewCustomerDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Yeni Müşteri Ekle</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {showCustomerFields && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Müşteri Adı *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) =>
                            setFormData({ ...formData, customerName: e.target.value })
                          }
                          placeholder="Müşteri adı"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Telefon *</Label>
                        <Input
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={(e) =>
                            setFormData({ ...formData, customerPhone: e.target.value })
                          }
                          placeholder="05XX XXX XX XX"
                          required
                        />
                      </div>
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
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cihaz Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deviceType">Cihaz Tipi *</Label>
                    <Input
                      id="deviceType"
                      value={formData.deviceType}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceType: e.target.value })
                      }
                      placeholder="Telefon, Tablet, vb."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceBrand">Marka *</Label>
                    <Input
                      id="deviceBrand"
                      value={formData.deviceBrand}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceBrand: e.target.value })
                      }
                      placeholder="Apple, Samsung, vb."
                      required
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
                      placeholder="iPhone 14, Galaxy S23, vb."
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="deviceSerialNumber">Seri No</Label>
                  <Input
                    id="deviceSerialNumber"
                    value={formData.deviceSerialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceSerialNumber: e.target.value })
                    }
                    placeholder="Opsiyonel"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tamir Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="repairServiceId">Tamir Servisi</Label>
                  <Select
                    value={formData.repairServiceId || undefined}
                    onValueChange={(value) =>
                      setFormData({ ...formData, repairServiceId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Servis seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {repairServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="problemDescription">Sorun Açıklaması *</Label>
                  <Textarea
                    id="problemDescription"
                    value={formData.problemDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, problemDescription: e.target.value })
                    }
                    rows={6}
                    placeholder="Cihazda yaşanan sorunu detaylı olarak açıklayın..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="diagnosis">Tanı Aşamasında</SelectItem>
                        <SelectItem value="price_quoted">Fiyat Teklifi Verildi</SelectItem>
                        <SelectItem value="customer_approved">Müşteri Onayladı</SelectItem>
                        <SelectItem value="customer_rejected">Müşteri Reddetti</SelectItem>
                        <SelectItem value="in_repair">Tamirde</SelectItem>
                        <SelectItem value="completed">Tamamlandı</SelectItem>
                        <SelectItem value="delivered">Teslim Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedPrice">Tahmini Fiyat (₺)</Label>
                    <Input
                      id="estimatedPrice"
                      type="number"
                      step="0.01"
                      value={formData.estimatedPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedPrice: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Görseller ve Videolar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Fotoğraflar (En fazla 10)</Label>
                    <Input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMediaUpload(e, "image")}
                      disabled={uploadingMedia}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, GIF, WEBP (Max 5MB)
                    </p>
                  </div>
                  <div className="flex-1">
                    <Label>Videolar (En fazla 5)</Label>
                    <Input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleMediaUpload(e, "video")}
                      disabled={uploadingMedia}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, WEBM, OGG, MOV, AVI (Max 50MB)
                    </p>
                  </div>
                </div>

                {uploadingMedia && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                  </div>
                )}

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type === "image" ? (
                          <div className="relative aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemoveMedia(index)}
                                className="h-8 w-8"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute top-2 left-2">
                              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                Resim
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100">
                            <video
                              src={file.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemoveMedia(index)}
                                className="h-8 w-8"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="absolute top-2 left-2">
                              <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Video
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {mediaFiles.length === 0 && !uploadingMedia && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Fotoğraf veya video yüklemek için yukarıdaki butonları kullanın
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/admin/repair-requests">
                <Button type="button" variant="outline">
                  İptal
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </form>

        {/* New Customer Dialog */}
        <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Müşteri Ekle</DialogTitle>
              <DialogDescription>
                Yeni müşteri bilgilerini girin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newCustomerName">Müşteri Adı *</Label>
                <Input
                  id="newCustomerName"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                  }
                  placeholder="Müşteri adı"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newCustomerPhone">Telefon *</Label>
                <Input
                  id="newCustomerPhone"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                  }
                  placeholder="05XX XXX XX XX"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newCustomerEmail">E-posta</Label>
                <Input
                  id="newCustomerEmail"
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                  }
                  placeholder="ornek@email.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCustomerDialog(false);
                  setNewCustomerForm({ name: "", phone: "", email: "" });
                }}
              >
                İptal
              </Button>
              <Button onClick={handleCreateNewCustomer}>
                Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

