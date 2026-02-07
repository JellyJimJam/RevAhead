'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Child } from '@/lib/types';
import { createChild, deleteChild, listChildren, updateChild } from '@/lib/db/children';
import { supabase } from '@/lib/supabaseClient';

export default function ChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [nickname, setNickname] = useState('');
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }

      try {
        const dataChildren = await listChildren();
        setChildren(dataChildren);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load children.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nickname.trim()) {
      return;
    }

    try {
      if (editingChildId) {
        const updated = await updateChild(editingChildId, nickname.trim());
        setChildren((curr) => curr.map((child) => (child.id === updated.id ? updated : child)));
        setEditingChildId(null);
        setNickname('');
        return;
      }

      const created = await createChild(nickname.trim());
      setChildren((curr) => [...curr, created]);
      setNickname('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save child.');
    }
  };

  const handleEdit = (child: Child) => {
    setEditingChildId(child.id);
    setNickname(child.nickname);
  };

  const handleDelete = async (childId: string) => {
    try {
      await deleteChild(childId);
      setChildren((curr) => curr.filter((child) => child.id !== childId));
      if (editingChildId === childId) {
        setEditingChildId(null);
        setNickname('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete child.');
    }
  };

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-6">Loading...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Children</h1>
          <p className="mt-2 text-sm text-slate-600">Manage nicknames for the children in your care.</p>
        </div>
        <Link href="/" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Back to trips</Link>
      </header>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Nickname
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g., Sam" />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {editingChildId ? 'Save changes' : 'Add child'}
          </button>
          {editingChildId && (
            <button type="button" onClick={() => { setEditingChildId(null); setNickname(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        {children.length ? (
          children.map((child) => (
            <div key={child.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">{child.nickname}</p>
                <p className="text-xs text-slate-500">ID: {child.id}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(child)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">Edit</button>
                <button onClick={() => handleDelete(child.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No children added yet.</p>
        )}
      </section>
    </main>
  );
}
