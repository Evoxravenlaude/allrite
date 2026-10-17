import type { Metadata } from 'next';
import SavedList from '@/components/shop/SavedList';

export const metadata: Metadata = { title: 'Saved', robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="page-x mx-auto max-w-page pt-10 sm:pt-14">
      <h1 className="display text-[40px] sm:text-[56px] leading-none">Saved</h1>
      <SavedList />
    </div>
  );
}
