"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Cost } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CostCategoryPieChartProps {
  costs: Cost[];
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28DFF", "#FF6B6B", "#6BFF6B", "#6B6BFF",
  "#FFD700", "#ADFF2F", "#8A2BE2", "#DEB887", "#5F9EA0", "#7FFF00", "#D2691E", "#FF7F50"
];

const CostCategoryPieChart: React.FC<CostCategoryPieChartProps> = ({ costs }) => {
  const data = useMemo(() => {
    const categoryMap = new Map<string, number>();

    costs.forEach((cost) => {
      const categoryName = cost.category.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + cost.value);
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [costs]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos por Categoria</CardTitle>
          <CardDescription>
            Visão geral de como os custos estão distribuídos entre as categorias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum custo para exibir no gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Custos por Categoria</CardTitle>
        <CardDescription>
          Visão geral de como os custos estão distribuídos entre as categorias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostCategoryPieChart;