import { BookOpen, Library, ShieldCheck } from 'lucide-react';

export function Presentation() {
  return (
    <section className="presentation" aria-labelledby="presentation-title">
      <div className="brand-mark" aria-label="BookNest logo">
        <BookOpen size={34} aria-hidden="true" />
      </div>
      <div className="presentation-copy">
        <p className="eyebrow">Personal library tracker</p>
        <h1 id="presentation-title">BookNest</h1>
        <p className="tagline">Your personal library, reimagined.</p>
        <p>
          BookNest helps readers catalogue physical books, track reading progress, and remember which
          titles are currently lent to friends.
        </p>
      </div>
      <div className="feature-strip">
        <span>
          <Library size={18} aria-hidden="true" />
          Paginated library
        </span>
        <span>
          <ShieldCheck size={18} aria-hidden="true" />
          Validated forms
        </span>
      </div>
    </section>
  );
}
