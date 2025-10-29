"use client";

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = () => {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <div className="w-full flex-1">
            {/* Você pode adicionar um título de cabeçalho ou outros elementos aqui para celular */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {/* Div de depuração para o tema */}
          <div className="p-4 rounded-lg bg-background text-foreground border border-border">
            <p>Este é um elemento de teste de tema.</p>
            <p className="text-sm text-muted-foreground">O fundo e o texto devem mudar com o tema.</p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;