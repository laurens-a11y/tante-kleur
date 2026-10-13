import type { MetadataRoute } from "next";
import { site } from "@/config";

// Zoekmachines én AI-zoekmachines (ChatGPT, Claude, Perplexity, Gemini) mogen de
// marketingpagina's lezen; bestel- en uploadpagina's niet.
const nietIndexeren = ["/api/", "/bedankt", "/upload"];

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: nietIndexeren },
      { userAgent: aiCrawlers, allow: "/", disallow: nietIndexeren },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
