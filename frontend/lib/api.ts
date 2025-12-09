import axios from "axios";
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
        } as any;
      }
      return data.data as ExtendedUserResponse;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { error: true, message: "User not found" } as any;
      }
      if (error.response?.data) {
        return {
          error: true,
          message: error.response.data.message || "Failed to fetch user data",
        } as any;
      }
      return { error: true, message: "Failed to fetch user data" } as any;
    }
  },

  // Auth endpoints
  async getCurrentUser(): Promise<any> {
    try {
      const { data } = await axiosInstance.get("/api/auth/me");
      return data;
    } catch (error) {
      return { error: true, message: "Not authenticated" };
    }
  },

  async getFullUserData(): Promise<any> {
    try {
      const { data } = await axiosInstance.get("/api/auth/me/full");
      return data;
    } catch (error) {
      return { error: true, message: "Failed to fetch full user data" };
    }
  },

  async logout(): Promise<void> {
    await axiosInstance.post("/api/auth/logout");
  },

  // Rankings endpoints
  async getRankings(page: number = 1, pageSize: number = 50): Promise<any> {
    try {
      const { data } = await axiosInstance.get("/api/rankings", {
        params: { page, page_size: pageSize },
      });
      return data;
    } catch (error: any) {
      console.error("Failed to fetch rankings:", error);
      return {
        error: true,
        message: "Failed to fetch rankings",
        rankings: [],
        total: 0,
      };
    }
  },

  async getUserRanking(username: string): Promise<any> {
    try {
      const { data } = await axiosInstance.get(`/api/rankings/${username}`);
      return data;
    } catch (error: any) {
      return { error: true, message: "User not found in rankings" };
    }
  },

  async updateUserRanking(username: string): Promise<any> {
    try {
      const { data } = await axiosInstance.post("/api/rankings/update", {
        username,
      });
      return data;
    } catch (error: any) {
      return { error: true, message: "Failed to update ranking" };
    }
  },

  // Private data endpoints (only accessible for own profile)
  async getMyPrivateData(): Promise<any> {
    try {
      const { data } = await axiosInstance.get("/api/me/private");
      return data;
    } catch (error: any) {
      return { error: true, message: "Failed to fetch private data" };
    }
  },

  async refreshMyPrivateData(): Promise<any> {
    try {
      const { data } = await axiosInstance.post("/api/me/private/refresh");
      return data;
    } catch (error: any) {
      return { error: true, message: "Failed to refresh private data" };
    }
  },

  // Admin endpoints (only accessible for admin users like anantacoder)
  async getAdminUpdateStatus(): Promise<{
    total_users: number;
    updated_users: number;
    pending_users: number;
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
  }> {
    const { data } = await axiosInstance.post(
      "/api/admin/update-all-private-data"
    );
    return data;
  },
};
