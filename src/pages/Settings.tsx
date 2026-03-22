import { Settings2 } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configurações globais da plataforma — disponível na Fase 2
        </p>
      </div>
      <div className="card-studio flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Settings2 size={32} className="text-accent" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
          Configurações Globais
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          O módulo de configurações globais — incluindo personalização da plataforma, domínio customizado, integrações e gestão de conta — estará disponível na Fase 2 da plataforma.
        </p>
      </div>
    </div>
  );
};

export default Settings;
