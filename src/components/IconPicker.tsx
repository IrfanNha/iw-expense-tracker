"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

// Common icons for accounts and categories
const commonIcons = [
  "Wallet",
  "CreditCard",
  "Banknote",
  "PiggyBank",
  "Building2",
  "Building",
  "Home",
  "ShoppingCart",
  "ShoppingBag",
  "UtensilsCrossed",
  "Coffee",
  "Car",
  "Fuel",
  "Plane",
  "Train",
  "Bus",
  "Bike",
  "Gamepad2",
  "Film",
  "Music",
  "Book",
  "GraduationCap",
  "Heart",
  "Stethoscope",
  "Dumbbell",
  "Shirt",
  "Gift",
  "Baby",
  "Briefcase",
  "TrendingUp",
  "TrendingDown",
  "DollarSign",
  "Receipt",
  "FileText",
  "Tag",
  "Star",
  "Bell",
  "Phone",
  "Wifi",
  "Zap",
  "Droplet",
  "Package",
  "Apple",
  "Beer",
  "Cake",
  "Camera",
  "Clapperboard",
  "Crown",
  "Diamond",
  "Flower2",
  "Gem",
  "Hammer",
  "HandCoins",
  "IceCream",
  "Laptop",
  "Lightbulb",
  "MapPin",
  "Medal",
  "Mic",
  "Palette",
  "Pizza",
  "Popcorn",
  "Rocket",
  "Scissors",
  "Shield",
  "Smile",
  "Trophy",
  "Umbrella",
  "Watch",
  "Youtube",
  "Award",
  "BarChart3",
  "Calendar",
  "Clock",
  "Cloud",
  "Compass",
  "Database",
  "Globe",
  "Key",
  "Lock",
  "Mail",
  "MessageSquare",
  "Moon",
  "Sun",
  "Target",
  "ThumbsUp",
  "TreePine",
  "Users",
] as const;

type IconName = (typeof commonIcons)[number];

interface IconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function IconPicker({ value, onValueChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  
  const IconComponent = value && Icons[value as IconName] ? Icons[value as IconName] : Icons.Wallet;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start", className)}
          type="button"
        >
          <IconComponent className="mr-2 h-4 w-4" />
          {value || "Select icon"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
          {commonIcons.map((iconName) => {
            const Icon = Icons[iconName];
            if (!Icon) return null;
            
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onValueChange(iconName);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md border transition-colors",
                  value === iconName
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="mt-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onValueChange("");
              setOpen(false);
            }}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

