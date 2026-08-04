"use client";

import Link from "next/link";
import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface RelationshipItem {
  label: string;
  title: string;
  href: string;
}

interface RelationshipVisualizerProps {
  title: string;
  relations: RelationshipItem[];
}

export function RelationshipVisualizer({
  title,
  relations,
}: RelationshipVisualizerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {relations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No relationships yet
          </p>
        ) : (
          <ul className="space-y-2">
            {relations.map((relation, index) => (
              <li key={`${relation.href}-${index}`}>
                <Link
                  href={relation.href}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent transition-colors group"
                >
                  <GitBranch className="w-4 h-4 text-accent shrink-0" />
                  <Badge variant="secondary" className="text-xs">
                    {relation.label}
                  </Badge>
                  <span className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {relation.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
