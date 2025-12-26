export interface DevAIMention {
    type: "repo" | "user" | "file" | "pr";
    value: string;
}

export interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    mentions?: DevAIMention[] | string; // Can be array or JSON string from DB
    created_at: string;
}

export interface Conversation {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
}

export interface UserResult {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
}

export interface RepoResult {
    full_name: string;
    description: string;
    stars: number;
    language: string;
    html_url: string;
}

export interface GitHubUserStats {
    login: string;
    name: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
    bio: string;
}
