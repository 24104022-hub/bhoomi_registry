import { useCallback, useEffect, useRef, useState } from "react";

export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (mounted.current) setData(res);
      })
      .catch((err) => {
        if (mounted.current) setError(err);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, reload: run };
}
