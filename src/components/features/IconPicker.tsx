"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const iconCategories = {
  Finance: [
    "Wallet","CreditCard","Banknote","PiggyBank","HandCoins","DollarSign",
    "TrendingUp","TrendingDown","Receipt","FileText","Tag",
    "Coins","Safe","Vault","Calculator","Scale","BadgeDollarSign"
  ],

  Transportation: [
    "Car","Bike","Bus","Train","Plane","Fuel",
    "Ship","TramFront","ParkingCircle","SteeringWheel","Taxi"
  ],

  FoodAndDrink: [
    "UtensilsCrossed","Coffee","Pizza","Beer","Cake","Apple","IceCream",
    "Sandwich","Wine","Milk","Cookie","Soup","Drumstick"
  ],

  Shopping: [
    "ShoppingBag","ShoppingCart","Gift","Package","Shirt",
    "Store","Basket","Barcode","Tag","Tags","BadgePercent"
  ],

  HomeAndBills: [
    "Home","Building","Building2","Wifi","Phone","Droplet","Zap",
    "Electricity","ThermometerSun","Bed","Sofa","WashingMachine"
  ],

  Leisure: [
    "Gamepad2","Film","Music","Popcorn","Camera","Clapperboard","Palette",
    "Ticket","PartyPopper","BallFootball","Volleyball","BookOpenCheck"
  ],

  PersonalCare: [
    "Heart","Stethoscope","Dumbbell","Baby",
    "Sparkles","Syringe","Bandage","Pill","HandHeart"
  ],

  WorkAndStudy: [
    "Briefcase","GraduationCap","Laptop","Lightbulb","Book","Calendar","Clock",
    "Monitor","PenTool","ClipboardList","Notebook","Presentation","Target"
  ],

  TravelAndNature: [
    "MapPin","Compass","TreePine","Globe","Umbrella",
    "Mountain","Sun","Cloud","Tent","Footprints","Binoculars"
  ],

  Misc: [
    "Star","Bell","Medal","Award","Trophy","Crown","Gem","Diamond","Shield","Key","Lock",
    "Puzzle","MagicWand","Flag","Hourglass","Shapes","Sparkle"
  ],
} as const;

type IconName = keyof typeof Icons;

interface IconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function IconPicker({ value, onValueChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);

  const IconComponent =
    (Icons[value as IconName] ?? Icons.Wallet) as React.FC<any>;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const list = (
    <div className="max-h-[70vh] overflow-y-auto px-3 pb-4 pt-1">
      {Object.entries(iconCategories).map(([category, icons], index) => (
        <div key={category} className="mb-3">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
            {category}
          </h4>

          <div className="grid grid-cols-6 gap-2">
            {icons.map((iconName) => {
              const Icon = Icons[iconName as IconName] as React.FC<any>;
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

          {index < Object.keys(iconCategories).length - 1 && (
            <Separator className="my-3" />
          )}
        </div>
      ))}

      <div className="pt-3 border-t mt-3">
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
    </div>
  );

 
return (
  <Drawer open={open} onOpenChange={setOpen}>
    <Button
      variant="outline"
      className={cn("w-full justify-start", className)}
      onClick={() => setOpen(true)}
      type="button"
    >
      <IconComponent className="mr-2 h-4 w-4" />
      {value || "Select icon"}
    </Button>

    <DrawerContent className={cn(
    "max-h-[80vh] p-0",
    "w-full",
    "md:max-w-[600px] md:mx-auto md:rounded-xl"
  )}>
      <DrawerHeader>
        <DrawerTitle>Select Icon</DrawerTitle>
      </DrawerHeader>

      {list}
    </DrawerContent>
  </Drawer>
);

}
