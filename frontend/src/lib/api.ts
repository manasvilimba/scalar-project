import {
  ApiError,
  BulkDeleteRequest,
  DnsRecordCreate,
  DnsRecordListResponse,
  DnsRecordResponse,
  DnsRecordUpdate,
  HostedZoneCreate,
  HostedZoneListResponse,
  HostedZoneResponse,
  HostedZoneUpdate,
  ImportResult,
  LoginRequest,
  MessageResponse,
  TokenResponse,
  UserResponse,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) {
        if (typeof body.detail === "string") {
          detail = body.detail;
        } else if (Array.isArray(body.detail)) {
          detail = body.detail.map((e: Record<string, unknown>) => e.msg || JSON.stringify(e)).join(", ");
        } else {
          detail = JSON.stringify(body.detail);
        }
      }
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(token: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export async function me(token: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/api/auth/me", { token });
}

// ─── Hosted Zones ─────────────────────────────────────────────────────────────

export interface ListZoneParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export async function listHostedZones(
  token: string,
  params: ListZoneParams = {}
): Promise<HostedZoneListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return apiFetch<HostedZoneListResponse>(
    `/api/hosted-zones/${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getHostedZone(
  token: string,
  zoneId: string
): Promise<HostedZoneResponse> {
  return apiFetch<HostedZoneResponse>(`/api/hosted-zones/${zoneId}`, { token });
}

export async function createHostedZone(
  token: string,
  payload: HostedZoneCreate
): Promise<HostedZoneResponse> {
  return apiFetch<HostedZoneResponse>("/api/hosted-zones/", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export async function updateHostedZone(
  token: string,
  zoneId: string,
  payload: HostedZoneUpdate
): Promise<HostedZoneResponse> {
  return apiFetch<HostedZoneResponse>(`/api/hosted-zones/${zoneId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(payload),
  });
}

export async function deleteHostedZone(
  token: string,
  zoneId: string
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/hosted-zones/${zoneId}`, {
    method: "DELETE",
    token,
  });
}

// ─── DNS Records ──────────────────────────────────────────────────────────────

export interface ListRecordParams {
  search?: string;
  record_type?: string;
  page?: number;
  page_size?: number;
}

export async function listDnsRecords(
  token: string,
  zoneId: string,
  params: ListRecordParams = {}
): Promise<DnsRecordListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.record_type) qs.set("record_type", params.record_type);
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  const query = qs.toString();
  return apiFetch<DnsRecordListResponse>(
    `/api/hosted-zones/${zoneId}/records/${query ? `?${query}` : ""}`,
    { token }
  );
}

export async function getDnsRecord(
  token: string,
  zoneId: string,
  recordId: number
): Promise<DnsRecordResponse> {
  return apiFetch<DnsRecordResponse>(
    `/api/hosted-zones/${zoneId}/records/${recordId}`,
    { token }
  );
}

export async function createDnsRecord(
  token: string,
  zoneId: string,
  payload: DnsRecordCreate
): Promise<DnsRecordResponse> {
  return apiFetch<DnsRecordResponse>(
    `/api/hosted-zones/${zoneId}/records/`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function updateDnsRecord(
  token: string,
  zoneId: string,
  recordId: number,
  payload: DnsRecordUpdate
): Promise<DnsRecordResponse> {
  return apiFetch<DnsRecordResponse>(
    `/api/hosted-zones/${zoneId}/records/${recordId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteDnsRecord(
  token: string,
  zoneId: string,
  recordId: number
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(
    `/api/hosted-zones/${zoneId}/records/${recordId}`,
    { method: "DELETE", token }
  );
}

export async function bulkDeleteDnsRecords(
  token: string,
  zoneId: string,
  payload: BulkDeleteRequest
): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(
    `/api/hosted-zones/${zoneId}/records/`,
    {
      method: "DELETE",
      token,
      body: JSON.stringify(payload),
    }
  );
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export async function importBindFile(
  token: string,
  zoneId: string,
  records: DnsRecordCreate[]
): Promise<ImportResult> {
  // We send the parsed records as a batch-create request.
  // Backend doesn't have a native import endpoint, so we POST each record
  // individually and aggregate results.
  let imported = 0;
  const errors: string[] = [];
  for (const rec of records) {
    try {
      await createDnsRecord(token, zoneId, rec);
      imported++;
    } catch (err) {
      if (err instanceof ApiError) {
        errors.push(`${rec.name} (${rec.type}): ${err.detail}`);
      } else {
        errors.push(`${rec.name} (${rec.type}): Unknown error`);
      }
    }
  }
  return { imported, skipped: 0, errors };
}
