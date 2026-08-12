export type TargetType = "ALL_CLIENTS" | "TAGS";

export interface BroadcastTemplate {
  id: string;
  name: string;
  content: string;
  mediaUrl?: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastTag {
  id: string;
  name: string;
  color: string;
}

export interface BroadcastInitialData {
  tenant: any;
  tags: BroadcastTag[];
  templates: BroadcastTemplate[];
}
