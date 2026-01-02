import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Package } from "lucide-react";
import { getIconComponent } from "@/lib/icons";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parentId: string | null;
  children?: Category[];
  productCount?: number;
}

interface CategoryMenuItemProps {
  category: Category;
  onClose?: () => void;
}

export default function CategoryMenuItem({ category, onClose }: CategoryMenuItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getIconComponent(category.icon) || Package;
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link
          href={`/products?category=${category.slug}`}
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors flex-1 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-gray-600" />
          </div>
          <span className="font-medium text-sm text-gray-700">{category.name}</span>
          {category.productCount !== undefined && category.productCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-auto">
              {category.productCount}
            </span>
          )}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
          {category.children?.map((subcategory) => {
            const SubIconComponent = getIconComponent(subcategory.icon) || Package;
            return (
              <Link
                key={subcategory.id}
                href={`/products?category=${subcategory.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <SubIconComponent className="w-3 h-3 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="text-sm text-gray-600 group-hover:text-primary transition-colors">
                  {subcategory.name}
                </span>
                {subcategory.productCount !== undefined && subcategory.productCount > 0 && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {subcategory.productCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

