import { LoginForm } from './login-form.tsx';

export const metadata = { title: 'Connexion' };

/**
 * `searchParams` est une promesse depuis Next.js 15 — vérifié dans les guides
 * embarqués de Next 16, pas supposé.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;

  // On n'accepte qu'un chemin interne. Sans ce contrôle, un lien
  // `?suite=https://exemple.test` redirigerait l'utilisateur hors du site
  // après connexion — une redirection ouverte, utile au hameçonnage.
  const destination = suite && suite.startsWith('/') && !suite.startsWith('//') ? suite : '/';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">Connexion</h1>
        <p className="text-sm text-gray-500">Accès à l&apos;espace d&apos;administration.</p>
      </div>
      <LoginForm suite={destination} />
    </main>
  );
}
