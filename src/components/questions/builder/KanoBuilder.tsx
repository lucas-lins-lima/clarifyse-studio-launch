import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface KanoBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const KanoBuilder: React.FC<KanoBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const features = question.kanoFeatures || [];

  const handleAddFeature = () => {
    const newFeature = {
      id: `feat_${Date.now()}`,
      name: `Funcionalidade ${features.length + 1}`,
    };
    onUpdate({ kanoFeatures: [...features, newFeature] });
  };

  const handleUpdateFeature = (id: string, name: string) => {
    const updated = features.map((f: any) => f.id === id ? { ...f, name } : f);
    onUpdate({ kanoFeatures: updated });
  };

  const handleDeleteFeature = (id: string) => {
    onUpdate({ kanoFeatures: features.filter((f: any) => f.id !== id) });
  };

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-bold text-[#64748B]">ANÁLISE DE KANO — FUNCIONALIDADES</Label>
      <p className="text-xs text-muted-foreground">
        Para cada funcionalidade, o respondente responde duas perguntas: funcional (se tiver) e disfuncional (se não tiver).
        A classificação (Básico, Linear, Atrativo, Indiferente, Reverso) é gerada automaticamente.
      </p>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {features.map((feat: any) => (
          <div key={feat.id} className="flex gap-2 items-center">
            <Input
              value={feat.name}
              onChange={(e) => handleUpdateFeature(feat.id, e.target.value)}
              placeholder="Nome da funcionalidade"
              className="h-8 text-xs rounded-lg border-gray-200 flex-1"
              disabled={isLocked}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:bg-red-50"
              onClick={() => handleDeleteFeature(feat.id)}
              disabled={isLocked}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddFeature}
        disabled={isLocked}
        className="w-full text-xs"
      >
        <Plus className="h-3 w-3 mr-1" /> Adicionar Funcionalidade
      </Button>

      <div className="bg-green-50 p-3 rounded-lg border border-green-100">
        <p className="text-[10px] font-bold text-green-700 mb-1">CATEGORIAS KANO:</p>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-green-600">
          <span>🔵 Básico (Must-have)</span>
          <span>📈 Linear (Performance)</span>
          <span>✨ Atrativo (Delighter)</span>
          <span>⚪ Indiferente</span>
          <span>🔴 Reverso</span>
          <span>❓ Questionável</span>
        </div>
      </div>
    </div>
  );
};
