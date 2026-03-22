import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface ConjointAttribute {
  id: string;
  name: string;
  levels: Array<{ id: string; label: string; code: string; value: number }>;
}

interface ConjointQuestionBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const ConjointQuestionBuilder: React.FC<ConjointQuestionBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const attributes = question.attributes || [];
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);

  const handleAddAttribute = () => {
    const newAttr: ConjointAttribute = {
      id: `attr_${Date.now()}`,
      name: `Atributo ${attributes.length + 1}`,
      levels: [
        { id: `lvl_1`, label: 'Nível 1', code: 'lvl_1', value: 0 },
        { id: `lvl_2`, label: 'Nível 2', code: 'lvl_2', value: 1 },
      ],
    };
    onUpdate({ attributes: [...attributes, newAttr] });
  };

  const handleUpdateAttribute = (id: string, updates: Partial<ConjointAttribute>) => {
    const updated = attributes.map((a: ConjointAttribute) => a.id === id ? { ...a, ...updates } : a);
    onUpdate({ attributes: updated });
  };

  const handleDeleteAttribute = (id: string) => {
    onUpdate({ attributes: attributes.filter((a: ConjointAttribute) => a.id !== id) });
  };

  const handleAddLevel = (attrId: string) => {
    const attr = attributes.find((a: ConjointAttribute) => a.id === attrId);
    if (!attr) return;
    const newLevel = {
      id: `lvl_${Date.now()}`,
      label: `Nível ${attr.levels.length + 1}`,
      code: `lvl_${attr.levels.length + 1}`,
      value: attr.levels.length,
    };
    handleUpdateAttribute(attrId, { levels: [...attr.levels, newLevel] });
  };

  const handleUpdateLevel = (attrId: string, levelId: string, updates: any) => {
    const attr = attributes.find((a: ConjointAttribute) => a.id === attrId);
    if (!attr) return;
    const updated = attr.levels.map((l: any) => l.id === levelId ? { ...l, ...updates } : l);
    handleUpdateAttribute(attrId, { levels: updated });
  };

  const handleDeleteLevel = (attrId: string, levelId: string) => {
    const attr = attributes.find((a: ConjointAttribute) => a.id === attrId);
    if (!attr) return;
    const updated = attr.levels.filter((l: any) => l.id !== levelId);
    handleUpdateAttribute(attrId, { levels: updated });
  };

  const handleGenerateTasks = () => {
    // Gerar tarefas automaticamente
    const numTasks = Math.min(8, Math.pow(2, attributes.length));
    const tasks = Array.from({ length: numTasks }, (_, i) => ({
      id: `task_${i}`,
      options: attributes.map((attr: ConjointAttribute) => ({
        attrId: attr.id,
        levelId: attr.levels[i % attr.levels.length]?.id,
      })),
    }));
    onUpdate({ tasks });
  };

  return (
    <div className="space-y-6">
      {/* Atributos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-[#64748B]">ATRIBUTOS</Label>
          <span className="text-xs text-[#1D9E75] font-bold">{attributes.length} atributos</span>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {attributes.map((attr: ConjointAttribute) => (
            <div key={attr.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 items-center mb-3">
                <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                <Input
                  placeholder="Nome do atributo"
                  value={attr.name}
                  onChange={(e) => handleUpdateAttribute(attr.id, { name: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200 flex-1"
                  disabled={isLocked}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteAttribute(attr.id)}
                  disabled={isLocked}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Níveis do atributo */}
              <div className="ml-6 space-y-2">
                <p className="text-[10px] font-bold text-[#64748B]">NÍVEIS ({attr.levels.length})</p>
                {attr.levels.map((level: any) => (
                  <div key={level.id} className="flex gap-2 items-end">
                    <Input
                      placeholder="Rótulo"
                      value={level.label}
                      onChange={(e) => handleUpdateLevel(attr.id, level.id, { label: e.target.value })}
                      className="h-7 text-xs rounded border-gray-200 flex-1"
                      disabled={isLocked}
                    />
                    <Input
                      placeholder="Código"
                      value={level.code}
                      onChange={(e) => handleUpdateLevel(attr.id, level.id, { code: e.target.value })}
                      className="h-7 text-xs rounded border-gray-200 w-20 font-mono"
                      disabled={isLocked}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteLevel(attr.id, level.id)}
                      disabled={isLocked}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddLevel(attr.id)}
                  disabled={isLocked}
                  className="w-full text-xs mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar nível
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddAttribute}
          disabled={isLocked}
          className="w-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar atributo
        </Button>
      </div>

      {/* Gerar tarefas */}
      {attributes.length > 0 && (
        <Button
          onClick={handleGenerateTasks}
          disabled={isLocked}
          className="w-full bg-[#1D9E75] text-white rounded-lg font-bold"
        >
          Gerar Tarefas Automaticamente
        </Button>
      )}
    </div>
  );
};
