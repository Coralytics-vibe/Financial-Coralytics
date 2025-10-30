"use client";

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import MobileSidebar from "./MobileSidebar";

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";

const Layout = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-primary">
              <MobileSidebar onLinkClick={() => { /* Close sheet logic here if needed */ }} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Você pode adicionar um título de cabeçalho ou outros elementos aqui para celular */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <PartnersProvider>
            <CostsProvider>
              <ProfitsProvider>
                <Outlet />
              </ProfitsProvider>
            </CostsProvider>
          </PartnersProvider>
        </main>
      </div>
    </div>
  );
};

export default Layout;