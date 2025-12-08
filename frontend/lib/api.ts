import axios from "axios";
import type {
  GitHubUser,
  APIResponse,
  BatchResponse,
  HealthResponse,
  CacheStats,
  AIComparisonResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
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
};
