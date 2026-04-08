import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VanWestendorpBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const VanWestendorpBuilder: React.FC<VanWestendorpBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const config = question.vanwestendorp || {
    productName: '',
    currency: 'R$',
    minPrice: 0,
    maxPrice: 1000,
    step: 10,
  };

  const handleUpdate = (updates: any) => {
    onUpdate({ vanwestendorp: { ...config, ...updates } });
  };

  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-bold text-[#64748B]">CONFIGURAÇÃO VAN WESTENDORP (PSM)</Label>
      <p className="text-xs text-muted-foreground">
        O respondente responderá 4 perguntas de preço: muito barato, barato, caro e muito caro.
        As curvas são geradas automaticamente na análise.
      </p>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold text-[#64748B]">NOME DO PRODUTO/SERVIÇO</Label>
          <Input
            value={config.productName}
            onChange={(e) => handleUpdate({ productName: e.target.value })}
            placeholder="Ex: Plano Premium"
            className="h-8 text-xs rounded-lg border-gray-200"
            disabled={isLocked}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-[#64748B]">MOEDA</Label>
            <Input
              value={config.currency}
              onChange={(e) => handleUpdate({ currency: e.target.value })}
              className="h-8 text-xs rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-[#64748B]">PREÇO MÍN</Label>
            <Input
              type="number"
              value={config.minPrice}
              onChange={(e) => handleUpdate({ minPrice: Number(e.target.value) })}
              className="h-8 text-xs rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-[#64748B]">PREÇO MÁX</Label>
            <Input
              type="number"
              value={config.maxPrice}
              onChange={(e) => handleUpdate({ maxPrice: Number(e.target.value) })}
              className="h-8 text-xs rounded-lg border-gray-200"
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
        <p className="text-[10px] font-bold text-blue-700 mb-1">PERGUNTAS GERADAS AUTOMATICAMENTE:</p>
        <ul className="text-[10px] text-blue-600 space-y-1">
          <li>1. A que preço você consideraria <b>muito barato</b> (desconfiaria da qualidade)?</li>
          <li>2. A que preço você consideraria <b>barato</b> (boa oferta)?</li>
          <li>3. A que preço você consideraria <b>caro</b> (mas ainda compraria)?</li>
          <li>4. A que preço você consideraria <b>muito caro</b> (não compraria)?</li>
        </ul>
      </div>
    </div>
  );
};
