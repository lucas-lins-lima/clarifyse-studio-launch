import { supabase } from '@/integrations/supabase/db';

/**
 * ✅ FIX: Generate secure, unique survey links
 * - Creates unique slug for each form
 * - Validates form exists before returning link
 * - Stores link metadata for analytics
 */

export interface SurveyLink {
  id: string;
  formId: string;
  slug: string;
  fullUrl: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Generate a unique slug for survey link
 */
function generateSlug(formName: string): string {
  const baseSlug = formName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Create a new survey link
 */
export async function createSurveyLink(
  formId: string,
  formName: string,
  expiresInDays?: number
): Promise<SurveyLink> {
  const slug = generateSlug(formName);

  // Verify form exists
  const { data: form, error: formError } = await supabase
    .from('forms')
    .select('id')
    .eq('id', formId)
    .single();

  if (formError || !form) {
    throw new Error(`Form ${formId} not found`);
  }

  // Create link record
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const { data, error } = await supabase
    .from('survey_links')
    .insert([
      {
        form_id: formId,
        slug,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create survey link: ${error.message}`);
  }

  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const fullUrl = `${baseUrl}/survey/${slug}`;

  return {
    id: data.id,
    formId: data.form_id,
    slug: data.slug,
    fullUrl,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    isActive: data.is_active,
  };
}

/**
 * Resolve slug to form ID
 */
export async function resolveSlugToForm(slug: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('survey_links')
    .select('form_id, is_active, expires_at')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('[SurveyLink] Slug not found:', slug);
    return null;
  }

  // Check if link is active
  if (!data.is_active) {
    console.warn('[SurveyLink] Link is inactive:', slug);
    return null;
  }

  // Check if link has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.warn('[SurveyLink] Link has expired:', slug);
    await supabase
      .from('survey_links')
      .update({ is_active: false })
      .eq('slug', slug);
    return null;
  }

  return data.form_id;
}

/**
 * Deactivate a survey link
 */
export async function deactivateSurveyLink(slug: string): Promise<void> {
  const { error } = await supabase
    .from('survey_links')
    .update({ is_active: false })
    .eq('slug', slug);

  if (error) {
    throw new Error(`Failed to deactivate link: ${error.message}`);
  }
}

/**
 * Get all links for a form
 */
export async function getFormSurveyLinks(
  formId: string
): Promise<SurveyLink[]> {
  const { data, error } = await supabase
    .from('survey_links')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch links: ${error.message}`);
  }

  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;

  return (data || []).map((link: any) => ({
    id: link.id,
    formId: link.form_id,
    slug: link.slug,
    fullUrl: `${baseUrl}/survey/${link.slug}`,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    isActive: link.is_active,
  }));
}