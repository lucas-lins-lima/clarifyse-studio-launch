import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MatrixRow {
  id: string;
  label: string;
  code: string;
}

interface MatrixColumn {
  id: string;
  label: string;
  value: number;
}

interface MatrixQuestionBuilderProps {
  question: any;
  onUpdate: (updates: any) => void;
  isLocked: boolean;
}

export const MatrixQuestionBuilder: React.FC<MatrixQuestionBuilderProps> = ({ question, onUpdate, isLocked }) => {
  const rows = question.rows || [];
  const columns = question.columns || [];
  const responseType = question.responseType || 'radio';

  const handleAddRow = () => {
    const newRow: MatrixRow = {
      id: `row_${Date.now()}`,
      label: `Linha ${rows.length + 1}`,
      code: `row_${rows.length + 1}`,
    };
    onUpdate({ rows: [...rows, newRow] });
  };

  const handleUpdateRow = (id: string, updates: Partial<MatrixRow>) => {
    const updated = rows.map((r: MatrixRow) => r.id === id ? { ...r, ...updates } : r);
    onUpdate({ rows: updated });
  };

  const handleDeleteRow = (id: string) => {
    onUpdate({ rows: rows.filter((r: MatrixRow) => r.id !== id) });
  };

  const handleAddColumn = () => {
    const newColumn: MatrixColumn = {
      id: `col_${Date.now()}`,
      label: `Coluna ${columns.length + 1}`,
      value: columns.length + 1,
    };
    onUpdate({ columns: [...columns, newColumn] });
  };

  const handleUpdateColumn = (id: string, updates: Partial<MatrixColumn>) => {
    const updated = columns.map((c: MatrixColumn) => c.id === id ? { ...c, ...updates } : c);
    onUpdate({ columns: updated });
  };

  const handleDeleteColumn = (id: string) => {
    onUpdate({ columns: columns.filter((c: MatrixColumn) => c.id !== id) });
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
            <SelectItem value="radio">Radio (uma por linha)</SelectItem>
            <SelectItem value="checkbox">Checkbox (múltiplas por linha)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Linhas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-[#64748B]">LINHAS</Label>
          <span className="text-xs text-[#1D9E75] font-bold">{rows.length} linhas</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {rows.map((row: MatrixRow, idx: number) => (
            <div key={row.id} className="flex gap-2 items-end">
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-2" />
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Rótulo da linha"
                  value={row.label}
                  onChange={(e) => handleUpdateRow(row.id, { label: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200"
                  disabled={isLocked}
                />
              </div>
              <div className="w-24 space-y-1">
                <Input
                  placeholder="Código"
                  value={row.code}
                  onChange={(e) => handleUpdateRow(row.id, { code: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200 font-mono"
                  disabled={isLocked}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteRow(row.id)}
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
          onClick={handleAddRow}
          disabled={isLocked}
          className="w-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar linha
        </Button>
      </div>

      {/* Colunas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold text-[#64748B]">COLUNAS</Label>
          <span className="text-xs text-[#1D9E75] font-bold">{columns.length} colunas</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {columns.map((col: MatrixColumn) => (
            <div key={col.id} className="flex gap-2 items-end">
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-2" />
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Rótulo da coluna"
                  value={col.label}
                  onChange={(e) => handleUpdateColumn(col.id, { label: e.target.value })}
                  className="h-8 text-xs rounded-lg border-gray-200"
                  disabled={isLocked}
                />
              </div>
              <div className="w-20 space-y-1">
                <Input
                  type="number"
                  placeholder="Valor"
                  value={col.value}
                  onChange={(e) => handleUpdateColumn(col.id, { value: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs rounded-lg border-gray-200 font-mono"
                  disabled={isLocked}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteColumn(col.id)}
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
          onClick={handleAddColumn}
          disabled={isLocked}
          className="w-full text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar coluna
        </Button>
      </div>
    </div>
  );
};
