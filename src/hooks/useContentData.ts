import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, ContentItem, ContentItemWithCategory } from '../lib/database.types';

export function useContentData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentItems, setContentItems] = useState<ContentItemWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  };

  const fetchContentItems = async () => {
    const { data, error } = await supabase
      .from('content_items')
      .select('*, category:categories(*)');

    if (error) throw error;
    return data as ContentItemWithCategory[];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, items] = await Promise.all([
        fetchCategories(),
        fetchContentItems()
      ]);
      setCategories(cats);
      setContentItems(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    setCategories([...categories, data]);
    return data;
  };

  const addContentItem = async (item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('content_items')
      .insert(item)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    setContentItems([...contentItems, data as ContentItemWithCategory]);
    return data;
  };

  const updateContentItem = async (id: string, updates: Partial<ContentItem>) => {
    const { data, error } = await supabase
      .from('content_items')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    setContentItems(contentItems.map(item => item.id === id ? data as ContentItemWithCategory : item));
    return data;
  };

  const deleteContentItem = async (id: string) => {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setContentItems(contentItems.filter(item => item.id !== id));
  };

  return {
    categories,
    contentItems,
    loading,
    error,
    addCategory,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    refresh: loadData
  };
}
