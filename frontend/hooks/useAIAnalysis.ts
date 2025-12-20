"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface AIAnalysisConfig {
  cooldownSeconds?: number;
  onSuccess?: (result: string) => void;
  onError?: (error: string) => void;
}

interface AIAnalysisState {
  result: string;
  loading: boolean;
  error: string | null;
  cooldown: number;
  canAnalyze: boolean;
}

interface GitHubUserInput {
  login: string;
  name?: string;
  avatar_url: string;
  bio?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  html_url: string;
  created_at?: string;
}

/**
 * Custom hook for AI analysis with built-in rate limiting
 * Provides consistent AI analysis behavior across the application
 */
export function useAIAnalysis(config: AIAnalysisConfig = {}) {
  const { cooldownSeconds = 30, onSuccess, onError } = config;

  const [state, setState] = useState<AIAnalysisState>({
    result: "",
    loading: false,
    error: null,
    cooldown: 0,
    canAnalyze: true,
  });

  // Cooldown timer
  useEffect(() => {
    if (state.cooldown > 0) {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          cooldown: prev.cooldown - 1,
          canAnalyze: prev.cooldown - 1 === 0,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.cooldown]);

  // Analyze users/profiles
  const analyzeUsers = useCallback(
    async (users: GitHubUserInput[]) => {
      if (state.loading || state.cooldown > 0) return;

      setState((prev) => ({ ...prev, loading: true, error: null, result: "" }));

      try {
        const formattedUsers = users.map((user) => ({
          login: user.login,
          name: user.name || user.login,
          avatar_url: user.avatar_url,
          bio: user.bio || "",
          public_repos: user.public_repos || 0,
          followers: user.followers || 0,
          following: user.following || 0,
          html_url: user.html_url,
          id: 0,
          repos_url: "",
          starred_url: "",
          subscriptions_url: "",
          organizations_url: "",
          events_url: "",
          received_events_url: "",
          created_at: user.created_at || new Date().toISOString(),
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await api.getAIComparison(formattedUsers as any);
        
        // Check if API returned an error or unavailable message
        if (response.error) {
          throw new Error(response.message || "API error");
        }
        
        const result = response.comparison || "Analysis complete";
        
        // Check for "unavailable" in the response (API key not configured)
        if (result.toLowerCase().includes("unavailable") || result.toLowerCase().includes("not configured")) {
          throw new Error("AI service not configured on backend");
        }

        setState((prev) => ({
          ...prev,
          result,
          loading: false,
          cooldown: cooldownSeconds,
          canAnalyze: false,
        }));

        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Analysis failed";
        
        // Provide fallback analysis on error
        const fallback = users.length === 1
          ? `**${users[0].login}** has ${users[0].public_repos || 0} public repositories with ${users[0].followers || 0} followers.`
          : `Comparison of ${users.map(u => u.login).join(" vs ")}: Both developers have strong GitHub presence.`;

        setState((prev) => ({
          ...prev,
          result: fallback,
          error: errorMessage,
          loading: false,
          cooldown: cooldownSeconds,
          canAnalyze: false,
        }));

        onError?.(errorMessage);
        return fallback;
      }
    },
    [state.loading, state.cooldown, cooldownSeconds, onSuccess, onError]
  );

  // Analyze a repository using dedicated /api/ai/analyze endpoint
  const analyzeRepo = useCallback(
    async (repo: {
      owner: string;
      name: string;
      description?: string;
      language?: string;
      stars?: number;
      forks?: number;
    }) => {
      if (state.loading || state.cooldown > 0) return;

      setState((prev) => ({ ...prev, loading: true, error: null, result: "" }));

      try {
        const response = await api.getAIAnalysis({
          type: "repo",
          repo_owner: repo.owner,
          repo_name: repo.name,
          description: repo.description || "",
          language: repo.language || "Unknown",
          stars: repo.stars || 0,
          forks: repo.forks || 0,
        });

        // Check if API returned an error
        if (response.error) {
          throw new Error(response.message || "API error");
        }

        const result = response.analysis || "Analysis complete";

        // Check for "unavailable" in the response (API key not configured)
        if (result.toLowerCase().includes("unavailable") || result.toLowerCase().includes("not configured")) {
          throw new Error("AI service not configured on backend");
        }

        setState((prev) => ({
          ...prev,
          result,
          loading: false,
          cooldown: cooldownSeconds,
          canAnalyze: false,
        }));

        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Analysis failed";

        // Provide fallback analysis on error
        const fallback = `**${repo.owner}/${repo.name}** - ${repo.description || "No description"}\n\n` +
          `• Language: ${repo.language || "Unknown"}\n` +
          `• Stars: ${repo.stars || 0} | Forks: ${repo.forks || 0}\n\n` +
          `_AI analysis temporarily unavailable._`;

        setState((prev) => ({
          ...prev,
          result: fallback,
          error: errorMessage,
          loading: false,
          cooldown: cooldownSeconds,
          canAnalyze: false,
        }));

        onError?.(errorMessage);
        return fallback;
      }
    },
    [state.loading, state.cooldown, cooldownSeconds, onSuccess, onError]
  );

  // Clear results
  const clearResult = useCallback(() => {
    setState((prev) => ({ ...prev, result: "", error: null }));
  }, []);

  // Reset cooldown (for admin/testing)
  const resetCooldown = useCallback(() => {
    setState((prev) => ({ ...prev, cooldown: 0, canAnalyze: true }));
  }, []);

  return {
    ...state,
    analyzeUsers,
    analyzeRepo,
    clearResult,
    resetCooldown,
  };
}

export default useAIAnalysis;
