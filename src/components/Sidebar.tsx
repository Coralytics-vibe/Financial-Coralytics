"use client";

import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Users, DollarSign, TrendingUp, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Sócios", href: "/partners", icon: Users },
  { name: "Custos", href: "/costs", icon: DollarSign },
  { name: "Lucros", href: "/profits", icon: TrendingUp },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const Sidebar = () => {
  return (
    <div className="hidden md:flex flex-col h-full border-r bg-sidebar-background text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sidebar-primary">
          <DollarSign className="h-6 w-6" />
          <span className="">Finanças Startup</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 text-sm font-medium lg:px-4">
        <ul className="grid gap-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-sidebar-primary",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col bg-sidebar-background text-sidebar-foreground">
        <nav className="grid gap-2 text-lg font-medium">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary px-2 py-4">
            <DollarSign className="h-6 w-6" />
            <span className="">Finanças Startup</span>
          </Link>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-sidebar-primary",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export { Sidebar, MobileSidebar };