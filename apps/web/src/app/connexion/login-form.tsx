'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client.ts';

export function LoginForm({ suite }: { suite: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    });

    if (authError) {
      // On affiche le message réel du service : « Invalid login credentials »
      // et « Email not confirmed » se diagnostiquent très différemment, et un
      // message générique ferait chercher au mauvais endroit.
      setError(authError.message);
      setPending(false);
      return;
    }

    // refresh() force le rendu serveur à relire la session fraîchement posée.
    router.replace(suite);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink-900">Adresse email</span>
        <input name="email" type="email" required autoComplete="email" className={INPUT} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink-900">Mot de passe</span>
        <input name="password" type="password" required autoComplete="current-password" className={INPUT} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand-700 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}

const INPUT =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-700';
