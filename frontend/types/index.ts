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

export interface TechStack {
  languages: Record<string, number>;
  top_language: string;
  total_repos: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  last_active: string;
}

export interface ExtendedUserInfo {
  user: GitHubUser;
  tech_stack: TechStack;
  streak: StreakInfo;
}

export interface ExtendedUserResponse {
  error: boolean;
  user?: GitHubUser;
  tech_stack?: TechStack;
  streak?: StreakInfo;
  data?: ExtendedUserInfo;
  message?: string;
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
