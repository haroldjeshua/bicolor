import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-8">
      <h1 className="font-mono text-2xl tracking-tight">bicolor</h1>
      <p className="text-muted-foreground text-sm font-mono">
        Pick. Convert. Palette.
      </p>
      <nav className="flex gap-6 text-sm font-mono">
        <Link href="/picker" className="text-foreground hover:underline">
          /picker
        </Link>
        <Link href="/convert" className="text-foreground hover:underline">
          /convert
        </Link>
        <Link href="/palette" className="text-foreground hover:underline">
          /palette
        </Link>
      </nav>
    </div>
  );
}
