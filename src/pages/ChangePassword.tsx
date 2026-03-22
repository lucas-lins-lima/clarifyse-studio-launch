import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import logo from "@/assets/clarifyse-logo.png";

const ChangePassword = () => {
  const navigate = useNavigate();
  const changePassword = useAuthStore((s) => s.changePassword);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    changePassword(newPassword);
    toast.success("Senha alterada com sucesso!");
    navigate("/dashboard");
  };

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary geometric-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-accent/20" />
        <div className="absolute -right-10 top-1/4 h-40 w-40 rounded-full border border-secondary/20" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="Clarifyse" className="h-14 mb-2" />
        </div>

        <div className="card-studio p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
              <KeyRound size={24} className="text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Troca Obrigatória de Senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Por segurança, defina uma nova senha antes de continuar.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="label-caps">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="label-caps">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium"
            >
              Definir Nova Senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
