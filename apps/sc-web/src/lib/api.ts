// Hardcoded for now - env vars don't work reliably in Cloudflare Pages SSR
const API_URL = 'https://sc-api.automation-ab6.workers.dev';

export interface ExperimentData {
  id: string;
  name: string;
  slug: string;
  status: string;
  archetype: string;
  copy_pack?: string;
  price_cents?: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
}

export interface CopyPack {
  headline: string;
  subheadline?: string;
  value_props?: string[];
  cta_primary?: string;
  cta_secondary?: string;
}

export interface CreateLeadData {
  experiment_id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  custom_fields?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  session_id?: string;
  visitor_id?: string;
}

export interface LeadResponse {
  lead_id: number;
  experiment_id: string;
  slug: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  request_id: string;
}

export async function getExperimentBySlug(slug: string): Promise<ExperimentData | null> {
  try {
    const response = await fetch(`${API_URL}/experiments/by-slug/${slug}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch experiment:', error);
    return null;
  }
}

export async function createLead(data: CreateLeadData): Promise<{ success: true; data: LeadResponse } | { success: false; error: APIError }> {
  try {
    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to submit form. Please try again.',
        request_id: 'unknown',
      },
    };
  }
}
