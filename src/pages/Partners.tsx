"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";

const partnerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
});

type Partner = z.infer<typeof partnerSchema> & {
  id: string;
  participation: number;
};

const Partners = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const form = useForm<z.infer<typeof partnerSchema>>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    // Recalculate participation whenever partners change
    if (partners.length > 0) {
      const newParticipation = 100 / partners.length;
      setPartners((prevPartners) =>
        prevPartners.map((p) => ({ ...p, participation: newParticipation }))
      );
    }
  }, [partners.length]);

  const onSubmit = (values: z.infer<typeof partnerSchema>) => {
    const newPartner: Partner = {
      id: crypto.randomUUID(),
      ...values,
      participation: 0, // Will be recalculated by useEffect
    };
    setPartners((prev) => [...prev, newPartner]);
    form.reset();
    showSuccess("Sócio adicionado com sucesso!");
  };

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
          {partners.length === 0 ? (
            <p className="text-muted-foreground">Nenhum sócio cadastrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Participação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell className="text-right">{partner.participation.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Partners;