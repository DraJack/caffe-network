import * as React from "react";

/** Intestazione + colonna di testo per le pagine informative. */
export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-coffee-950 text-cream">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(201,146,43,0.18),transparent_60%)]"
        />
        <div className="grain absolute inset-0 -z-10" aria-hidden />
        <div className="container-page py-16">
          <h1 className="max-w-3xl animate-fade-up text-balance font-heading text-5xl font-bold tracking-tight">
            {title}
          </h1>
          {intro && (
            <p
              className="mt-5 max-w-2xl animate-fade-up text-lg leading-relaxed text-coffee-200"
              style={{ animationDelay: "80ms" }}
            >
              {intro}
            </p>
          )}
        </div>
      </section>

      <div className="container-page py-14">
        <div className="max-w-2xl space-y-10">{children}</div>
      </div>
    </>
  );
}

export function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-2xl font-bold text-coffee-900">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-coffee-700">{children}</div>
    </section>
  );
}
