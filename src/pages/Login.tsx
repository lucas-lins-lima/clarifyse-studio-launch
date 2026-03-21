import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/assets/clarifyse-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulated login - will be replaced with Supabase Auth
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary geometric-bg">
      {/* Decorative geometric elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-accent/20" />
        <div className="absolute -right-10 top-1/4 h-40 w-40 rounded-full border border-secondary/20" />
        <div className="absolute bottom-10 left-1/4 h-32 w-32 border border-accent/10 rotate-45" />
        <div className="absolute -bottom-16 right-1/3 h-48 w-48 rounded-full border-2 border-secondary/10" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="Clarifyse" className="h-14 mb-2" />
          <p className="label-caps text-primary-foreground/60">Strategy & Research</p>
        </div>

        {/* Login Card */}
        <div className="card-studio p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao Studio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse sua conta para gerenciar pesquisas
            </p>
          </div>

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

          <div className="mt-6 text-center">
            <button className="text-sm text-accent hover:text-accent/80 transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-primary-foreground/40">
          Clarifyse Studio — Onde dados se transformam em clareza estratégica
        </p>
      </div>
    </div>
  );
};

export default Login;
