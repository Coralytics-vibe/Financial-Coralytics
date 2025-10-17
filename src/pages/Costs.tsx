"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, CircleDashed, MoreHorizontal } from "lucide-react";

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

import { cn } from "@/lib/utils";
import { usePartners } from "@/context/PartnersContext";
import { useCosts } from "@/context/CostsContext";
import { Partner, Cost, DocumentMetadata } from "@/types";
import DocumentUpload from "@/components/DocumentUpload"; // Import the new component
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import { showSuccess, showError } from "@/utils/toast";

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
});

const Costs = () => {
  const { partners } = usePartners();
  const { costs, addCost, markCostPaymentAsPaid, editCost, deleteCost } = useCosts();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [costDocuments, setCostDocuments] = useState<DocumentMetadata[]>([]);

  const addForm = useForm<z.infer<typeof costSchema>>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
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
    },
  });

  const fetchDocuments = useCallback(async (associatedId: string) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('associated_id', associatedId);

    if (error) {
      console.error("Error fetching documents:", error);
      showError("Erro ao carregar documentos.");
      return [];
    }
    return data as DocumentMetadata[];
  }, []);

  useEffect(() => {
    if (isEditDialogOpen && selectedCost) {
      editForm.reset({
        category: selectedCost.category,
        description: selectedCost.description,
        value: selectedCost.value,
        date: selectedCost.date,
        payerId: selectedCost.payerId,
        isRecurrent: selectedCost.isRecurrent,
      });
      fetchDocuments(selectedCost.id).then(setCostDocuments);
    } else {
      setCostDocuments([]); // Clear documents when dialog closes
    }
  }, [isEditDialogOpen, selectedCost, editForm, fetchDocuments]);

  const onAddSubmit = (values: z.infer<typeof costSchema>) => {
    addCost(
      values.category,
      values.description,
      values.value,
      values.date,
      values.payerId,
      values.isRecurrent
    );
    addForm.reset({
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
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
        values.isRecurrent
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

  const handleDocumentUploadSuccess = (newDoc: DocumentMetadata) => {
    setCostDocuments((prev) => [...prev, newDoc]);
    showSuccess("Documento anexado com sucesso!");
  };

  const handleDocumentDeleteSuccess = (deletedDocId: string) => {
    setCostDocuments((prev) => prev.filter((doc) => doc.id !== deletedDocId));
    showSuccess("Documento removido com sucesso!");
  };

  const totalCosts = costs.reduce((sum, cost) => sum + cost.value, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestão de Custos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Custo</CardTitle>
          <CardDescription>
            Registre um novo custo e ele será dividido igualmente entre os sócios.
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
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="provedor">Provedor</SelectItem>
                        <SelectItem value="banco_de_dados">Banco de Dados</SelectItem>
                        <SelectItem value="implantacao">Implantação</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="atualizacao">Atualização</SelectItem>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="transacao">Transação</SelectItem>
                        <SelectItem value="imposto">Imposto</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
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
                    <FormLabel>Pagador</FormLabel>
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
                <Button type="button" variant="outline" onClick={() => addForm.reset({ category: 'outros', description: "", value: 0, date: new Date(), payerId: "", isRecurrent: false })}>
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
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
            Total de Custos: <Badge variant="secondary">R$ {totalCosts.toFixed(2)}</Badge>
          </div>
          {costs.length === 0 ? (
            <p className="text-muted-foreground">Nenhum custo registrado ainda.</p>
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
                    <TableHead>Recorrente</TableHead>
                    <TableHead className="text-center">Pagamentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{format(cost.date, "PPP", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cost.category.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}</Badge>
                      </TableCell>
                      <TableCell>{cost.description || '-'}</TableCell>
                      <TableCell className="text-right">R$ {cost.value.toFixed(2)}</TableCell>
                      <TableCell>{partners.find((p: Partner) => p.id === cost.payerId)?.name}</TableCell>
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
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="provedor">Provedor</SelectItem>
                        <SelectItem value="banco_de_dados">Banco de Dados</SelectItem>
                        <SelectItem value="implantacao">Implantação</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="atualizacao">Atualização</SelectItem>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="transacao">Transação</SelectItem>
                        <SelectItem value="imposto">Imposto</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
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
                    <FormLabel>Pagador</FormLabel>
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
              {selectedCost && (
                <DocumentUpload
                  associatedId={selectedCost.id}
                  documentType="invoice" // Default type for costs, can be made dynamic
                  onUploadSuccess={handleDocumentUploadSuccess}
                  onDeleteSuccess={handleDocumentDeleteSuccess}
                  existingDocuments={costDocuments}
                />
              )}
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