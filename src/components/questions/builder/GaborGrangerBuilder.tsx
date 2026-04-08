import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface GaborGrangerBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const GaborGrangerBuilder: React.FC<GaborGrangerBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const config = question.gaborGranger || {
    productName: '',
    currency: 'R$',
    pricePoints: [49.90, 69.90, 89.90, 109.90, 129.90],
  };

  const handleUpdate = (updates: any) => {
    onUpdate({ gaborGranger: { ...config, ...updates } });
  };

  const handleAddPrice = () => {
    const last = config.pricePoints[config.pricePoints.length - 1] || 0;
    handleUpdate({ pricePoints: [...config.pricePoints, last + 20] });
  };

  const handleRemovePrice = (idx: number) => {
    handleUpdate({ pricePoints: config.pricePoints.filter((_: any, i: number) => i !== idx) });
  };

  const handleUpdatePrice = (idx: number, value: number) => {
    const updated = [...config.pricePoints];
    updated[idx] = value;
    handleUpdate({ pricePoints: updated });
  };

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-bold text-[#64748B]">GABOR-GRANGER PRICING</Label>
      <p className="text-xs text-muted-foreground">
        O respondente avalia sua intenção de compra em cada nível de preço sequencialmente, gerando uma curva de demanda.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-[#64748B]">PRODUTO</Label>
            <Input
              value={config.productName}
              onChange={(e) => handleUpdate({ productName: e.target.value })}
              placeholder="Nome do produto"
              className="h-8 text-xs rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-[#64748B]">MOEDA</Label>
            <Input
              value={config.currency}
              onChange={(e) => handleUpdate({ currency: e.target.value })}
              className="h-8 text-xs rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
        </div>

        <Label className="text-[10px] font-bold text-[#64748B]">PONTOS DE PREÇO</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {config.pricePoints.map((price: number, idx: number) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground w-8">{idx + 1}.</span>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => handleUpdatePrice(idx, Number(e.target.value))}
                className="h-7 text-xs rounded border-gray-200 flex-1"
                disabled={isLocked}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600 hover:bg-red-50"
                onClick={() => handleRemovePrice(idx)}
                disabled={isLocked}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddPrice} disabled={isLocked} className="w-full text-xs">
          <Plus className="h-3 w-3 mr-1" /> Adicionar Preço
        </Button>
      </div>
    </div>
  );
};
