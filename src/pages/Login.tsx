import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";
import logo from "@/assets/clarifyse-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addLog = useActivityStore((s) => s.addLog);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);

      if (!result.success) {
        setError(result.error || "Erro ao fazer login.");
        return;
      }

      const user = useAuthStore.getState().currentUser;
      if (user) {
        addLog({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: "login",
          details: "Usuário fez login no sistema",
        });

        if (user.firstLogin) {
          navigate("/trocar-senha");
        } else {
          navigate("/dashboard");
        }
      }
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary geometric-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-accent/20" />
        <div className="absolute -right-10 top-1/4 h-40 w-40 rounded-full border border-secondary/20" />
        <div className="absolute bottom-10 left-1/4 h-32 w-32 border border-accent/10 rotate-45" />
        <div className="absolute -bottom-16 right-1/3 h-48 w-48 rounded-full border-2 border-secondary/10" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="Clarifyse" className="h-14 mb-2" />
          <p className="label-caps text-primary-foreground/60">Strategy & Research</p>
        </div>

        <div className="card-studio p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse sua conta para gerenciar pesquisas
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="label-caps">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-caps">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground/30 border-t-secondary-foreground" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Entrar
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/40">
          Clarifyse Studio — Onde dados se transformam em clareza estratégica
        </p>
      </div>
    </div>
  );
};

export default Login;
