"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme(); // Obter o tema atual

  console.log("Tema atual:", theme); // Registrar o tema atual

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="ml-3">Alternar Tema</span>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {
          setTheme("light");
          console.log("Definindo tema para claro");
        }}>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTheme("dark");
          console.log("Definindo tema para escuro");
        }}>
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setTheme("system");
          console.log("Definindo tema para sistema");
        }}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}