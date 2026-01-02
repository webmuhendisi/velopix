import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { availableIcons, getIconComponent, iconDisplayNames } from "@/lib/icons";
import { Search } from "lucide-react";

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function IconSelect({ value, onChange, label, placeholder = "İkon seçin" }: IconSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredIcons = availableIcons.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (iconDisplayNames[icon]?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const SelectedIcon = value ? getIconComponent(value) : null;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select value={value || undefined} onValueChange={(val) => onChange(val || "")}>
        <SelectTrigger>
          <div className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="w-4 h-4" />}
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          <div className="p-2 sticky top-0 bg-background z-10 border-b">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="İkon ara..."
                value={searchTerm}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="pl-8"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredIcons.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                İkon bulunamadı
              </div>
            ) : (
              filteredIcons.map((iconName) => {
                const IconComponent = getIconComponent(iconName);
                const displayName = iconDisplayNames[iconName] || iconName;
                return (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span>{displayName}</span>
                      <span className="text-xs text-muted-foreground ml-auto">({iconName})</span>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </div>
        </SelectContent>
      </Select>
      {value && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Önizleme:</div>
          {SelectedIcon ? (
            <div className="flex items-center gap-2">
              <SelectedIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{iconDisplayNames[value] || value}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">İkon bulunamadı</span>
          )}
        </div>
      )}
    </div>
  );
}

