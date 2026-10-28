import {
  Bookmark,
  Bell,
  CircleUserRound,
  Columns3,
  CreditCard,
  Heart,
  House,
  MapPin,
  Search,
  Trees,
} from "lucide-react";

export const productNavigation = [
  {
    group: "primary",
    items: [
      { href: "/dashboard", label: "dashboard", icon: House },
      { href: "/properties", label: "properties", icon: Search },
      { href: "/saved", label: "saved", icon: Bookmark },
      { href: "/compare", label: "compare", icon: Columns3 },
    ],
  },
  {
    group: "personal",
    items: [
      { href: "/locations", label: "locations", icon: MapPin },
      { href: "/interests", label: "interests", icon: Heart },
      { href: "/neighborhood", label: "neighborhood", icon: Trees },
    ],
  },
  {
    group: "account",
    items: [
      { href: "/profile", label: "profile", icon: CircleUserRound },
      { href: "/payments", label: "payments", icon: CreditCard },
      { href: "/notifications", label: "notifications", icon: Bell },
    ],
  },
] as const;

export function currentNavigation(path: string) {
  if (path.startsWith("/properties/")) return productNavigation[0].items[2];
  return productNavigation
    .flatMap((group) => [...group.items])
    .find((item) => path === item.href || path.startsWith(`${item.href}/`));
}
