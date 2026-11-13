import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Who Like TAC Is For",
  description: "A place for curious everyday users and evolving professionals to understand serious technology without the gatekeeping.",
};

const audiences = [
  { number: "01", eyebrow: "Curiosity meets capability", title: "Curious and capable", copy: <><strong>For the curious everyday user and the evolving professional alike,</strong> Like TAC is built for people who sit at the intersection of curiosity and capability. We do not sort people into strict boxes of “tech expert” or “total beginner.” Whether you are a non-technical professional managing digital tools or a tech-savvy creator stepping outside your comfort zone, complex concepts are leveled out so no one is talked down to and no one is left behind.</>, action: "Explore the Archive", href: "/shows" },
  { number: "02", eyebrow: "Engineering with personality", title: "Serious tech. Human delivery.", copy: <><strong>For people who need serious tech explained without the serious attitude,</strong> we turn dense technology into useful ideas anyone can understand—and maybe laugh at along the way. We strip away gatekeeping and exhausting jargon, replacing them with relatable insights and practical takeaways. It is serious engineering with a human perspective for anyone who wants to stay informed, sharp, and entertained by the technology shaping daily life.</>, action: "Browse All Shows", href: "/shows" },
  { number: "03", eyebrow: "A practical head start", title: "New platform. Faster bearings.", copy: <><strong>For technical people approaching an unfamiliar platform or configuration for the first time,</strong> we build the foundations you need to get your bearings quickly. When you enter a new ecosystem, product, or complex setup, you may not have time for hundreds of pages of documentation. Like TAC gives you a high-level, practical blueprint so you can bridge the gap and execute with confidence.</>, action: "Sign Up Free", href: "/signup" },
];

export default function WhoItsForPage() {
  return <main className="whoPage">
    <section className="whoHero">
      <div className="whoSignal" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="whoHeroCopy"><span className="kicker">Different starting points. One shared curiosity.</span><h1>Who is <span>Like TAC</span> for?</h1><p>For people navigating the space between “I should understand this” and “now I know where to start.”</p><a className="whoScrollCue" href="#find-yourself">Find yourself here <span aria-hidden="true">↓</span></a></div>
      <div className="whoOrbit" aria-hidden="true"><div className="whoOrbitRing ringOne" /><div className="whoOrbitRing ringTwo" /><span className="orbitLabel labelCurious">CURIOUS</span><span className="orbitLabel labelTechnical">TECHNICAL</span><span className="orbitLabel labelEvolving">EVOLVING</span><strong>YOU</strong></div>
    </section>
    <section className="whoStories" id="find-yourself" aria-labelledby="who-stories-title">
      <div className="whoStoriesIntro"><span className="eyebrow">No rigid boxes</span><h2 id="who-stories-title">Start wherever you are.</h2><p>Each episode is designed to close the distance between unfamiliar and useful.</p></div>
      <div className="whoStoryList">{audiences.map((audience) => <article className="whoStory" key={audience.number}><span className="whoStoryNumber" aria-hidden="true">{audience.number}</span><div><span className="eyebrow">{audience.eyebrow}</span><h2>{audience.title}</h2><p>{audience.copy}</p><Link className="button primary" href={audience.href}>{audience.action}</Link></div></article>)}</div>
    </section>
    <section className="whoFinalCallout"><span className="eyebrow">Learn on your terms</span><h2>Stay curious. We’ll make the technology make sense.</h2><p>Join free to explore the complete archive and download audio or video episodes whenever you are ready to dive in.</p><div className="buttonRow"><Link className="button primary" href="/signup">Join Like TAC Free</Link><Link className="button outlineOnDark" href="/shows">Browse the Archive</Link></div></section>
  </main>;
}
