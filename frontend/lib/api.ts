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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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
    const { data } = await axiosInstance.get<ExtendedUserResponse>(
      `/api/user/${username}/extended`
    );
    return data;
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
    const { data } = await axiosInstance.get("/api/rankings", {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  async getUserRanking(username: string): Promise<any> {
    const { data } = await axiosInstance.get(`/api/rankings/${username}`);
    return data;
  },

  async updateUserRanking(username: string): Promise<any> {
    const { data } = await axiosInstance.post("/api/rankings/update", {
      username,
    });
    return data;
  },
};
