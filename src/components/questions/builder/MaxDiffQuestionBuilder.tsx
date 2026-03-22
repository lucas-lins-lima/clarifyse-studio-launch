import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface MaxDiffItem {
  id: string;
  label: string;
  code: string;
}

interface MaxDiffQuestionBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const MaxDiffQuestionBuilder: React.FC<MaxDiffQuestionBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const items = question.items || [];
  const setSize = question.setSize || 4;
  const numSets = question.numSets || 3;

  const handleAddItem = () => {
    const newItem: MaxDiffItem = {
      id: `item_${Date.now()}`,
      label: `Item ${items.length + 1}`,
      code: `item_${items.length + 1}`,
    };
    onUpdate({ items: [...items, newItem] });
  };

  const handleUpdateItem = (id: string, updates: Partial<MaxDiffItem>) => {
    const updated = items.map((i: MaxDiffItem) => i.id === id ? { ...i, ...updates } : i);
    onUpdate({ items: updated });
  };

  const handleDeleteItem = (id: string) => {
    onUpdate({ items: items.filter((i: MaxDiffItem) => i.id !== id) });
  };

  const handleGenerateSets = () => {
    // Gerar conjuntos balanceados
    const sets = [];
    const itemIds = items.map((i: MaxDiffItem) => i.id);
    
    for (let s = 0; s < numSets; s++) {
      const setItems = [];
      for (let i = 0; i < setSize && i < itemIds.length; i++) {
        setItems.push(itemIds[(s * setSize + i) % itemIds.length]);
      }
      if (setItems.length === setSize) {
        sets.push({
          id: `set_${s}`,
          items: setItems,
        });
      }
    }
    
    onUpdate({ sets });
  };

  return (
    <div className="space-y-6">
      {/* Itens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-[#64748B]">ITENS</Label>
          <span className="text-xs text-[#1D9E75] font-bold">{items.length} itens</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item: MaxDiffItem) => (
            <div key={item.id} className="flex gap-2 items-end">
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-2" />
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Rótulo do item"
                  value={item.label}
                  onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200"
                  disabled={isLocked}
                />
              </div>
              <div className="w-24 space-y-1">
                <Input
                  placeholder="Código"
                  value={item.code}
                  onChange={(e) => handleUpdateItem(item.id, { code: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200 font-mono"
                  disabled={isLocked}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteItem(item.id)}
                disabled={isLocked}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={isLocked}
          className="w-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar item
        </Button>
      </div>

      {/* Configuração de conjuntos */}
      <div className="space-y-4">
        <Label className="text-[10px] font-bold text-[#64748B]">CONFIGURAÇÃO DOS CONJUNTOS</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] text-[#64748B]">Itens por conjunto</Label>
            <Input
              type="number"
              min="3"
              max="10"
              value={setSize}
              onChange={(e) => onUpdate({ setSize: parseInt(e.target.value) || 4 })}
              className="h-10 rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] text-[#64748B]">Número de conjuntos</Label>
            <Input
              type="number"
              min="1"
              max="20"
              value={numSets}
              onChange={(e) => onUpdate({ numSets: parseInt(e.target.value) || 3 })}
              className="h-10 rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      {/* Gerar conjuntos */}
      {items.length >= setSize && (
        <Button
          onClick={handleGenerateSets}
          disabled={isLocked}
          className="w-full bg-[#1D9E75] text-white rounded-lg font-bold"
        >
          Gerar Conjuntos Automaticamente
        </Button>
      )}
    </div>
  );
};
