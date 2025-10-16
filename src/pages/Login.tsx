"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function Login() {
  // Adicionando logs para depuração, acessando as variáveis de ambiente diretamente
  console.log('Supabase client in Login.tsx:', supabase);
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY (first few chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // You can add 'google', 'github', etc. here if needed
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Use light theme by default, can be dynamic
            redirectTo={window.location.origin + '/dashboard'}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;