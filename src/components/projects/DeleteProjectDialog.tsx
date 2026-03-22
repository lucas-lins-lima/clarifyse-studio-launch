import React, { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  projectName: string;
  onConfirm: () => Promise<void>;
  mode?: 'trash' | 'permanent';
}

export function DeleteProjectDialog({ open, onClose, projectName, onConfirm, mode = 'trash' }: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (mode === 'permanent' && confirmText !== projectName) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
      setConfirmText('');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={v => !v && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {mode === 'permanent' ? 'Excluir Permanentemente' : 'Mover para a Lixeira'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {mode === 'trash' ? (
                <p>
                  O projeto <strong>"{projectName}"</strong> será movido para a lixeira. Você poderá
                  restaurá-lo em até <strong>15 dias</strong>.
                </p>
              ) : (
                <>
                  <p>
                    Esta ação é <strong>irreversível</strong>. O projeto <strong>"{projectName}"</strong>{' '}
                    e todos os seus dados serão excluídos permanentemente.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-delete">
                      Digite o nome do projeto para confirmar:
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder={projectName}
                    />
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || (mode === 'permanent' && confirmText !== projectName)}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'permanent' ? 'Excluir Permanentemente' : 'Mover para Lixeira'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
