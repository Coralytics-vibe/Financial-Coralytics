"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { usePartners } from "@/context/PartnersContext";
import { useProfits } from "@/context/ProfitsContext"; // Import useProfits hook
import { Partner, ProfitDistribution } from "@/types";

const profitSchema = z.object({
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  value: z.preprocess(
    (val) => Number(String(val).replace(',', '.')),
    z.number().min(0.01, "O valor deve ser maior que zero.")
  ),
  source: z.string().min(1, "A origem é obrigatória."),
});

const Profits = () => {
  const { partners } = usePartners();
  const { profits, addProfit } = useProfits(); // Use the hook

  const form = useForm<z.infer<typeof profitSchema>>({
    resolver: zodResolver(profitSchema),
    defaultValues: {
      date: new Date(),
      value: 0,
      source: "",
    },
  });

  const onSubmit = (values: z.infer<typeof profitSchema>) => {
    addProfit(values.date, values.value, values.source);
    form.reset({
      date: new Date(),
      value: 0,
      source: "",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Lucros</h1>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Novo Lucro</CardTitle>
          <CardDescription>
            Adicione um novo lucro e ele será distribuído automaticamente entre os sócios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Lucro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Venda de produto X, Serviço Y" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Registrar Lucro</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lucros Registrados</CardTitle>
          <CardDescription>
            Lista de todos os lucros e sua distribuição entre os sócios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profits.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lucro registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Distribuição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profits.map((profit) => (
                    <TableRow key={profit.id}>
                      <TableCell>{format(profit.date, "PPP")}</TableCell>
                      <TableCell>{profit.source}</TableCell>
                      <TableCell className="text-right">R$ {profit.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {profit.distributions.map((dist: ProfitDistribution) => {
                            const partner = partners.find((p: Partner) => p.id === dist.partnerId);
                            return (
                              <Badge key={dist.partnerId} variant="secondary" className="flex items-center gap-1">
                                {partner?.name}: R$ {dist.amount.toFixed(2)}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profits;