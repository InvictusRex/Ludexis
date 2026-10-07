import Link from "next/link";
import { EmptyState } from "@/components/brand/empty-state";
import { SparkleField } from "@/components/brand/sparkle-field";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center overflow-hidden">
      <SparkleField />
      <EmptyState
        prominent
        className="relative"
        title="Nothing is kept here"
        description="This page doesn't exist, or it was moved."
        action={
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        }
      />
    </main>
  );
}
