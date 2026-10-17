export default function InfoPage({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <article className="page-x mx-auto max-w-page pt-10 sm:pt-14 grid lg:grid-cols-12 gap-10">
      <header className="lg:col-span-4">
        <h1 className="display text-[40px] sm:text-[52px] leading-[1.02]">{title}</h1>
        {lead && <p className="mt-4 text-ash text-[15px] max-w-[40ch]">{lead}</p>}
      </header>
      <div className="lg:col-span-7 lg:col-start-6 text-[15px] leading-[1.75] max-w-[64ch] space-y-5 [&_h2]:text-[17px] [&_h2]:mt-10 [&_h2]:mb-1 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </article>
  );
}
