import { useCallback, useState } from 'react';

import { deleteTranslation, getHistory } from '../services/translations';
import type { Translation } from '../types/api';
import { getErrorMessage } from '../utils/errors';

export function useTranslationHistory() {
  const [items, setItems] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getHistory(100);
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteTranslation(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, loading, refreshing, error, load, remove };
}
