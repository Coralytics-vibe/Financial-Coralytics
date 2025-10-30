"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MadeWithDyad } from '@/components/made-with-dyad';

function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/coralytics-logo.png" alt="Coralytics Logo" className="mx-auto h-16 w-16 mb-4" />
          <CardTitle className="text-2xl font-bold">Bem-vindo ao Coralytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // Removendo provedores de terceiros por padrão
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                    brandButtonText: 'hsl(var(--primary-foreground))',
                    defaultButtonBackground: 'hsl(var(--secondary))',
                    defaultButtonBackgroundHover: 'hsl(var(--secondary-foreground))',
                    defaultButtonBorder: 'hsl(var(--border))',
                    defaultButtonText: 'hsl(var(--foreground))',
                    inputBackground: 'hsl(var(--input))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                    inputLabelText: 'hsl(var(--muted-foreground))',
                    messageText: 'hsl(var(--foreground))',
                    messageBackground: 'hsl(var(--background))',
                  },
                },
              },
            }}
            theme="light" // Usando tema claro
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Seu e-mail',
                  password_label: 'Sua senha',
                  email_input_placeholder: 'Digite seu e-mail',
                  password_input_placeholder: 'Digite sua senha',
                  button_label: 'Entrar',
                  link_text: 'Já tem uma conta? Entrar',
                  confirmation_text: 'Verifique seu e-mail para o link de confirmação', // Corrigido para confirmation_text
                },
                sign_up: {
                  email_label: 'Seu e-mail',
                  password_label: 'Crie uma senha',
                  email_input_placeholder: 'Digite seu e-mail',
                  password_input_placeholder: 'Crie sua senha',
                  button_label: 'Cadastrar',
                  link_text: 'Não tem uma conta? Cadastrar',
                  confirmation_text: 'Verifique seu e-mail para o link de confirmação', // Corrigido para confirmation_text
                },
                forgotten_password: {
                  email_label: 'Seu e-mail',
                  email_input_placeholder: 'Digite seu e-mail para redefinir a senha',
                  button_label: 'Enviar instruções de redefinição',
                  link_text: 'Esqueceu sua senha?',
                },
                update_password: {
                  password_label: 'Nova senha',
                  password_input_placeholder: 'Digite sua nova senha',
                  button_label: 'Atualizar senha',
                },
                magic_link: {
                  email_input_placeholder: 'Digite seu e-mail para o link mágico',
                  button_label: 'Enviar link mágico',
                  link_text: 'Enviar um link mágico por e-mail',
                },
              },
            }}
          />
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
}

export default Login;