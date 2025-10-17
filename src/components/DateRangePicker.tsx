"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar o locale ptBR
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
  initialDateRange?: DateRange;
}

export function DateRangePicker({ onDateRangeChange, initialDateRange }: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(initialDateRange);

  React.useEffect(() => {
    onDateRangeChange(date);
  }, [date, onDateRangeChange]);

  return (
    <div className={cn("grid gap-2")}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "} {/* Usar ptBR aqui */}
                  {format(date.to, "LLL dd, y", { locale: ptBR })} {/* Usar ptBR aqui */}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: ptBR }) // Usar ptBR aqui
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={ptBR} // Adicionar locale aqui
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}