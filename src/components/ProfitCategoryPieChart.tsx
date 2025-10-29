"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Profit } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProfitCategoryPieChartProps {
  profits: Profit[];
}

const COLORS = [
  "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#FF5722", "#00BCD4", "#8BC34A", "#E91E63"
];

const ProfitCategoryPieChart: React.FC<ProfitCategoryPieChartProps> = ({ profits }) => {
  const data = useMemo(() => {
    const categoryMap = new Map<string, number>();

    profits.forEach((profit) => {
      const categoryName = profit.category.charAt(0).toUpperCase() + profit.category.slice(1);
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + profit.value);
    });

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [profits]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Lucros por Categoria</CardTitle>
          <CardDescription>
            Visão geral de como os lucros estão distribuídos entre as categorias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum lucro para exibir no gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Lucros por Categoria</CardTitle>
        <CardDescription>
          Visão geral de como os lucros estão distribuídos entre as categorias.
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

export default ProfitCategoryPieChart;