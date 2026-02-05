
export interface ModemAccount {
  id: string;
  name: string;
  username: string;
  password?: string;
  balanceGb: number;
  totalGb: number;
  expiryDate: string;
  lastUpdated: string;
  status: 'active' | 'expired' | 'low';
}

export interface AppSettings {
  refreshInterval: number; // minutes
  notificationThreshold: number; // GB
}

export interface ParseResult {
  balance: number;
  expiry: string;
  error?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface IntelligenceResult {
  summary: string;
  sources: GroundingChunk[];
}
