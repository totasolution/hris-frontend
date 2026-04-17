import type { Candidate } from '../services/api';

export type MergeCandidateOptions = {
  /**
   * When the API response has no usable screening_status, set this value instead of preserving `prev`
   * (e.g. submit-to-client always moves the candidate to submitted on the server).
   */
  screeningStatusFallback?: string;
};

/**
 * Merges a PUT /candidates (or similar) JSON body into existing client state so optional fields from the
 * server do not wipe screening_status or other fields the response might omit.
 */
export function mergeCandidateFromApiResponse(
  prev: Candidate | null,
  incoming: Candidate,
  opts?: MergeCandidateOptions,
): Candidate {
  if (!prev) return incoming;
  const nextTrim = incoming.screening_status?.trim();
  let screening_status: string;
  if (nextTrim) {
    screening_status = nextTrim;
  } else if (opts?.screeningStatusFallback != null && opts.screeningStatusFallback.trim() !== '') {
    screening_status = opts.screeningStatusFallback.trim();
  } else {
    screening_status = prev.screening_status;
  }
  return {
    ...prev,
    ...incoming,
    screening_status,
  };
}

export function screeningStatusDisplay(status: string | undefined | null): string {
  const s = (status ?? '').trim();
  return s ? s.replace(/_/g, ' ') : '—';
}
