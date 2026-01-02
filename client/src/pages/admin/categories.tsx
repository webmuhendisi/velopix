import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import AdminLayout from "./layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  order: number | null;
  children?: Category[];
  _childrenLoaded?: boolean;
  _loading?: boolean;
}

export default function AdminCategories() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");

  // Tüm kategorileri düz liste olarak al (parent bilgisi için)
  const fetchAllCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAllCategories(data);
    } catch (error) {
      console.error("Kategoriler yüklenemedi:", error);
    }
  };

  useEffect(() => {
    if (!token) {
      setLocation("/admin/login");
      return;
    }
    fetchData();
    fetchAllCategories();
  }, [token, setLocation]);

  // Sadece ana kategorileri fetch et (parentId: null)
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories/parent/null", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      setCategories(data);
    } catch (error: any) {
      console.error("Kategoriler yüklenemedi:", error);
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Bir kategorinin alt kategorilerini fetch et
  const fetchChildren = async (categoryId: string, parentCategory?: Category) => {
    try {
      // Loading state'i güncelle
      const updateCategory = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, _loading: true };
          }
          // Recursive olarak children içinde de ara
          if (cat.children) {
            return { ...cat, children: updateCategory(cat.children) };
          }
          return cat;
        });
      };
      
      setCategories(prev => updateCategory(prev));

      const res = await fetch(`/api/admin/categories/parent/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const children = await res.json();
      
      // Kategorileri güncelle - children ekle
      const updateCategoryWithChildren = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === categoryId) {
            return {
              ...cat,
              children: children,
              _childrenLoaded: true,
              _loading: false
            };
          }
          // Recursive olarak children içinde de ara
          if (cat.children) {
            return { ...cat, children: updateCategoryWithChildren(cat.children) };
          }
          return cat;
        });
      };
      
      setCategories(prev => updateCategoryWithChildren(prev));
    } catch (error) {
      toast({
        title: "Hata",
        description: "Alt kategoriler yüklenemedi",
        variant: "destructive",
      });
      const updateCategory = (cats: Category[]): Category[] => {
        return cats.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, _loading: false };
          }
          if (cat.children) {
            return { ...cat, children: updateCategory(cat.children) };
          }
          return cat;
        });
      };
      setCategories(prev => updateCategory(prev));
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Başarılı", description: "Kategori silindi" });
      // Sayfayı yenile
      await fetchData();
      await fetchAllCategories();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Silme işlemi başarısız",
        variant: "destructive",
      });
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Kategori Yönetimi</h1>
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
          <h1 className="text-3xl font-bold">Kategori Yönetimi</h1>
          <p className="text-muted-foreground">Kategorileri ekleyin, düzenleyin ve silin</p>
        </div>
        <div className="flex justify-end">
          <Link href="/admin/categories/new">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kategori
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz kategori eklenmemiş.
            </div>
          ) : (
            categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                onDelete={handleDelete}
                allCategories={allCategories}
                onToggle={(id) => {
                  // Toggle işlemi CategoryItem içinde handle ediliyor
                }}
                fetchChildren={fetchChildren}
              />
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


interface CategoryItemProps {
  category: Category;
  level: number;
  onDelete: (id: string) => void;
  allCategories: Category[];
  onToggle: (categoryId: string) => void;
  fetchChildren: (categoryId: string) => void;
}

function CategoryItem({ category, level, onDelete, allCategories, onToggle, fetchChildren }: CategoryItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<Category[]>(category.children || []);
  const [childrenLoaded, setChildrenLoaded] = useState(category._childrenLoaded || false);
  const [loading, setLoading] = useState(false);
  
  // Parent kategori bilgisini bul
  const parentCategory = category.parentId 
    ? allCategories.find(cat => cat.id === category.parentId)
    : null;

  // Bu kategorinin alt kategorileri var mı kontrol et
  const hasChildrenInDb = allCategories.some(cat => cat.parentId === category.id);
  const hasChildren = children.length > 0;
  const canHaveChildren = hasChildren || hasChildrenInDb;

  const handleToggle = async () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    
    if (newOpenState && !childrenLoaded && hasChildrenInDb) {
      // İlk kez açılıyorsa ve children yüklenmemişse, fetch et
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`/api/admin/categories/parent/${category.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedChildren = await res.json();
        setChildren(fetchedChildren);
        setChildrenLoaded(true);
      } catch (error) {
        console.error("Alt kategoriler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    }
    
    onToggle(category.id);
  };

  return (
    <div className="border rounded-lg mb-2 bg-card">
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <div
          className={`flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors rounded-lg ${
            canHaveChildren ? "cursor-pointer" : ""
          }`}
          style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
          onClick={canHaveChildren ? handleToggle : undefined}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {canHaveChildren ? (
              <div className="flex-shrink-0 text-muted-foreground">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            ) : (
              <div className="w-4 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base truncate">{category.name}</h3>
                {parentCategory && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    ← {parentCategory.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-sm text-muted-foreground truncate">
                  <span className="font-semibold">Slug:</span> /{category.slug}
                </p>
                {parentCategory && (
                  <span className="text-xs text-muted-foreground/70">
                    <span className="font-semibold">Parent Slug:</span> /{parentCategory.slug}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Düzenle
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(category.id)}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {hasChildren && (
          <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="pl-4 pb-2 space-y-2 border-l-2 border-primary/20 ml-2">
              {children.map((child) => (
                <CategoryItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  onDelete={onDelete}
                  allCategories={allCategories}
                  onToggle={onToggle}
                  fetchChildren={fetchChildren}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

