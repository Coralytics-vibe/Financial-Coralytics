"use client";

import { usePartners } from "@/context/PartnersContext";
import { useCosts } from "@/context/CostsContext";
import { useProfits } from "@/context/ProfitsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { partners } = usePartners();
  const { costs } = useCosts();
  const { profits } = useProfits();

  const totalCosts = costs.reduce((sum, cost) => sum + cost.value, 0);
  const totalProfits = profits.reduce((sum, profit) => sum + profit.value, 0);
  const netBalance = totalProfits - totalCosts;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Custos</CardTitle>
            <Badge variant="destructive">R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os custos registrados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lucros</CardTitle>
            <Badge variant="success">R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalProfits.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os lucros registrados.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <Badge variant={netBalance >= 0 ? "success" : "destructive"}>R$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {netBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lucros totais menos custos totais.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldos dos Sócios</CardTitle>
          <CardDescription>
            Visão geral do saldo individual de cada sócio.
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
                  <TableHead className="text-right">Participação</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="text-right">{partner.participation.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={partner.balance >= 0 ? "success" : "destructive"}>
                        R$ {partner.balance.toFixed(2)}
                      </Badge>
                    </TableCell>
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

export default Dashboard;