import {
  Wallet, Landmark, PiggyBank, Banknote, CreditCard, TrendingUp, Home, Briefcase,
  Utensils, ShoppingCart, Fuel, Car, HeartPulse, GraduationCap, PartyPopper, Wifi,
  Zap, Droplet, Repeat, Laptop, ShoppingBag, Percent, Tag, Target, Plane, type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  landmark: Landmark,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  home: Home,
  briefcase: Briefcase,
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  fuel: Fuel,
  car: Car,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "party-popper": PartyPopper,
  wifi: Wifi,
  zap: Zap,
  droplet: Droplet,
  repeat: Repeat,
  laptop: Laptop,
  "shopping-bag": ShoppingBag,
  percent: Percent,
  tag: Tag,
  target: Target,
  plane: Plane,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Tag;
}
