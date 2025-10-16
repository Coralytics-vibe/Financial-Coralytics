"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/partners"); // Redirect to the Partners page
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Carregando...</h1>
        <p className="text-xl text-gray-600">
          Redirecionando para o sistema financeiro.
        </p>
      </div>
    </div>
  );
};

export default Index;