"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                {/* Back Link */}
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-400 transition-colors mb-12 group">
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </Link>

                {/* Header */}
                <div className="mb-16">
                    <div className="mb-6">
                        <p className="text-indigo-400 text-sm font-medium tracking-wide uppercase mb-3">Safety & Trust</p>
                        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                        <p className="text-zinc-500 text-sm mt-2">Last updated: December 2025</p>
                    </div>
                    <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
                        We value your privacy. This policy explains how DevScope protects and handles your data with complete transparency.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-16">

                    {/* Section 1 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">01</span>
                            <h2 className="text-2xl font-semibold text-white">Information We Collect</h2>
                        </div>
                        <div className="pl-12 space-y-4">
                            <p className="text-zinc-400 leading-relaxed">
                                DevScope collects minimal data necessary to provide our services:
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-4">
                                    <span className="w-2 h-2 mt-2.5 rounded-full bg-indigo-500" />
                                    <div>
                                        <span className="text-white font-medium">GitHub Profile Data</span>
                                        <span className="text-zinc-500"> — Username, avatar, public repositories, and follower count via OAuth.</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <span className="w-2 h-2 mt-2.5 rounded-full bg-indigo-500" />
                                    <div>
                                        <span className="text-white font-medium">Chat Conversations</span>
                                        <span className="text-zinc-500"> — Messages to Dev AI are stored to maintain conversation history.</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <span className="w-2 h-2 mt-2.5 rounded-full bg-indigo-500" />
                                    <div>
                                        <span className="text-white font-medium">Search History</span>
                                        <span className="text-zinc-500"> — GitHub users and repositories you search for.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800" />

                    {/* Section 2 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">02</span>
                            <h2 className="text-2xl font-semibold text-white">How We Use Your Data</h2>
                        </div>
                        <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                "Authenticate via GitHub OAuth",
                                "Provide GitHub analytics insights",
                                "Power Dev AI chatbot responses",
                                "Save your chat conversations",
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-zinc-400">
                                    <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800" />

                    {/* Section 3 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">03</span>
                            <h2 className="text-2xl font-semibold text-white">Data Security</h2>
                        </div>
                        <div className="pl-12">
                            <p className="text-zinc-400 leading-relaxed">
                                We implement <span className="text-white font-medium">industry-standard security measures</span> to protect your data.
                                GitHub access tokens are <span className="text-indigo-400">securely encrypted</span> and never exposed.
                                All communications use <span className="text-indigo-400">HTTPS encryption</span>.
                            </p>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800" />

                    {/* Section 4 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">04</span>
                            <h2 className="text-2xl font-semibold text-white">Third-Party Services</h2>
                        </div>
                        <div className="pl-12 flex flex-wrap gap-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
                                <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                </svg>
                                <span className="text-zinc-300 text-sm">GitHub API</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full border border-zinc-800">
                                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-zinc-300 text-sm">NVIDIA AI</span>
                            </div>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800" />

                    {/* Section 5 */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">05</span>
                            <h2 className="text-2xl font-semibold text-white">Your Rights</h2>
                        </div>
                        <div className="pl-12">
                            <p className="text-zinc-400 leading-relaxed">
                                You can <span className="text-indigo-400 font-medium">delete your chat history</span> anytime through the chat interface.
                                For complete data deletion, contact us and we&apos;ll process your request within <span className="text-white font-medium">30 days</span>.
                            </p>
                        </div>
                    </section>

                    {/* Divider */}
                    <div className="h-px bg-zinc-800" />

                    {/* Section 6 - Contact */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl font-bold text-indigo-500/40">06</span>
                            <h2 className="text-2xl font-semibold text-white">Contact</h2>
                        </div>
                        <div className="pl-12 space-y-4">
                            <p className="text-zinc-400 leading-relaxed">
                                For privacy concerns or questions, reach out to us:
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="mailto:anantacoder@gmail.com"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    anantacoder@gmail.com
                                </a>
                                <a
                                    href="https://github.com/AnantaCoder/dev-scope/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                    </svg>
                                    GitHub Issues
                                </a>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
