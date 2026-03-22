import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Mail, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  gerenteNome?: string | null;
}

export function SuporteSection({ gerenteNome }: Props) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings-suporte'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['email_suporte', 'whatsapp']);
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => { map[row.key] = row.value; });
      return map;
    },
    staleTime: 1000 * 60 * 30,
  });

  const email = settings?.['email_suporte'] || 'clarifysestrategyresearch@gmail.com';
  const whatsapp = settings?.['whatsapp'] || '5511993106662';
  const whatsappClean = whatsapp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}`;

  return (
    <div className="clarifyse-card p-5">
      <p className="clarifyse-section-label text-xs mb-0.5">SUPORTE</p>
      <h3 className="text-lg font-display font-semibold mb-1">Fale com a Clarifyse</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Dúvidas sobre seu projeto? Estamos disponíveis para acompanhá-lo em todas as etapas.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {gerenteNome && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
              <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Gerente Responsável</p>
                <p className="text-sm font-medium">{gerenteNome}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <a
                href={`mailto:${email}`}
                className="text-sm font-medium text-clarifyse-teal hover:underline truncate block"
              >
                {email}
              </a>
            </div>
          </div>

          <Button
            asChild
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              Falar pelo WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
