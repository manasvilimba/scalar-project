// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  created_at: string;
}

// ─── Hosted Zones ─────────────────────────────────────────────────────────────

export interface HostedZoneCreate {
  name: string;
  type?: "Public" | "Private";
  comment?: string | null;
}

export interface HostedZoneUpdate {
  comment?: string | null;
}

export interface HostedZoneResponse {
  id: number;
  zone_id: string;
  name: string;
  type: "Public" | "Private";
  comment: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneListResponse {
  items: HostedZoneResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── DNS Records ──────────────────────────────────────────────────────────────

export type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA";

export const DNS_RECORD_TYPES: DnsRecordType[] = [
  "A",
  "AAAA",
  "CNAME",
  "TXT",
  "MX",
  "NS",
  "PTR",
  "SRV",
  "CAA",
];

export type RoutingPolicy =
  | "Simple"
  | "Weighted"
  | "Latency"
  | "Failover"
  | "Geolocation"
  | "Multivalue";

export const ROUTING_POLICIES: RoutingPolicy[] = [
  "Simple",
  "Weighted",
  "Latency",
  "Failover",
  "Geolocation",
  "Multivalue",
];

export interface DnsRecordCreate {
  name: string;
  type: DnsRecordType;
  ttl?: number;
  value: string;
  routing_policy?: RoutingPolicy;
  comment?: string | null;
}

export interface DnsRecordUpdate {
  ttl?: number | null;
  value?: string | null;
  routing_policy?: RoutingPolicy | null;
  comment?: string | null;
}

export interface DnsRecordResponse {
  id: number;
  zone_id: number;
  name: string;
  type: DnsRecordType;
  ttl: number;
  value: string;
  routing_policy: RoutingPolicy;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface DnsRecordListResponse {
  items: DnsRecordResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BulkDeleteRequest {
  ids: number[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Generic ──────────────────────────────────────────────────────────────────

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  detail: string;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}
