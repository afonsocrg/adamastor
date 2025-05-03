"use client";

import type React from "react";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "./tailwind/ui/input";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({ placeholder = "Search", onSearch = () => {}, className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full max-w-sm items-center justify-between space-x-2 ${className}`}
    >
      <div className="relative flex-1 w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 bg-muted border-0 rounded-md"
        />
      </div>
    </form>
  );
}
