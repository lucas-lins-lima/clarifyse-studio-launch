import { TrendingUp } from "lucide-react";

const Analyses = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Análises</h1>
        <p className="text-sm text-muted-foreground">
          Análises estatísticas avançadas — disponível na Fase 2
        </p>
      </div>
      <div className="card-studio flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
          <TrendingUp size={32} className="text-secondary" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Módulo de Análises
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          O módulo de análises estatísticas avançadas estará disponível na Fase 2 da plataforma. Inclui relatórios automáticos, análise de correlações, exportação de relatórios e integrações com o Clarifyse Insights.
        </p>
      </div>
    </div>
  );
};

export default Analyses;
