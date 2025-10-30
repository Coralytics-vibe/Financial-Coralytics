"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, CircleDashed, MoreHorizontal, ArrowDownWideNarrow, ArrowUpWideNarrow, XCircle, Users } from "lucide-react";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

import { cn } from "@/lib/utils";
import { usePartners } from "@/context/PartnersContext";
import { useCosts } from "@/context/CostsContext";
import { Partner, Cost } from "@/types";

const costSchema = z.object({
  category: z.enum(['site', 'provedor', 'banco_de_dados', 'implantacao', 'manutencao', 'operacional', 'atualizacao', 'usuario', 'transacao', 'imposto', 'outros'], {
    required_error: "A categoria é obrigatória.",
  }),
  description: z.string().optional(),
  value: z.preprocess(
    (val) => Number(String(val).replace(',', '.')),
    z.number().min(0.01, "O valor deve ser maior que zero.")
  ),
  date: z.date({
    required_error: "A data é obrigatória.",
  }),
  payerId: z.string().min(1, "O pagador é obrigatório."),
  isRecurrent: z.boolean().default(false),
  involvedPartnerIds: z.array(z.string()).min(1, "Pelo menos um sócio deve estar envolvido no custo."), // New field
});

const Costs = () => {
  const { partners } = usePartners();
  const { costs, addCost, markCostPaymentAsPaid, editCost, deleteCost } = useCosts();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSelectInvolvedPartnersDialogOpen, setIsSelectInvolvedPartnersDialogOpen] = useState(false); // State for multi-select dialog
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);

  // Filter and Sort States
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPayerId, setFilterPayerId] = useState<string>("all");
  const [filterIsRecurrent, setFilterIsRecurrent] = useState<"all" | "yes" | "no">("all");
  const [sortColumn, setSortColumn] = useState<keyof Cost | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const addForm = useForm<z.infer<typeof costSchema>>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
      involvedPartnerIds: [], // Default empty array
    },
  });

  const editForm = useForm<z.infer<typeof costSchema>>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
      involvedPartnerIds: [], // Default empty array
    },
  });

  useEffect(() => {
    if (isEditDialogOpen && selectedCost) {
      editForm.reset({
        category: selectedCost.category,
        description: selectedCost.description,
        value: selectedCost.value,
        date: selectedCost.date,
        payerId: selectedCost.payerId,
        isRecurrent: selectedCost.isRecurrent,
        involvedPartnerIds: selectedCost.involvedPartnerIds,
      });
    }
  }, [isEditDialogOpen, selectedCost, editForm]);

  const onAddSubmit = (values: z.infer<typeof costSchema>) => {
    addCost(
      values.category,
      values.description,
      values.value,
      values.date,
      values.payerId,
      values.isRecurrent,
      values.involvedPartnerIds // Pass new field
    );
    addForm.reset({
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
      involvedPartnerIds: [],
    });
  };

  const onEditSubmit = (values: z.infer<typeof costSchema>) => {
    if (selectedCost) {
      editCost(
        selectedCost.id,
        values.category,
        values.description,
        values.value,
        values.date,
        values.payerId,
        values.isRecurrent,
        values.involvedPartnerIds // Pass new field
      );
      setIsEditDialogOpen(false);
      setSelectedCost(null);
    }
  };

  const handleDeleteCost = () => {
    if (selectedCost) {
      deleteCost(selectedCost.id);
      setIsDeleteDialogOpen(false);
      setSelectedCost(null);
    }
  };

  const openEditDialog = (cost: Cost) => {
    setSelectedCost(cost);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cost: Cost) => {
    setSelectedCost(cost);
    setIsDeleteDialogOpen(true);
  };

  const filteredAndSortedCosts = useMemo(() => {
    let currentCosts = [...costs];

    // Apply filters
    if (filterCategory !== "all") {
      currentCosts = currentCosts.filter((cost) => cost.category === filterCategory);
    }
    if (filterPayerId !== "all") {
      currentCosts = currentCosts.filter((cost) => cost.payerId === filterPayerId);
    }
    if (filterIsRecurrent !== "all") {
      const isRecurrentBool = filterIsRecurrent === "yes";
      currentCosts = currentCosts.filter((cost) => cost.isRecurrent === isRecurrentBool);
    }

    // Apply sorting
    if (sortColumn) {
      currentCosts.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortColumn === 'date') {
          valA = a.date.getTime();
          valB = b.date.getTime();
        } else if (sortColumn === 'value') {
          valA = a.value;
          valB = b.value;
        } else if (sortColumn === 'category') {
          valA = a.category.toLowerCase();
          valB = b.category.toLowerCase();
        } else {
          return 0;
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return currentCosts;
  }, [costs, filterCategory, filterPayerId, filterIsRecurrent, sortColumn, sortDirection]);

  const totalCosts = filteredAndSortedCosts.reduce((sum, cost) => sum + cost.value, 0);

  const handleClearFilters = () => {
    setFilterCategory("all");
    setFilterPayerId("all");
    setFilterIsRecurrent("all");
    setSortColumn(null);
    setSortDirection("asc");
  };

  const costCategories = [
    { value: 'site', label: 'Site' },
    { value: 'provedor', label: 'Provedor' },
    { value: 'banco_de_dados', label: 'Banco de Dados' },
    { value: 'implantacao', label: 'Implantação' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'atualizacao', label: 'Atualização' },
    { value: 'usuario', label: 'Usuário' },
    { value: 'transacao', label: 'Transação' },
    { value: 'imposto', label: 'Imposto' },
    { value: 'outros', label: 'Outros' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Custos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Custo</CardTitle>
          <CardDescription>
            Registre um novo custo e defina quais sócios estão envolvidos na divisão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
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
                        {costCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Breve descrição do custo" {...field} />
                    </FormControl>
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
                              format(field.value, "PPP", { locale: ptBR })
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
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="payerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador (Quem adiantou o valor total)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quem pagou este custo?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partners.map((partner: Partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="involvedPartnerIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sócios Envolvidos (Quem divide o custo)</FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSelectInvolvedPartnersDialogOpen(true)}
                        className="w-full justify-between"
                      >
                        {field.value.length > 0
                          ? `${field.value.length} sócio(s) selecionado(s)`
                          : "Selecionar sócios"}
                        <Users className="ml-2 h-4 w-4" />
                      </Button>
                    </FormControl>
                    <FormDescription>
                      Selecione os sócios que dividirão este custo.
                    </FormDescription>
                    <FormMessage />
                    <Dialog open={isSelectInvolvedPartnersDialogOpen} onOpenChange={setIsSelectInvolvedPartnersDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Selecionar Sócios Envolvidos</DialogTitle>
                          <DialogDescription>
                            Marque os sócios que participarão da divisão deste custo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {partners.map((partner) => (
                            <div key={partner.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`partner-${partner.id}`}
                                checked={field.value.includes(partner.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, partner.id]);
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== partner.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`partner-${partner.id}`}>{partner.name}</Label>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button type="button" onClick={() => setIsSelectInvolvedPartnersDialogOpen(false)}>
                            Confirmar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="isRecurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Custo Recorrente</FormLabel>
                      <FormDescription>
                        Indica se este é um custo que se repete regularmente.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit">Registrar Custo</Button>
                <Button type="button" variant="outline" onClick={() => addForm.reset({ category: 'outros', description: "", value: 0, date: new Date(), payerId: "", isRecurrent: false, involvedPartnerIds: [] })}>
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Ordenação</CardTitle>
          <CardDescription>
            Filtre e ordene os custos para uma melhor visualização.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterCategory">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {costCategories.map(cat => (
                    <SelectItem key={`filter-${cat.value}`} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterPayer">Pagador</Label>
              <Select value={filterPayerId} onValueChange={setFilterPayerId}>
                <SelectTrigger id="filterPayer">
                  <SelectValue placeholder="Todos os pagadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pagadores</SelectItem>
                  {partners.map((partner: Partner) => (
                    <SelectItem key={`filter-payer-${partner.id}`} value={partner.id}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterRecurrent">Recorrente</Label>
              <Select value={filterIsRecurrent} onValueChange={(value: "all" | "yes" | "no") => setFilterIsRecurrent(value)}>
                <SelectTrigger id="filterRecurrent">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Sim</SelectItem>
                  <SelectItem value="no">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortColumn">Ordenar por</Label>
              <div className="flex gap-2">
                <Select value={sortColumn || ""} onValueChange={(value: keyof Cost) => setSortColumn(value)}>
                  <SelectTrigger id="sortColumn">
                    <SelectValue placeholder="Coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Data</SelectItem>
                    <SelectItem value="value">Valor</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDirection} onValueChange={(value: "asc" | "desc") => setSortDirection(value)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Direção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <ArrowUpWideNarrow className="h-4 w-4" /> Crescente
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <ArrowDownWideNarrow className="h-4 w-4" /> Decrescente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custos Lançados</CardTitle>
          <CardDescription>
            Lista de todos os custos registrados e o status de pagamento de cada sócio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-right text-sm text-muted-foreground">
            Total de Custos (filtrados): <Badge variant="secondary">R$ {totalCosts.toFixed(2)}</Badge>
          </div>
          {filteredAndSortedCosts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum custo encontrado com os filtros aplicados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead>Envolvidos</TableHead> {/* New column */}
                    <TableHead>Recorrente</TableHead>
                    <TableHead className="text-center">Pagamentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{format(cost.date, "PPP", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cost.category.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}</Badge>
                      </TableCell>
                      <TableCell>{cost.description || '-'}</TableCell>
                      <TableCell className="text-right">R$ {cost.value.toFixed(2)}</TableCell>
                      <TableCell>{partners.find((p: Partner) => p.id === cost.payerId)?.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cost.involvedPartnerIds.map(id => (
                            <Badge key={id} variant="outline">
                              {partners.find(p => p.id === id)?.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cost.isRecurrent ? (
                          <Badge variant="outline">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {cost.payments.map((payment) => {
                            const partner = partners.find((p: Partner) => p.id === payment.partnerId);
                            return (
                              <Button
                                key={payment.partnerId}
                                className={cn(
                                  "flex items-center gap-1",
                                  payment.paid ? "button-success" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                )}
                                size="sm"
                                onClick={() => markCostPaymentAsPaid(cost.id, payment.partnerId)}
                              >
                                {payment.paid ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                                {partner?.name} (R$ {payment.amount.toFixed(2)})
                              </Button>
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
                            <DropdownMenuItem onClick={() => openEditDialog(cost)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(cost)} className="text-destructive">
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

      {/* Edit Cost Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Custo</DialogTitle>
            <DialogDescription>
              Faça alterações nos detalhes do custo aqui. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-4 py-4">
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
                        {costCategories.map(cat => (
                          <SelectItem key={`edit-${cat.value}`} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Breve descrição do custo" {...field} />
                    </FormControl>
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
                              format(field.value, "PPP", { locale: ptBR })
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
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="payerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador (Quem adiantou o valor total)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quem pagou este custo?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {partners.map((partner: Partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="involvedPartnerIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sócios Envolvidos (Quem divide o custo)</FormLabel>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSelectInvolvedPartnersDialogOpen(true)}
                        className="w-full justify-between"
                      >
                        {field.value.length > 0
                          ? `${field.value.length} sócio(s) selecionado(s)`
                          : "Selecionar sócios"}
                        <Users className="ml-2 h-4 w-4" />
                      </Button>
                    </FormControl>
                    <FormDescription>
                      Selecione os sócios que dividirão este custo.
                    </FormDescription>
                    <FormMessage />
                    <Dialog open={isSelectInvolvedPartnersDialogOpen} onOpenChange={setIsSelectInvolvedPartnersDialogOpen}>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Selecionar Sócios Envolvidos</DialogTitle>
                          <DialogDescription>
                            Marque os sócios que participarão da divisão deste custo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {partners.map((partner) => (
                            <div key={partner.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-partner-${partner.id}`}
                                checked={field.value.includes(partner.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, partner.id]);
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== partner.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`edit-partner-${partner.id}`}>{partner.name}</Label>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button type="button" onClick={() => setIsSelectInvolvedPartnersDialogOpen(false)}>
                            Confirmar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isRecurrent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Custo Recorrente</FormLabel>
                      <FormDescription>
                        Indica se este é um custo que se repete regularmente.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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

      {/* Delete Cost Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o custo{" "}
              <span className="font-semibold">{selectedCost?.description || selectedCost?.category}</span> e reverterá seu impacto financeiro.
              <br />
              <span className="font-bold text-red-500">
                Atenção: Custos com pagamentos já realizados não podem ser excluídos diretamente. Desfaça os pagamentos primeiro.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCost}
              disabled={selectedCost?.payments.some(p => p.paid)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Costs;