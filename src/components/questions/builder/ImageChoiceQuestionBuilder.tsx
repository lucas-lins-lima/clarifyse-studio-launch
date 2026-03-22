import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageOption {
  id: string;
  label: string;
  code: string;
  imageUrl: string;
}

interface ImageChoiceQuestionBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const ImageChoiceQuestionBuilder: React.FC<ImageChoiceQuestionBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const options = question.options || [];
  const responseType = question.responseType || 'single';
  const columns = question.columns || 3;

  const handleAddOption = () => {
    const newOption: ImageOption = {
      id: `img_${Date.now()}`,
      label: `Opção ${options.length + 1}`,
      code: `opt_${options.length + 1}`,
      imageUrl: '',
    };
    onUpdate({ options: [...options, newOption] });
  };

  const handleUpdateOption = (id: string, updates: Partial<ImageOption>) => {
    const updated = options.map((o: ImageOption) => o.id === id ? { ...o, ...updates } : o);
    onUpdate({ options: updated });
  };

  const handleDeleteOption = (id: string) => {
    onUpdate({ options: options.filter((o: ImageOption) => o.id !== id) });
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      handleUpdateOption(id, { imageUrl: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Tipo de resposta */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-[#64748B]">TIPO DE RESPOSTA</Label>
        <Select 
          value={responseType} 
          onValueChange={(v) => onUpdate({ responseType: v })}
          disabled={isLocked}
        >
          <SelectTrigger className="h-10 rounded-lg border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="single">Escolha única</SelectItem>
            <SelectItem value="multiple">Múltipla escolha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Colunas */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-[#64748B]">COLUNAS NO GRID</Label>
        <Input
          type="number"
          min="1"
          max="6"
          value={columns}
          onChange={(e) => onUpdate({ columns: parseInt(e.target.value) || 3 })}
          className="h-10 rounded-lg border-gray-200"
          disabled={isLocked}
        />
      </div>

      {/* Opções com imagens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-[#64748B]">OPÇÕES COM IMAGENS</Label>
          <span className="text-xs text-[#1D9E75] font-bold">{options.length} opções</span>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {options.map((option: ImageOption) => (
            <div key={option.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <div className="flex gap-2 items-start mb-3">
                <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-2" />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Rótulo da opção"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(option.id, { label: e.target.value })}
                    className="h-8 text-xs rounded-lg border-gray-200"
                    disabled={isLocked}
                  />
                  <Input
                    placeholder="Código"
                    value={option.code}
                    onChange={(e) => handleUpdateOption(option.id, { code: e.target.value })}
                    className="h-8 text-xs rounded-lg border-gray-200 font-mono"
                    disabled={isLocked}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteOption(option.id)}
                  disabled={isLocked}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload de imagem */}
              <div className="ml-6 space-y-2">
                {option.imageUrl ? (
                  <div className="relative">
                    <img
                      src={option.imageUrl}
                      alt={option.label}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateOption(option.id, { imageUrl: '' })}
                      disabled={isLocked}
                      className="absolute -top-2 -right-2 bg-red-600 text-white hover:bg-red-700 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(option.id, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      disabled={isLocked}
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
                      <p className="text-xs text-[#64748B] font-bold">Clique para enviar imagem</p>
                      <p className="text-[10px] text-[#64748B]/60">JPG, PNG (máx. 2MB)</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={isLocked}
          className="w-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar opção com imagem
        </Button>
      </div>
    </div>
  );
};
