"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Kërko...",
  delay = 350,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [local, setLocal] = useState(value);

  // Debounce — mos dërgo kërkesë me çdo shkronjë
  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local);
    }, delay);

    return () => clearTimeout(timer);
  }, [local, delay, onChange, value]);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={2}
      />
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-56 rounded-md border border-border bg-transparent pl-9 pr-8 text-[13px] outline-none transition-colors focus:border-primary/50"
      />
      {local && (
        <button
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}