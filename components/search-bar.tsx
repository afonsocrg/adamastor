"use client";

import type React from "react";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "./tailwind/ui/input";

import posthog from "posthog-js";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({
  placeholder = "Search articles, authors, startups, topics",
  onSearch = () => {},
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  // Debounced search tracking (For now, we're not capturing on submission)
  useEffect(() => {
    if (!query.trim() || query.length < 3) return;

    const timer = setTimeout(() => {
      // Track the search query in PostHog
      posthog.capture("search_query", {
        query: query.trim(),
        page: window.location.pathname,
      });
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full md:max-w-md items-center justify-between space-x-2 ${className}`}
    >
      <div className="relative flex-1 w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 bg-muted border-0 rounded-lg hover:bg-neutral-100 transition-all !text-lg"
        />
      </div>
    </form>
  );
}
