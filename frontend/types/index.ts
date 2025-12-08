// Type definitions for the application
export interface GitHubUser {
  login: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  html_url: string;
  location: string;
  company: string;
  blog: string;
  twitter_username: string;
  public_gists: number;
}

export interface APIResponse {
  error: boolean;
  message?: string;
  data?: GitHubUser;
  cached?: boolean;
}

export interface BatchResponse {
  error: boolean;
  results: Record<string, APIResponse>;
}

export interface HealthResponse {
  status: string;
  cache_size?: number;
  cache_hit_rate?: string;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hit_rate: string;
}

export interface AIComparisonResponse {
  error: boolean;
  comparison: string;
  message?: string;
}
