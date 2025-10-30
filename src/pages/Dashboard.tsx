"use client";

import { useState, useMemo } from "react";
import { usePartners } from "@/context/PartnersContext";
import { useCosts } from "@/context/CostsContext";
import { useProfits } from "@/context/ProfitsContext";
import { Link } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";

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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
}
from "recharts";
import { DateRangePicker } from "@/components/DateRangePicker";

const Dashboard = () => {
  const { partners } = usePartners();
  const { costs } = useCosts();
  const { profits } = useProfits();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filter costs and profits based on the selected date range
  const filteredCosts = useMemo(() => {
    if (!dateRange?.from) return costs;
    return costs.filter((cost) =>
      isWithinInterval(cost.date, {
        start: dateRange.from!, // Fixed: Assert dateRange.from is a Date
        end: dateRange.to || new Date(),
      })
    );
  }, [costs, dateRange]);

  const filteredProfits = useMemo(() => {
    if (!dateRange?.from) return profits;
    return profits.filter((profit) =>
      isWithinInterval(profit.date, {
        start: dateRange.from!, // Fixed: Assert dateRange.from is a Date
        end: dateRange.to || new Date(),
      })
    );
  }, [profits, dateRange]);

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.value, 0);
  const totalProfits = filteredProfits.reduce((sum, profit) => sum + profit.value, 0);
  const netBalance = totalProfits - totalCosts;

  const netProfitPercentage = totalCosts > 0 ? (netBalance / totalCosts) * 100 : 0;

  const chartData = [
    { name: "Custos", valor: totalCosts },
    { name: "Lucros", valor: totalProfits },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>

      <div className="flex justify-end mb-4">
        <DateRangePicker onDateRangeChange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/costs">
          <Card className="hover:shadow-lg transition-shadow">
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
        </Link>
        <Link to="/profits">
          <Card className="hover:shadow-lg transition-shadow">
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
        </Link>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucratividade</CardTitle>
            <Badge variant={netProfitPercentage >= 0 ? "success" : "destructive"}>%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netProfitPercentage.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Percentual de lucro líquido sobre os custos.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral Financeira</CardTitle>
          <CardDescription>
            Comparativo entre custos e lucros totais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="valor" fill="#8884d8" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                    <TableCell className="font-medium">
                      <Link to={`/partners/${partner.id}`} className="text-blue-600 hover:underline">
                        {partner.name}
                      </Link>
                    </TableCell>
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