import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-zinc-700">404</p>
        <p className="text-zinc-400">This page doesn&apos;t exist.</p>
        <Link href="/" className="inline-block text-sm text-violet-400 hover:text-violet-300 transition-colors">
          Go home
        </Link>
      </div>
    </main>
  );
}
