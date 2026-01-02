import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ChevronRight, Package, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getIconComponent } from "@/lib/icons";
import CategoryMenuItem from "./CategoryMenuItem";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  children?: Category[];
  productCount?: number;
}

export default function CategorySidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories?hierarchical=true")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleMouseEnter = (categoryId: string) => {
    setHoveredCategory(categoryId);
  };

  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };

  return (
    <>
      {/* Desktop Sidebar - Hepsiburada Style */}
      <div className="hidden lg:block fixed left-0 top-[112px] bottom-0 w-16 bg-white border-r border-gray-200 z-30 overflow-y-auto hover:w-64 transition-all duration-300 group">
        {/* Orange Banner */}
        <div className="bg-orange-500 h-12 flex items-center justify-center px-3">
          <div className="flex items-center gap-2 w-full">
            <Menu className="w-5 h-5 text-white flex-shrink-0" />
            <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Kategoriler</span>
          </div>
        </div>
        
        <nav className="py-2">
          {categories.map((category) => {
            const IconComponent = getIconComponent(category.icon) || Package;
            const hasChildren = category.children && category.children.length > 0;
            const isHovered = hoveredCategory === category.id;
            const totalProductCount = category.productCount || 0;

            return (
              <div
                key={category.id}
                className="relative group/category-item"
                onMouseEnter={() => handleMouseEnter(category.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={`/products?category=${category.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${
                    isHovered
                      ? "bg-orange-50 border-l-4 border-orange-500"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                    isHovered ? "text-orange-600" : "text-gray-600"
                  } transition-colors`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`font-medium text-sm whitespace-nowrap ${
                      isHovered ? "text-orange-600 opacity-100" : "text-gray-700"
                    }`}>
                      {category.name}
                    </div>
                    {totalProductCount > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {totalProductCount} ürün
                      </div>
                    )}
                  </div>
                  {hasChildren && (
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all ${
                      isHovered ? "opacity-100 text-orange-600 rotate-90" : "text-gray-400"
                    }`} />
                  )}
                </Link>

                {/* Subcategories Mega Menu - Right Side */}
                {hasChildren && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute left-full top-0 ml-2 w-96 bg-white shadow-2xl border border-gray-200 z-[60] rounded-lg overflow-hidden"
                    style={{ maxHeight: 'calc(100vh - 112px)' }}
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Header */}
                    <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                      <Link
                        href={`/products?category=${category.slug}`}
                        className="text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors inline-block"
                      >
                        {category.name}
                      </Link>
                      {totalProductCount > 0 && (
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {totalProductCount} ürün
                        </p>
                      )}
                    </div>
                    
                    {/* Subcategories Grid */}
                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-3">
                        {category.children?.map((subcategory) => {
                          const SubIconComponent = getIconComponent(subcategory.icon) || Package;
                          const subProductCount = subcategory.productCount || 0;
                          return (
                            <Link
                              key={subcategory.id}
                              href={`/products?category=${subcategory.slug}`}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group/sub border border-transparent hover:border-orange-200"
                            >
                              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg group-hover/sub:bg-orange-100 transition-colors flex-shrink-0">
                                <SubIconComponent className="w-4 h-4 text-gray-500 group-hover/sub:text-orange-600 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 group-hover/sub:text-orange-600 transition-colors">
                                  {subcategory.name}
                                </div>
                                {subProductCount > 0 && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {subProductCount} ürün
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Category Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 left-4 z-40 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
      >
        <Package className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Kategoriler</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <nav className="p-4 space-y-1">
                {categories.map((category) => (
                  <CategoryMenuItem
                    key={category.id}
                    category={category}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

