import type { AuthPayload, AuthResponse, SignupPayload } from '@/types/api';
import type { Preferences, ProfilePatch, PublicProfile, WritingDraft } from '@/types/domain';

const PROFILE_ENDPOINT = '/api/me';
const RETRY_MIN_DELAY_MS = 150;
const RETRY_MAX_DELAY_MS = 350;
const RETRYABLE_PROFILE_STATUSES = new Set([502, 503]);

type AuthMode = 'login' | 'signup';
type JsonRecord = Record<string, unknown>;

export class ApiError extends Error {
  readonly status: number;
  readonly requestId?: string;
  readonly aborted: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      requestId?: string;
      aborted?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.requestId = options.requestId;
    this.aborted = options.aborted ?? false;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getErrorDetails(payload: unknown): {
  message: string | null;
  requestId?: string;
} {
  if (!isRecord(payload)) {
    return { message: null };
  }

  return {
    message: typeof payload.error === 'string' ? payload.error : null,
    requestId: typeof payload.requestId === 'string' ? payload.requestId : undefined,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  const body = await response.text();

  if (!body.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch (cause) {
    throw new ApiError('The server returned an invalid response.', {
      status: response.status,
      cause,
    });
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await parseJson(response);

  if (!response.ok) {
    const details = getErrorDetails(payload);
    throw new ApiError(details.message ?? `Request failed with status ${response.status}.`, {
      status: response.status,
      requestId: details.requestId,
    });
  }

  return payload as T;
}

function retryDelay(): number {
  return RETRY_MIN_DELAY_MS + Math.random() * (RETRY_MAX_DELAY_MS - RETRY_MIN_DELAY_MS);
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(
        new ApiError('Request cancelled.', {
          aborted: true,
          cause: signal.reason,
        }),
      );
      return;
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, ms);

    function handleAbort(): void {
      window.clearTimeout(timeout);
      reject(
        new ApiError('Request cancelled.', {
          aborted: true,
          cause: signal?.reason,
        }),
      );
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  retryProfileGet?: boolean;
}

async function request<T>(
  url: string,
  { body, retryProfileGet = false, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const attempts = retryProfileGet ? 2 : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (cause) {
      if (init.signal?.aborted) {
        throw new ApiError('Request cancelled.', {
          aborted: true,
          cause,
        });
      }

      if (retryProfileGet && attempt === 0) {
        await wait(retryDelay(), init.signal ?? undefined);
        continue;
      }

      throw new ApiError('Unable to reach the server. Check your connection and try again.', {
        cause,
      });
    }

    if (retryProfileGet && attempt === 0 && RETRYABLE_PROFILE_STATUSES.has(response.status)) {
      await wait(retryDelay(), init.signal ?? undefined);
      continue;
    }

    return parseResponse<T>(response);
  }

  throw new ApiError('Unable to complete the request.');
}

function assertAuthResponse(value: unknown): asserts value is AuthResponse {
  if (!isRecord(value) || typeof value.email !== 'string') {
    throw new ApiError('The server returned an invalid account response.');
  }
}

function assertProfile(value: unknown): asserts value is PublicProfile {
  if (
    !isRecord(value) ||
    typeof value.email !== 'string' ||
    !isRecord(value.readingData) ||
    !isRecord(value.writingDraft) ||
    !Array.isArray(value.passages) ||
    !(value.preferences === null || isRecord(value.preferences))
  ) {
    throw new ApiError('The server returned an invalid profile response.');
  }
}

export async function auth(
  mode: AuthMode,
  payload: AuthPayload | SignupPayload,
  signal?: AbortSignal,
): Promise<AuthResponse> {
  const result = await request<unknown>(`/api/auth/${mode}`, {
    method: 'POST',
    body: payload,
    signal,
  });
  assertAuthResponse(result);
  return result;
}

export async function getProfile(signal?: AbortSignal): Promise<PublicProfile> {
  const result = await request<unknown>(PROFILE_ENDPOINT, {
    method: 'GET',
    signal,
    retryProfileGet: true,
  });
  assertProfile(result);
  return result;
}

async function patchProfile(patch: ProfilePatch, signal?: AbortSignal): Promise<PublicProfile> {
  const result = await request<unknown>(PROFILE_ENDPOINT, {
    method: 'PATCH',
    body: patch,
    signal,
  });
  assertProfile(result);
  return result;
}

export function updatePreferences(
  preferences: Preferences | null,
  signal?: AbortSignal,
): Promise<PublicProfile> {
  return patchProfile({ action: 'updatePreferences', preferences }, signal);
}

export function updateWriting(
  writingDraft: WritingDraft,
  signal?: AbortSignal,
): Promise<PublicProfile> {
  return patchProfile({ action: 'updateWriting', writingDraft }, signal);
}

export function markRead(signal?: AbortSignal): Promise<PublicProfile> {
  return patchProfile({ action: 'markRead' }, signal);
}

export function reset(signal?: AbortSignal): Promise<PublicProfile> {
  return patchProfile({ action: 'resetProgress' }, signal);
}

export async function logout(signal?: AbortSignal): Promise<void> {
  await request<unknown>('/api/auth/logout', { method: 'POST', signal });
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
