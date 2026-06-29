"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const iconCategories = {
  Finance: [
    "Wallet","CreditCard","Banknote","PiggyBank","HandCoins","DollarSign",
    "TrendingUp","TrendingDown","Receipt","FileText","Tag",
    "Coins","Safe","Vault","Calculator","Scale","BadgeDollarSign",
    // New finance icons
    "Landmark","Bitcoin","ArrowRightLeft","Percent","CircleDollarSign",
    "TrendingUpDown","ChartBar","ChartPie","Sigma"
  ],

  Transportation: [
    "Car","Bike","Bus","Train","Plane","Fuel",
    "Ship","TramFront","ParkingCircle","SteeringWheel","Taxi",
    // New transport icons
    "Truck","PersonStanding","Forklift","Sailboat","RocketIcon","Ambulance"
  ],

  FoodAndDrink: [
    "UtensilsCrossed","Coffee","Pizza","Beer","Cake","Apple","IceCream",
    "Sandwich","Wine","Milk","Cookie","Soup","Drumstick",
    // New food icons
    "ChefHat","Salad","CupSoda","Fish","Beef","Banana","Grape",
    "EggFried","Carrot","Popcorn","Citrus"
  ],

  Shopping: [
    "ShoppingBag","ShoppingCart","Gift","Package","Shirt",
    "Store","Basket","Barcode","Tags","BadgePercent",
    // New shopping icons
    "Smartphone","Headphones","Watch","Tv","Laptop2","Gem",
    "Glasses","Footprints","Sofa","Armchair","Archive"
  ],

  HomeAndBills: [
    "Home","Building","Building2","Wifi","Phone","Droplet","Zap",
    "ThermometerSun","Bed","WashingMachine",
    // New home icons
    "Hammer","Wrench","Flame","Key","DoorOpen","Lamp",
    "Fan","Trash2","Paintbrush","Plug","Lightbulb"
  ],

  Leisure: [
    "Gamepad2","Film","Music","Camera","Clapperboard","Palette",
    "Ticket","PartyPopper","BookOpenCheck",
    // New leisure icons
    "Headphones","Guitar","Radio","Dice5","Theater","Swords",
    "Volleyball","Trophy","Bike","Tent","Puzzle"
  ],

  PersonalCare: [
    "Heart","Stethoscope","Dumbbell","Baby",
    "Sparkles","Syringe","Bandage","Pill","HandHeart",
    // New personal care icons
    "HeartPulse","Thermometer","Scissors","Smile","Brain",
    "Eye","Flower2","Accessibility","ActivitySquare"
  ],

  WorkAndStudy: [
    "Briefcase","GraduationCap","Laptop","Lightbulb","Book","Calendar","Clock",
    "Monitor","PenTool","ClipboardList","Notebook","Presentation","Target",
    // New work icons
    "Code","Cpu","Database","Pencil","Globe","Server",
    "FileCode","BrainCircuit","Layers","Network","SquareCode"
  ],

  TravelAndNature: [
    "MapPin","Compass","TreePine","Globe","Umbrella",
    "Mountain","Sun","Cloud","Footprints","Binoculars",
    // New nature icons — Leaf is most important
    "Leaf","Flower2","Waves","Wind","Snowflake","Sunrise","Sunset",
    "Trees","Rainbow","Sprout","Shell","Bug","Bird","Cat","Dog"
  ],

  Misc: [
    "Star","Bell","Medal","Award","Trophy","Crown","Diamond","Shield","Lock",
    "Flag","Hourglass","Shapes","Sparkle",
    // New misc icons
    "Wand2","Fingerprint","Bookmark","QrCode","CircleHelp",
    "Zap","Tags","MessageCircle","Heart","Infinity","Siren"
  ],
} as const;

type IconName = keyof typeof Icons;

interface IconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** Renders the scrollable icon grid — shared between mobile Drawer and desktop Dialog */
function IconGrid({
  value,
  onSelect,
}: {
  value?: string;
  onSelect: (iconName: string) => void;
}) {
  return (
    <div className="overflow-y-auto px-4 pb-4 pt-2 flex-1">
      {Object.entries(iconCategories).map(([category, icons], index) => {
        // Filter out icons that don't exist in the installed lucide version
        const validIcons = icons.filter(
          (n) => Icons[n as IconName] !== undefined
        );
        if (validIcons.length === 0) return null;

        return (
          <div key={category} className="mb-1">
            {/* Category header */}
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
              {category.replace(/([A-Z])/g, " $1").trim()}
            </h4>

            {/* Icon grid: 6 cols on mobile, 8 on desktop */}
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
              {validIcons.map((iconName) => {
                const Icon = Icons[iconName as IconName] as React.FC<{
                  className?: string;
                }>;
                const isSelected = value === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() => onSelect(iconName)}
                    className={cn(
                      "flex items-center justify-center rounded-md transition-all",
                      // Slightly smaller on desktop to fill the 8-column grid nicely
                      "h-10 w-10 sm:h-9 sm:w-9",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] sm:h-4 sm:w-4" />
                  </button>
                );
              })}
            </div>

            {index < Object.keys(iconCategories).length - 1 && (
              <Separator className="my-3" />
            )}
          </div>
        );
      })}

      {/* Clear button */}
      <div className="pt-3 mt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => onSelect("")}
        >
          Clear selection
        </Button>
      </div>
    </div>
  );
}

export function IconPicker({ value, onValueChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile with resize listener (avoids SSR mismatch)
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const IconComponent = (
    Icons[(value as IconName) ?? "Wallet"] ?? Icons.Wallet
  ) as React.FC<{ className?: string }>;

  const handleSelect = (iconName: string) => {
    onValueChange(iconName);
    setOpen(false);
  };

  const trigger = (
    <Button
      variant="outline"
      className={cn("w-full justify-start", className)}
      onClick={() => setOpen(true)}
      type="button"
    >
      <IconComponent className="mr-2 h-4 w-4" />
      {value || "Select icon"}
    </Button>
  );

  /* ── Mobile: bottom Drawer ─────────────────────────────────── */
  if (isMobile) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[88vh] p-0 flex flex-col">
            <DrawerHeader className="shrink-0 pb-2">
              <DrawerTitle>Select Icon</DrawerTitle>
            </DrawerHeader>
            <IconGrid value={value} onSelect={handleSelect} />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  /* ── Desktop: centered Dialog ──────────────────────────────── */
  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[660px] max-h-[80vh] p-0 flex flex-col gap-0">
          <DialogHeader className="shrink-0 px-5 pt-5 pb-3 border-b">
            <DialogTitle className="text-base">Select Icon</DialogTitle>
          </DialogHeader>
          <IconGrid value={value} onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </>
  );
}
