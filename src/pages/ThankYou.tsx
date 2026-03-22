import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import logo from "@/assets/clarifyse-logo.png";

const ThankYou = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const projects = useProjectStore((s) => s.projects);
  const project = useMemo(() => projects.find((p) => p.slug === slug), [projects, slug]);

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">O formulário que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-secondary text-center">
          <div className="mb-6">
            <img src={logo} alt="Clarifyse" className="h-12 mx-auto" />
          </div>

          <div className="mb-6">
            <CheckCircle2 size={64} className="text-secondary mx-auto" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Resposta Enviada!
          </h1>

          <p className="text-muted-foreground mb-6">
            {project.settings.thankYouMessage}
          </p>

          <p className="text-sm text-muted-foreground mb-8">
            Obrigado por participar da pesquisa. Seus dados foram armazenados com segurança.
          </p>

          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
