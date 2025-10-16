"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, CircleDashed } from "lucide-react";

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

import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "@/context/PartnersContext";
import { Cost, CostPayment, Partner } from "@/types"; // Import Partner type

const costSchema = z.object({
  category: z.enum(['site', 'provedor', 'banco_de_dados', 'outros'], {
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
  const { partners, updatePartnerBalance } = usePartners();
  const [costs, setCosts] = useState<Cost[]>([]);

  const form = useForm<z.infer<typeof costSchema>>({
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

  const onSubmit = (values: z.infer<typeof costSchema>) => {
    if (partners.length === 0) {
      showError("Adicione sócios antes de registrar custos.");
      return;
    }

    const costPerPartner = values.value / partners.length;
    const payments: CostPayment[] = partners.map((partner: Partner) => ({
      partnerId: partner.id,
      amount: costPerPartner,
      paid: false,
    }));

    const newCost: Cost = {
      id: crypto.randomUUID(),
      ...values,
      payments,
    };

    setCosts((prev) => [...prev, newCost]);
    
    // Update balances: Payer's balance increases by the total value
    updatePartnerBalance(values.payerId, values.value);

    showSuccess("Custo adicionado com sucesso!");
    form.reset({
      category: 'outros',
      description: "",
      value: 0,
      date: new Date(),
      payerId: "",
      isRecurrent: false,
    });
  };

  const handleMarkAsPaid = (costId: string, partnerId: string) => {
    setCosts((prevCosts) =>
      prevCosts.map((cost) =>
        cost.id === costId
          ? {
              ...cost,
              payments: cost.payments.map((payment: CostPayment) =>
                payment.partnerId === partnerId
                  ? { ...payment, paid: !payment.paid }
                  : payment
              ),
            }
          : cost
      )
    );

    // Adjust balances: If marked as paid, the partner's balance decreases by the amount they owed for this cost.
    // The payer's balance also decreases by the same amount (as they are "reimbursed").
    const cost = costs.find(c => c.id === costId);
    if (cost) {
      const payment = cost.payments.find((p: CostPayment) => p.partnerId === partnerId);
      if (payment) {
        const amount = payment.amount;
        const isCurrentlyPaid = payment.paid; // This is the state *before* the toggle

        if (!isCurrentlyPaid) { // If it was unpaid and is now marked as paid
          updatePartnerBalance(partnerId, -amount); // Partner's balance decreases (they paid their share)
          updatePartnerBalance(cost.payerId, -amount); // Payer's balance decreases (they received reimbursement)
          showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} pagou sua parte.`);
        } else { // If it was paid and is now marked as unpaid
          updatePartnerBalance(partnerId, amount); // Partner's balance increases (they are owed again)
          updatePartnerBalance(cost.payerId, amount); // Payer's balance increases (they are owed again)
          showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} teve o pagamento revertido.`);
        }
      }
    }
  };

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                        {partners.map((partner: Partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="site">Site</SelectItem>
                        <SelectItem value="provedor">Provedor</SelectItem>
                        <SelectItem value="banco_de_dados">Banco de Dados</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
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
              <Button type="submit">Registrar Custo</Button>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{format(cost.date, "PPP")}</TableCell>
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
                          {cost.payments.map((payment: CostPayment) => {
                            const partner = partners.find((p: Partner) => p.id === payment.partnerId);
                            return (
                              <Button
                                key={payment.partnerId}
                                variant={payment.paid ? "success" : "destructive"}
                                size="sm"
                                onClick={() => handleMarkAsPaid(cost.id, payment.partnerId)}
                                className="flex items-center gap-1"
                              >
                                {payment.paid ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                                {partner?.name} (R$ {payment.amount.toFixed(2)})
                              </Button>
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

export default Costs;