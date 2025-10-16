"use client";

import { useParams, Link } from "react-router-dom";
import { usePartners } from "@/context/PartnersContext";
import { useCosts } from "@/context/CostsContext";
import { useProfits } from "@/context/ProfitsContext";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

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
import { Button } from "@/components/ui/button";

const PartnerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { partners } = usePartners();
  const { costs } = useCosts();
  const { profits } = useProfits();

  const partner = partners.find((p) => p.id === id);

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Sócio não encontrado</h1>
          <p className="text-xl text-gray-600 mb-4">
            O sócio com o ID fornecido não foi encontrado.
          </p>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-700 underline">
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const partnerCosts = costs.filter(
    (cost) =>
      cost.payerId === partner.id ||
      cost.payments.some((payment) => payment.partnerId === partner.id)
  );

  const partnerProfits = profits.filter((profit) =>
    profit.distributions.some((dist) => dist.partnerId === partner.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Detalhes do Sócio: {partner.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sócio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>E-mail:</strong> {partner.email}
            </p>
            <p>
              <strong>Telefone:</strong> {partner.phone || "Não informado"}
            </p>
            <p>
              <strong>Documento:</strong> {partner.document || "Não informado"}
            </p>
            <p>
              <strong>Participação:</strong> {partner.participation.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={partner.balance >= 0 ? "success" : "destructive"}>
                R$ {partner.balance.toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Saldo individual do sócio.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custos Envolvidos</CardTitle>
          <CardDescription>
            Custos em que {partner.name} é o pagador ou tem participação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerCosts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum custo encontrado para este sócio.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Pagador</TableHead>
                    <TableHead className="text-center">Status de Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerCosts.map((cost) => {
                    const isPayer = cost.payerId === partner.id;
                    const paymentStatus = cost.payments.find(p => p.partnerId === partner.id);
                    const partnerShare = paymentStatus ? paymentStatus.amount : 0;

                    return (
                      <TableRow key={cost.id}>
                        <TableCell>{format(cost.date, "PPP")}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cost.category.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>{cost.description || '-'}</TableCell>
                        <TableCell className="text-right">R$ {cost.value.toFixed(2)}</TableCell>
                        <TableCell>
                          {isPayer ? (
                            <Badge variant="default">Pagador</Badge>
                          ) : (
                            partners.find(p => p.id === cost.payerId)?.name
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {paymentStatus ? (
                            <Badge variant={paymentStatus.paid ? "success" : "destructive"}>
                              {paymentStatus.paid ? "Pago" : `Devendo R$ ${partnerShare.toFixed(2)}`}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não Aplicável</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lucros Distribuídos</CardTitle>
          <CardDescription>
            Lucros em que {partner.name} recebeu uma distribuição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerProfits.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lucro encontrado para este sócio.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerProfits.map((profit) => {
                    const distribution = profit.distributions.find(
                      (dist) => dist.partnerId === partner.id
                    );
                    return (
                      <TableRow key={profit.id}>
                        <TableCell>{format(profit.date, "PPP")}</TableCell>
                        <TableCell>{profit.source}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {profit.category.charAt(0).toUpperCase() + profit.category.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {profit.value.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success">
                            R$ {distribution ? distribution.amount.toFixed(2) : "0.00"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDetails;