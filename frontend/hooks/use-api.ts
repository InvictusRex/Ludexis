"use client";

import { DependencyList, useCallback, useEffect, useState } from "react";

interface ApiState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

// Loads data when `deps` change and ignores responses that arrive after a newer request.
export function useApi<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<ApiState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState((previous) => ({ ...previous, loading: true }));
    load().then(
      (data) => current && setState({ data, error: undefined, loading: false }),
      (error) => current && setState({ data: undefined, error, loading: false }),
    );
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, reload, setData: (data: T) => setState((s) => ({ ...s, data })) };
}
