import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/db';

interface AutoSaveOptions {
  formId: string;
  data: any;
  enabled?: boolean;
  interval?: number;
}

/**
 * ✅ FIX: Auto-save form changes to prevent data loss
 * - Saves periodically (default: 3 seconds)
 * - Saves on component unmount
 * - Shows save status feedback
 * - Retries on failure
 */
export function useFormAutoSave({
  formId,
  data,
  enabled = true,
  interval = 3000,
}: AutoSaveOptions) {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  /**
   * Perform the actual save
   */
  const performSave = useCallback(async (dataToSave: any) => {
    if (!formId || !dataToSave || isSavingRef.current) {
      return;
    }

    // Check if data actually changed
    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      const { error } = await supabase
        .from('forms')
        .update({
          form_questions: dataToSave.questions,
          form_objective: dataToSave.objective,
          form_name: dataToSave.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId);

      if (error) throw error;

      lastSavedRef.current = dataString;

      toast({
        title: 'Formulário salvo',
        description: `${new Date().toLocaleTimeString()}`,
        duration: 2000,
      });

      console.log('[FormAutoSave] Saved successfully');
    } catch (error) {
      console.error('[FormAutoSave] Error:', error);

      toast({
        title: 'Erro ao salvar',
        description: 'Tentaremos salvar novamente automaticamente',
        variant: 'destructive',
        duration: 3000,
      });

      // Retry after 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        performSave(dataToSave);
      }, 2000);
    } finally {
      isSavingRef.current = false;
    }
  }, [formId, toast]);

  /**
   * Schedule a save (debounced)
   */
  const scheduleSave = useCallback(
    (dataToSave: any) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performSave(dataToSave);
      }, interval);
    },
    [performSave, interval]
  );

  /**
   * Auto-save on data change
   */
  useEffect(() => {
    if (!enabled || !data) {
      return;
    }

    scheduleSave(data);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      performSave(data);
    };
  }, [data, enabled, scheduleSave, performSave]);

  return {
    isSaving: isSavingRef.current,
    scheduleSave,
    immediatelySave: () => performSave(data),
  };
}