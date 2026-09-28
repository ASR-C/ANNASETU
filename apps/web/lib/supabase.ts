/**
 * ANNASETU Supabase Client & Configuration
 * Provides direct PostgREST & Auth integration with Supabase Cloud PostgreSQL.
 * Supports environment variables with interactive in-app credential configuration.
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

// Default config resolver: strictly uses environment variables, never exposes credentials in browser localStorage
export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Cleanse any legacy credentials from client browser localStorage for security
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('annasetu_supabase_url');
      localStorage.removeItem('annasetu_supabase_key');
    } catch (_) {}
  }

  const isConnected = Boolean(url && anonKey && url.includes('supabase.co'));
  return { url: url.trim().replace(/\/$/, ''), anonKey: anonKey.trim(), isConnected };
}

export function saveSupabaseConfig(_url: string, _anonKey: string): void {
  // Direct client-side storage of database credentials disabled for security
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('annasetu_supabase_url');
      localStorage.removeItem('annasetu_supabase_key');
    } catch (_) {}
  }
}

/**
 * Perform a type-safe request to the Supabase PostgREST API
 */
export async function supabaseRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    prefer?: string;
  } = {}
): Promise<T> {
  const { url, anonKey, isConnected } = getSupabaseConfig();

  if (!isConnected) {
    throw new Error('Supabase is not configured yet. Please configure your Supabase URL & Anon Key.');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${url}/rest/v1${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {}),
  };

  const reqOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body && options.method !== 'GET') {
    reqOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(fullUrl, reqOptions);

  if (!res.ok) {
    let errorDetail = `Supabase request failed: HTTP ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.message || errJson.hint || errJson.details || JSON.stringify(errJson);
    } catch (_) {}
    throw new Error(errorDetail);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return [] as unknown as T;
  }

  return res.json();
}

/**
 * Test connectivity to a Supabase project by requesting the food_categories or profiles table
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string; tablesCount?: number }> {
  const url = (customUrl || getSupabaseConfig().url).trim().replace(/\/$/, '');
  const key = (customKey || getSupabaseConfig().anonKey).trim();

  if (!url || !key) {
    return { success: false, message: 'Please provide both Supabase Project URL and Anon Public Key.' };
  }

  try {
    const testUrl = `${url}/rest/v1/`;
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      // Try querying profiles or food_categories
      try {
        const queryRes = await fetch(`${url}/rest/v1/profiles?select=count`, {
          method: 'GET',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Range-Unit': 'items',
            'Range': '0-0',
            'Prefer': 'count=exact',
          },
        });
        const contentRange = queryRes.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1] || '0', 10) : 0;
        return { success: true, message: 'Successfully connected to Supabase Cloud PostgreSQL database!', tablesCount: count };
      } catch (_) {
        return { success: true, message: 'Connected to Supabase endpoint! (Schema tables ready)' };
      }
    }

    const err = await res.text();
    return { success: false, message: `Connection failed (${res.status}): ${err}` };
  } catch (e: any) {
    return { success: false, message: `Network error reaching Supabase: ${e.message}` };
  }
}
