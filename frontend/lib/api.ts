import axios, { AxiosError } from "axios";
import type {
  GitHubUser,
  APIResponse,
  BatchResponse,
  HealthResponse,
  CacheStats,
  AIComparisonResponse,
  ExtendedUserResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Include cookies for authentication
});

// Type guard for Axios errors
function isAxiosError(
  error: unknown
): error is AxiosError<{ message?: string }> {
  return axios.isAxiosError(error);
}

// Auth response types
interface AuthUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  company?: string;
  followers: number;
  following: number;
  public_repos: number;
  has_private_access: boolean;
}

interface AuthResponse {
  error: boolean;
  message?: string;
  user?: AuthUser;
}

// User ranking type
interface UserRanking {
  id: number;
  username: string;
  github_id: number;
  avatar_url: string;
  score: number;
  followers: number;
  public_repos: number;
  total_stars: number;
  total_forks: number;
  contribution_count: number;
  rank_position: number;
  updated_at: string;
}

interface RankingsResponse {
  error: boolean;
  message?: string;
  rankings: UserRanking[];
  total: number;
}

interface RankingResponse {
  error: boolean;
  message?: string;
  ranking?: {
    id: number;
    username: string;
    github_id: number;
    avatar_url: string;
    score: number;
    followers: number;
    public_repos: number;
    total_stars: number;
    total_forks: number;
    contribution_count: number;
    rank_position: number;
    updated_at: string;
  };
}

interface PrivateDataResponse {
  error: boolean;
  message?: string;
  data?: {
    private_repos: number;
    total_private_repos: number;
    owned_private_repos: number;
    private_gists: number;
    disk_usage: number;
    collaborators: number;
    two_factor_enabled: boolean;
    plan_name: string;
    plan_space: number;
    primary_email: string;
    emails_count: number;
    verified_emails_count: number;
    organizations_count: number;
    starred_repos_count: number;
    watching_repos_count: number;
    ssh_keys_count: number;
    gpg_keys_count: number;
  };
}

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const { data } = await axiosInstance.get("/api/health");
    return data;
  },

  async getUserStatus(username: string): Promise<APIResponse> {
    const { data } = await axiosInstance.get(`/api/status/${username}`);
    return data;
  },

  async getBatchStatus(usernames: string[]): Promise<BatchResponse> {
    const { data } = await axiosInstance.post("/api/batch", { usernames });
    return data;
  },

  async getCacheStats(): Promise<CacheStats> {
    const { data } = await axiosInstance.get("/api/cache/stats");
    return data;
  },

  async clearCache(): Promise<void> {
    await axiosInstance.post("/api/cache/clear");
  },

  async getAIComparison(users: GitHubUser[]): Promise<AIComparisonResponse> {
    const { data } = await axiosInstance.post<AIComparisonResponse>(
      "/api/ai/compare",
      { users }
    );
    return data;
  },

  async getExtendedUserInfo(username: string): Promise<ExtendedUserResponse> {
    try {
      const { data } = await axiosInstance.get<{
        error: boolean;
        message?: string;
        data: ExtendedUserResponse;
      }>(`/api/user/${username}/extended`);
      if (data.error) {
        return {
          error: true,
          message: data.message || "Failed to fetch user data",
        };
      }
      return data.data as ExtendedUserResponse;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          return { error: true, message: "User not found" };
        }
        if (error.response?.data) {
          return {
            error: true,
            message: error.response.data.message || "Failed to fetch user data",
          };
        }
      }
      return { error: true, message: "Failed to fetch user data" };
    }
  },

  // Auth endpoints
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const { data } = await axiosInstance.get("/api/auth/me");
      return data;
    } catch {
      return { error: true, message: "Not authenticated" };
    }
  },

  async getFullUserData(): Promise<AuthResponse> {
    try {
      const { data } = await axiosInstance.get("/api/auth/me/full");
      return data;
    } catch {
      return { error: true, message: "Failed to fetch full user data" };
    }
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/api/auth/logout");
  },

  // Rankings endpoints
  async getRankings(
    page: number = 1,
    pageSize: number = 50
  ): Promise<RankingsResponse> {
    try {
      const { data } = await axiosInstance.get("/api/rankings", {
        params: { page, page_size: pageSize },
      });
      return data;
    } catch {
      console.error("Failed to fetch rankings");
      return {
        error: true,
        message: "Failed to fetch rankings",
        rankings: [],
        total: 0,
      };
    }
  },

  async getUserRanking(username: string): Promise<RankingResponse> {
    try {
      const { data } = await axiosInstance.get(`/api/rankings/${username}`);
      return data;
    } catch {
      return { error: true, message: "User not found in rankings" };
    }
  },

  async updateUserRanking(username: string): Promise<RankingResponse> {
    try {
      const { data } = await axiosInstance.post("/api/rankings/update", {
        username,
      });
      return data;
    } catch {
      return { error: true, message: "Failed to update ranking" };
    }
  },

  // Private data endpoints (only accessible for own profile)
  async getMyPrivateData(): Promise<PrivateDataResponse> {
    try {
      const { data } = await axiosInstance.get("/api/me/private");
      return data;
    } catch {
      return { error: true, message: "Failed to fetch private data" };
    }
  },

  async refreshMyPrivateData(): Promise<PrivateDataResponse> {
    try {
      const { data } = await axiosInstance.post("/api/me/private/refresh");
      return data;
    } catch {
      return { error: true, message: "Failed to refresh private data" };
    }
  },

  // Admin endpoints (only accessible for admin users like anantacoder)
  async getAdminUpdateStatus(): Promise<{
    total_users: number;
    updated_users: number;
    pending_users: number;
    disabled_users?: number;
    last_update: string | null;
    is_admin: boolean;
    admin_username: string;
  }> {
    const { data } = await axiosInstance.get("/api/admin/update-status");
    return data;
  },

  async triggerPrivateDataUpdate(): Promise<{
    success: boolean;
    message: string;
    total_users: number;
    success_count: number;
    fail_count: number;
    duration: string;
    failed_users?: string[];
    disabled_count?: number;
    disabled_users?: string[];
  }> {
    const { data } = await axiosInstance.post(
      "/api/admin/update-all-private-data"
    );
    return data;
  },
};
