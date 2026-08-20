'use client';

import { useActionState, useState, useTransition } from 'react';
import Image from 'next/image';
import { uploadListingPhotos, deleteListingPhoto, type UploadResult } from '../photo-actions.ts';
import { toggleListingPublication } from '../publish-actions.ts';

export type PhotoView = { id: string; url: string; position: number };

export function ListingAdminPanel({
  listingId,
  isActive,
  photos,
}: {
  listingId: string;
  isActive: boolean;
  photos: PhotoView[];
}) {
  const [uploadState, uploadAction, uploading] = useActionState<UploadResult | null, FormData>(
    uploadListingPhotos,
    null,
  );
  const [pending, startTransition] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);

  function onToggle() {
    setToggleError(null);
    startTransition(async () => {
      const result = await toggleListingPublication(listingId, !isActive);
      if (!result.ok) setToggleError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded border border-gray-300 bg-white p-5">
        <h2 className="font-medium text-ink-900">Publication</h2>
        <p className="text-sm text-ink-700">
          État actuel :{' '}
          {isActive ? (
            <strong className="text-brand-700">publiée</strong>
          ) : (
            <strong className="text-gray-500">brouillon</strong>
          )}
        </p>
        {toggleError && (
          <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {toggleError}
          </p>
        )}
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          className={
            isActive
              ? 'self-start rounded border border-gray-300 px-5 py-2.5 text-sm font-medium text-ink-900 hover:bg-gray-100 disabled:opacity-50'
              : 'self-start rounded bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50'
          }
        >
          {pending ? 'En cours…' : isActive ? 'Dépublier' : 'Publier'}
        </button>
        {!isActive && photos.length === 0 && (
          <p className="text-sm text-gray-500">
            La publication est refusée tant qu&apos;il n&apos;y a aucune photo.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded border border-gray-300 bg-white p-5">
        <h2 className="font-medium text-ink-900">Photos ({photos.length})</h2>

        {uploadState?.ok === false && (
          <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {uploadState.error}
          </p>
        )}
        {uploadState?.ok === true && (
          <p role="status" className="rounded border border-brand-300 bg-brand-50 p-3 text-sm text-brand-900">
            {uploadState.added} photo(s) ajoutée(s).
          </p>
        )}

        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded border border-gray-300">
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <DeleteButton imageId={photo.id} />
              </li>
            ))}
          </ul>
        )}

        <form action={uploadAction} className="flex flex-col gap-3">
          <input type="hidden" name="listing_id" value={listingId} />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-ink-900">Ajouter des photos</span>
            <span className="text-xs text-gray-500">
              JPEG, PNG ou WebP. 5 Mo maximum par fichier — le marché cible est en 3G.
            </span>
            <input
              type="file"
              name="photos"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="text-sm text-ink-700 file:mr-3 file:rounded file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="self-start rounded bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {uploading ? 'Téléversement…' : 'Téléverser'}
          </button>
        </form>
      </section>
    </div>
  );
}

function DeleteButton({ imageId }: { imageId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteListingPhoto(imageId);
            if (!result.ok) setError(result.error);
          })
        }
        className="text-xs text-gray-500 hover:text-ink-900 disabled:opacity-50"
      >
        {pending ? '…' : 'Supprimer'}
      </button>
      {error && <span className="text-xs text-red-900">{error}</span>}
    </>
  );
}
