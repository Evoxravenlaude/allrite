import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-x mx-auto max-w-page pt-20">
      <h1 className="display text-[44px] leading-none">This page is not here.</h1>
      <p className="mt-4 text-ash">The piece may have sold out or moved. Start again from one of our departments.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/fashion" className="btn-quiet">Fashion</Link>
        <Link href="/furniture" className="btn-quiet">Furniture</Link>
      </div>
    </div>
  );
}
