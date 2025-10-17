"use client";

import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DollarSign, Users, TrendingUp, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext"; // Import useSession

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Custos", href: "/costs", icon: DollarSign },
  { name: "Lucros", href: "/profits", icon: TrendingUp },
  { name: "Sócios", href: "/partners", icon: Users },
];

const Sidebar = () => {
  const { supabase } = useSession();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <img src="/coralytics-logo.png" alt="Financial Coralytics Logo" className="h-8 w-8" /> {/* Nova logo */}
            <span className="text-lg">Financial Coralytics</span> {/* Novo nome */}
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground hover:text-sidebar-accent-foreground" // Usando cores de destaque da sidebar
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive/90" onClick={handleLogout}>
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;