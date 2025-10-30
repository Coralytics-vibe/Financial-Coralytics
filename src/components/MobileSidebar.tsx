"use client";

import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DollarSign, Users, TrendingUp, LayoutDashboard } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Custos", href: "/costs", icon: DollarSign },
  { name: "Lucros", href: "/profits", icon: TrendingUp },
  { name: "Sócios", href: "/partners", icon: Users },
];

interface MobileSidebarProps {
  onLinkClick?: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ onLinkClick }) => {
  return (
    <nav className="grid gap-2 text-lg font-medium">
      <NavLink
        to="/"
        className="flex items-center gap-2 text-lg font-semibold mb-4"
        onClick={onLinkClick}
      >
        <img src="/coralytics-logo.png" alt="Financial Coralytics Logo" className="h-8 w-8" />
        <span className="sr-only">Financial Coralytics</span>
      </NavLink>
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
              isActive && "bg-muted text-foreground"
            )
          }
          onClick={onLinkClick}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileSidebar;