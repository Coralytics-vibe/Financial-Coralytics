"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MoreHorizontal } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import { usePartners } from "@/context/PartnersContext";
import { Partner } from "@/types";

const partnerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().optional(),
  document: z.string().optional(),
  participation: z.preprocess(
    (val) => Number(String(val).replace(',', '.')),
    z.number().min(0.01, "A participação deve ser maior que zero.").max(100, "A participação não pode exceder 100%.")
  ),
}).refine((_data) => { // Renamed 'data' to '_data' to fix TS6133
  // Custom validation for total participation will be handled in context or onSubmit
  return true;
}, {
  message: "A soma das participações não pode exceder 100%.",
  path: ["participation"], // This path might need adjustment if applied globally
});


const Partners = () => {
  const { partners, addPartner, editPartner, deletePartner, getTotalParticipation } = usePartners();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const addForm = useForm<z.infer<typeof partnerSchema>>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      participation: 0,
    },
  });

  const editForm = useForm<z.infer<typeof partnerSchema>>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      participation: 0,
    },
  });

  const onAddSubmit = (values: z.infer<typeof partnerSchema>) => {
    const currentTotalParticipation = getTotalParticipation();
    if (currentTotalParticipation + values.participation > 100) {
      addForm.setError("participation", { message: `A soma das participações não pode exceder 100%. Total atual: ${currentTotalParticipation.toFixed(2)}%` });
      return;
    }
    addPartner(values.name, values.email, values.phone, values.document, values.participation);
    addForm.reset();
  };

  const onEditSubmit = (values: z.infer<typeof partnerSchema>) => {
    if (selectedPartner) {
      const otherPartnersParticipation = partners
        .filter(p => p.id !== selectedPartner.id)
        .reduce((sum, p) => sum + p.participation, 0);
      
      if (otherPartnersParticipation + values.participation > 100) {
        editForm.setError("participation", { message: `A soma das participações não pode exceder 100%. Total dos outros sócios: ${otherPartnersParticipation.toFixed(2)}%` });
        return;
      }

      editPartner(selectedPartner.id, values.name, values.email, values.phone, values.document, values.participation);
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
    }
  };

  const handleDeletePartner = () => {
    if (selectedPartner) {
      deletePartner(selectedPartner.id);
      setIsDeleteDialogOpen(false);
      setSelectedPartner(null);
    }
  };

  const openEditDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    editForm.reset({ 
      name: partner.name, 
      email: partner.email, 
      phone: partner.phone || "", 
      document: partner.document || "", 
      participation: partner.participation 
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDeleteDialogOpen(true);
  };

  const totalParticipation = getTotalParticipation();
  const remainingParticipation = 100 - totalParticipation;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cadastro de Sócios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Sócio</CardTitle>
          <CardDescription>
            Preencha os dados do novo sócio para adicioná-lo ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do sócio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(XX) XXXXX-XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="XXX.XXX.XXX-XX ou XX.XXX.XXX/XXXX-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="participation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participação (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Adicionar Sócio</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sócios Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os sócios e seus percentuais de participação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Total de Participação Distribuída:{" "}
              <Badge variant={totalParticipation > 100 ? "destructive" : "secondary"}>
                {totalParticipation.toFixed(2)}%
              </Badge>
            </p>
            {remainingParticipation !== 0 && (
              <p className="text-sm text-muted-foreground">
                {remainingParticipation > 0 ? "Falta distribuir" : "Excedente"}:{" "}
                <Badge variant={remainingParticipation < 0 ? "destructive" : "outline"}>
                  {remainingParticipation.toFixed(2)}%
                </Badge>
              </p>
            )}
          </div>
          {partners.length === 0 ? (
            <p className="text-muted-foreground">Nenhum sócio cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="text-right">Participação</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner: Partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.email}</TableCell>
                      <TableCell>{partner.phone || '-'}</TableCell>
                      <TableCell>{partner.document || '-'}</TableCell>
                      <TableCell className="text-right">{partner.participation.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">R$ {partner.balance.toFixed(2)}</TableCell>
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
                            <DropdownMenuItem onClick={() => openEditDialog(partner)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(partner)} className="text-destructive">
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

      {/* Edit Partner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Sócio</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados do sócio aqui. Clique em salvar quando terminar.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="grid gap-4 py-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="participation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participação (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
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

      {/* Delete Partner Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o sócio{" "}
              <span className="font-semibold">{selectedPartner?.name}</span> e removerá seus dados do nosso sistema.
              <br />
              <span className="font-bold text-red-500">
                Atenção: Sócios com saldo diferente de zero não podem ser excluídos.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePartner} disabled={selectedPartner?.balance !== 0} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Partners;