"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Importar o locale ptBR
import { CalendarIcon, MoreHorizontal } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import { cn } from "@/lib/utils";
import { usePartners } from "@/context/PartnersContext";
import { useProfits } from "@/context/ProfitsContext";
import { Partner, Profit, ProfitDistribution } from "@/types";

const profitSchema = z.object({
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  value: z.preprocess(
    (val) => Number(String(val).replace(',', '.')),
    z.number().min(0.01, "O valor deve ser maior que zero.")
  ),
  source: z.string().min(1, "A origem é obrigatória.").max(100, "A origem não pode exceder 100 caracteres."),
  category: z.enum(['operacional', 'extraordinaria', 'investimento', 'outros'], {
    required_error: "A categoria é obrigatória.",
  }),
});

const Profits = () => {
  const { partners } = usePartners();
  const { profits, addProfit, editProfit, deleteProfit } = useProfits();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProfit, setSelectedProfit] = useState<Profit | null>(null);

  const addForm = useForm<z.infer<typeof profitSchema>>({
    resolver: zodResolver(profitSchema),
    defaultValues: {
      date: new Date(),
      value: 0,
      source: "",
      category: "operacional",
    },
  });

  const editForm = useForm<z.infer<typeof profitSchema>>({
    resolver: zodResolver(profitSchema),
    defaultValues: {
      date: new Date(),
      value: 0,
      source: "",
      category: "operacional",
    },
  });

  const onAddSubmit = (values: z.infer<typeof profitSchema>) => {
    addProfit(values.date, values.value, values.source, values.category);
    addForm.reset({
      date: new Date(),
      value: 0,
      source: "",
      category: "operacional",
    });
  };

  const onEditSubmit = (values: z.infer<typeof profitSchema>) => {
    if (selectedProfit) {
      editProfit(selectedProfit.id, values.date, values.value, values.source, values.category);
      setIsEditDialogOpen(false);
      setSelectedProfit(null);
    }
  };

  const handleDeleteProfit = () => {
    if (selectedProfit) {
      deleteProfit(selectedProfit.id);
      setIsDeleteDialogOpen(false);
      setSelectedProfit(null);
    }
  };

  const openEditDialog = (profit: Profit) => {
    setSelectedProfit(profit);
    editForm.reset({
      date: profit.date,
      value: profit.value,
      source: profit.source,
      category: profit.category,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (profit: Profit) => {
    setSelectedProfit(profit);
    setIsDeleteDialogOpen(true);
  };

  const totalProfits = profits.reduce((sum, profit) => sum + profit.value, 0);

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
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
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
                              format(field.value, "PPP", { locale: ptBR }) // Usar ptBR aqui
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
                          locale={ptBR} // Adicionar locale aqui
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
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
                control={addForm.control}
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
              <FormField
                control={addForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">Registrar Lucro</Button>
                <Button type="button" variant="outline" onClick={() => addForm.reset({ date: new Date(), value: 0, source: "", category: "operacional" })}>
                  Limpar
                </Button>
              </div>
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
          <div className="mb-4 text-right text-sm text-muted-foreground">
            Total de Lucros: <Badge variant="secondary">R$ {totalProfits.toFixed(2)}</Badge>
          </div>
          {profits.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lucro registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Distribuição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profits.map((profit) => (
                    <TableRow key={profit.id}>
                      <TableCell>{format(profit.date, "PPP", { locale: ptBR })}</TableCell> {/* Usar ptBR aqui */}
                      <TableCell>{profit.source}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{profit.category.charAt(0).toUpperCase() + profit.category.slice(1)}</Badge>
                      </TableCell>
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(profit)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(profit)} className="text-destructive">
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Lucro</DialogTitle>
            <DialogDescription>
              Faça alterações nos detalhes do lucro aqui. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-4 py-4">
              <FormField
                control={editForm.control}
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
                              format(field.value, "PPP", { locale: ptBR }) // Usar ptBR aqui
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
                          locale={ptBR} // Adicionar locale aqui
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
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
                control={editForm.control}
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
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                        <SelectItem value="investimento">Investimento</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Profit Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o lucro{" "}
              <span className="font-semibold">{selectedProfit?.source}</span> e reverterá sua distribuição entre os sócios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profits;