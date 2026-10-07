import { SparkleField } from "@/components/brand/sparkle-field";

// Sign-in and first-run setup: no app chrome, just the knight's sparkles in the dark.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10 outline-none">
      <SparkleField />
      <div className="relative w-full">{children}</div>
    </main>
  );
}
