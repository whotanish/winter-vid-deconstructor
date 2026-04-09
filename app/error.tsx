"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-zinc-400">Something went wrong.</p>
        <button
          onClick={reset}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
