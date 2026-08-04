"use client";

import { useState } from "react";
import { ListFilter, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SearchField =
  | "query"
  | "genre"
  | "tag"
  | "developer"
  | "publisher"
  | "franchise"
  | "storageDevice"
  | "metadataStatus"
  | "verificationStatus";

export type SearchOperator = "equals" | "not-equals" | "contains";

export interface SearchCondition {
  field: SearchField;
  operator: SearchOperator;
  value: string;
}

export const SEARCH_FIELD_LABELS: Record<SearchField, string> = {
  query: "Keyword",
  genre: "Genre",
  tag: "Tag",
  developer: "Developer",
  publisher: "Publisher",
  franchise: "Franchise",
  storageDevice: "Storage Device",
  metadataStatus: "Metadata Status",
  verificationStatus: "Verification Status",
};

const SEARCH_FIELDS = Object.keys(SEARCH_FIELD_LABELS) as SearchField[];

const OPERATOR_LABELS: Record<SearchOperator, string> = {
  equals: "equals",
  "not-equals": "does not equal",
  contains: "contains",
};

const OPERATORS = Object.keys(OPERATOR_LABELS) as SearchOperator[];

const METADATA_STATUSES = ["MATCHED", "PARTIAL", "UNMATCHED", "MANUAL"];
const VERIFICATION_STATUSES = [
  "VERIFIED",
  "MISSING",
  "MOVED",
  "CORRUPTED",
  "UNKNOWN",
];

function optionsForField(field: SearchField): string[] | null {
  if (field === "metadataStatus") return METADATA_STATUSES;
  if (field === "verificationStatus") return VERIFICATION_STATUSES;
  return null;
}

export function AdvancedSearchBuilder({
  onApply,
  initial = [],
}: {
  onApply: (conditions: SearchCondition[]) => void;
  initial?: SearchCondition[];
}) {
  const [conditions, setConditions] = useState<SearchCondition[]>(initial);

  const addCondition = () => {
    setConditions((previous) => [
      ...previous,
      { field: "query", operator: "contains", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    setConditions((previous) =>
      previous.filter((_, position) => position !== index),
    );
  };

  const updateCondition = (
    index: number,
    changes: Partial<SearchCondition>,
  ) => {
    setConditions((previous) =>
      previous.map((condition, position) =>
        position === index ? { ...condition, ...changes } : condition,
      ),
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListFilter className="w-5 h-5" />
          Advanced Search Builder
        </CardTitle>
        <CardDescription>
          Combine multiple field conditions into one structured query
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No conditions yet. Add one to start building a query.
          </p>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => {
              const options = optionsForField(condition.field);
              return (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-3"
                  data-condition-row={index}
                >
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Field</p>
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        updateCondition(index, {
                          field: value as SearchField,
                          value: "",
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-48"
                        aria-label={`Condition ${index + 1} field`}
                      >
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEARCH_FIELDS.map((field) => (
                          <SelectItem key={field} value={field}>
                            {SEARCH_FIELD_LABELS[field]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Operator</p>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateCondition(index, {
                          operator: value as SearchOperator,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-44"
                        aria-label={`Condition ${index + 1} operator`}
                      >
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((operator) => (
                          <SelectItem key={operator} value={operator}>
                            {OPERATOR_LABELS[operator]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Value</p>
                    {options ? (
                      <Select
                        value={condition.value || undefined}
                        onValueChange={(value) =>
                          updateCondition(index, { value })
                        }
                      >
                        <SelectTrigger
                          className="w-48"
                          aria-label={`Condition ${index + 1} value`}
                        >
                          <SelectValue placeholder="Select a value" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={condition.value}
                        onChange={(event) =>
                          updateCondition(index, { value: event.target.value })
                        }
                        placeholder="Value"
                        aria-label={`Condition ${index + 1} value`}
                        className="w-48"
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    aria-label={`Remove condition ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-border"
            onClick={addCondition}
          >
            <Plus className="w-4 h-4" />
            Add condition
          </Button>
          <Button
            type="button"
            onClick={() => onApply(conditions)}
            disabled={conditions.length === 0}
          >
            <Search className="w-4 h-4" />
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
