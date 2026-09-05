import { Session } from '../types';

export interface LegacyCustomerParams {
  sessionId: string;
  machineId: string;
  machineName: string;
  machineType: string;
  customerName: string;
  packageName: string;
  durationMinutes: number;
  price: number;
  startTime: number;
  endTime: number;
  isPaused: boolean;
  accumulatedPauseMs: number;
  businessName: string;
}

export interface CustomerLiveRouteResult {
  isCustomerView: boolean;
  token?: string;
  isLegacy: boolean;
  legacyParams?: LegacyCustomerParams;
}

/**
 * Generate a random 6-character lowercase alphanumeric token (e.g. '74tw4i')
 * Omits ambiguous characters (0, o, 1, l, i) for maximum readability and ease of typing.
 */
export function generatePublicSessionToken(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let token = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      token += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return token;
}

/**
 * Generate a unique 6-character token avoiding collisions with active sessions
 */
export function generateUniquePublicToken(
  existingSessions: Array<{ publicSessionToken?: string }> = []
): string {
  const existing = new Set(
    existingSessions
      .map((s) => s.publicSessionToken?.toLowerCase())
      .filter((t): t is string => Boolean(t))
  );

  let token = generatePublicSessionToken();
  let attempts = 0;
  while (existing.has(token) && attempts < 50) {
    token = generatePublicSessionToken();
    attempts++;
  }
  return token;
}

/**
 * Derive a stable short token from an existing sessionId if publicSessionToken is missing
 * e.g. sess_1788606065429_tw74i -> tw74i
 */
export function getFallbackPublicToken(sessionId: string): string {
  if (!sessionId) return generatePublicSessionToken();
  const parts = sessionId.split('_');
  if (parts.length >= 3 && parts[parts.length - 1].length >= 4) {
    return parts[parts.length - 1].toLowerCase();
  }
  const clean = sessionId.replace(/[^a-zA-Z0-9]/g, '');
  return (clean.slice(-6) || generatePublicSessionToken()).toLowerCase();
}

/**
 * Parses the current window location to detect Customer Live Tracker route:
 * 1. Path format: /live/:token (e.g. /live/74tw4i)
 * 2. Query format: ?live=:token or ?token=:token
 * 3. Hash format: #/live/:token
 * 4. Legacy format: ?view=customer&session_id=...
 */
export function parseCustomerLiveRoute(): CustomerLiveRouteResult {
  if (typeof window === 'undefined') {
    return { isCustomerView: false, isLegacy: false };
  }

  const pathname = window.location.pathname || '';
  const search = window.location.search || '';
  const hash = window.location.hash || '';

  // 1. Primary: Match path /live/:token (e.g. /live/74tw4i)
  const pathMatch = pathname.match(/\/live\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    return {
      isCustomerView: true,
      token: decodeURIComponent(pathMatch[1]).trim(),
      isLegacy: false,
    };
  }

  // 1b. Direct /live or /live/ with no token - show customer view empty/not-found state
  const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
  if (cleanPath === '/live') {
    return {
      isCustomerView: true,
      token: '',
      isLegacy: false,
    };
  }

  // 2. Hash-based route support e.g. #/live/74tw4i
  const hashMatch = hash.match(/#\/live\/([a-zA-Z0-9_-]+)/i);
  if (hashMatch && hashMatch[1]) {
    return {
      isCustomerView: true,
      token: decodeURIComponent(hashMatch[1]).trim(),
      isLegacy: false,
    };
  }

  // 3. Query string formats
  const searchParams = new URLSearchParams(search);

  // 3a. Short query: ?live=74tw4i or ?token=74tw4i
  const queryToken = searchParams.get('live') || searchParams.get('token');
  if (queryToken) {
    return {
      isCustomerView: true,
      token: queryToken,
      isLegacy: false,
    };
  }

  // 3b. Legacy backward-compatible format: ?view=customer
  if (searchParams.get('view') === 'customer') {
    const sessionId = searchParams.get('session_id') || '';
    const legacyParams: LegacyCustomerParams = {
      sessionId: sessionId || 'sess_legacy',
      machineId: searchParams.get('machine_id') || 'm_default',
      machineName: searchParams.get('machine_name') || 'Excavator EX-01',
      machineType: searchParams.get('machine_type') || 'excavator',
      customerName: searchParams.get('customer') || 'Pelanggan',
      packageName: searchParams.get('pkg') || 'Sesi Standard (20 Minit)',
      durationMinutes: parseInt(searchParams.get('duration') || '20', 10),
      price: parseFloat(searchParams.get('price') || '10'),
      startTime: parseInt(searchParams.get('start') || String(Date.now()), 10),
      endTime: parseInt(searchParams.get('end') || String(Date.now() + 20 * 60 * 1000), 10),
      isPaused: searchParams.get('paused') === '1',
      accumulatedPauseMs: parseInt(searchParams.get('accum_pause') || '0', 10),
      businessName: searchParams.get('biz') || 'FUN RIDE RC ZONE',
    };

    return {
      isCustomerView: true,
      token: sessionId || searchParams.get('public_token') || undefined,
      isLegacy: true,
      legacyParams,
    };
  }

  return { isCustomerView: false, isLegacy: false };
}
