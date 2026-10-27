import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <span className="kicker">Tech talk without the tech headache</span>
          <h1>Serious tech.<br /><span>For the rest of us.</span></h1>
          <p className="heroCopy">Relaxed conversations that turn complicated technology into useful ideas anyone can understand—and maybe laugh at along the way.</p>
          <div className="buttonRow">
            <Link className="button primary" href="/shows/ai-useful-coworker">Play Latest Episode</Link>
            <Link className="button outlineOnDark" href="/shows">Browse All Shows</Link>
          </div>
        </div>
        <article className="featuredEpisode">
          <div className="episodeArtwork" aria-hidden="true"><span>🎙️</span></div>
          <h2>“Wait… what does the cloud actually do?”</h2>
          <p>Like TAC Podcast · Illustrative Episode 01 · 32 min</p>
        </article>
      </section>
      <section className="audience" id="audience">
        <div className="sectionHeading">
          <div><span className="eyebrow">Made for curious learners</span><h2>Technical enough to be useful. Simple enough to enjoy.</h2></div>
          <strong>Like TAC creates the podcasts—you enjoy them.</strong>
        </div>
        <div className="cardGrid">
          <article className="card">
            <span className="tag">New to the technology</span><h3>Build a useful foundation</h3>
            <p>For technical people approaching an unfamiliar platform, product, or configuration for the first time.</p>
            <Link className="button primary" href="/shows">Browse Technical Topics</Link>
          </article>
          <article className="card">
            <span className="tag">Beginner or nontechnical</span><h3>Learn without being talked down to</h3>
            <p>Explore subjects such as AI through clear explanations, everyday examples, and relaxed conversation.</p>
          </article>
          <article className="card darkCard">
            <span className="tag">Free membership</span><h3>Come back whenever you’re curious</h3>
            <p>Sign up to watch the complete archive and download audio or video episodes for later.</p>
            <Link className="button primary" href="/signup">Sign Up Free</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
