import type { ReactNode } from "react";

export function AuthShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <main className="formPage"><section className="formCard" aria-labelledby="form-title"><p className="eyebrow">{eyebrow}</p><h1 id="form-title">{title}</h1><p className="formIntro">{intro}</p>{children}</section></main>;
}
