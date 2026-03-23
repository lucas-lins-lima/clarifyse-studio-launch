import { Router, Request, Response } from 'express';
import { db } from '@/integrations/supabase/db';

const router = Router();

/**
 * ✅ FIX: Validate quotas before accepting response
 * - Check if quota group is full
 * - Check if overall sample is full
 * - Return 409 if quota exceeded
 */
router.post('/api/responses/:formId', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { answers, quotaGroup, timeSpentSeconds } = req.body;

    // Validate inputs
    if (!formId || !answers || !quotaGroup) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // STEP 1: Fetch form and quota configuration
    const { data: form, error: formError } = await db
      .from('forms')
      .select(`
        *,
        quotas:quota_groups(
          id,
          name,
          target_count,
          question_id,
          question_code
        )
      `)
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // STEP 2: Count existing responses for this quota group
    const { data: existingResponses, error: countError } = await db
      .from('form_responses')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', formId)
      .eq('quota_group', quotaGroup)
      .eq('is_valid', true);

    if (countError) throw countError;

    const currentQuotaCount = existingResponses?.length || 0;

    // STEP 3: Find quota configuration for this group
    const quotaConfig = form.quotas?.find(
      (q: any) => q.name === quotaGroup
    );

    if (quotaConfig && quotaConfig.target_count) {
      if (currentQuotaCount >= quotaConfig.target_count) {
        return res.status(409).json({
          error: 'Cota atingida',
          quotaGroup,
          message: `A cota para o perfil ${quotaGroup} já foi preenchida.`,
        });
      }
    }

    // STEP 4: Check if overall sample is full
    const { data: allResponses, error: allCountError } = await db
      .from('form_responses')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', formId)
      .eq('is_valid', true);

    if (allCountError) throw allCountError;

    const totalResponses = allResponses?.length || 0;

    if (form.sample_size && totalResponses >= form.sample_size) {
      return res.status(409).json({
        error: 'Amostra total atingida',
        message: 'A amostra total foi atingida. Obrigado!',
      });
    }

    // STEP 5: Insert response into database
    const { data: newResponse, error: insertError } = await db
      .from('form_responses')
      .insert([
        {
          form_id: formId,
          answers,
          quota_group: quotaGroup,
          time_spent_seconds: timeSpentSeconds,
          is_valid: true,
          submitted_at: new Date().toISOString(),
          respondent_ip: req.ip,
        },
      ])
      .select();

    if (insertError) throw insertError;

    // STEP 6: Update form metrics
    const { error: updateError } = await db
      .from('forms')
      .update({
        total_responses: totalResponses + 1,
        last_response_at: new Date().toISOString(),
      })
      .eq('id', formId);

    if (updateError) throw updateError;

    // STEP 7: Return success
    return res.status(201).json({
      success: true,
      responseId: newResponse?.[0]?.id,
      message: 'Resposta registrada com sucesso!',
      quotaStatus: {
        currentQuotaCount: currentQuotaCount + 1,
        quotaTarget: quotaConfig?.target_count,
        totalResponses: totalResponses + 1,
        sampleSize: form.sample_size,
      },
    });
  } catch (error) {
    console.error('[Response] Error:', error);
    return res.status(500).json({ error: 'Erro ao processar resposta' });
  }
});

/**
 * Get response count and quota status
 */
router.get('/api/forms/:formId/quota-status', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;

    const { data: form } = await db
      .from('forms')
      .select('sample_size, quotas:quota_groups(*)')
      .eq('id', formId)
      .single();

    const { data: responses } = await db
      .from('form_responses')
      .select('id, quota_group')
      .eq('form_id', formId)
      .eq('is_valid', true);

    const quotaStatus: Record<string, any> = {};

    form.quotas?.forEach((quota: any) => {
      const count = responses?.filter(r => r.quota_group === quota.name).length || 0;
      quotaStatus[quota.name] = {
        current: count,
        target: quota.target_count,
        remaining: Math.max(0, quota.target_count - count),
        percentage: (count / quota.target_count) * 100,
      };
    });

    return res.json({
      totalResponses: responses?.length || 0,
      sampleSize: form.sample_size,
      quotaStatus,
    });
  } catch (error) {
    console.error('[Quota Status] Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar status de cotas' });
  }
});

export default router;