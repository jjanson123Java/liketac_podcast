"use client";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { const useDark = window.localStorage.getItem("like-tac-theme") === "dark"; setDark(useDark); document.documentElement.dataset.theme = useDark ? "dark" : "light"; }, []);
  function toggleTheme() { const nextDark = !dark; setDark(nextDark); document.documentElement.dataset.theme = nextDark ? "dark" : "light"; window.localStorage.setItem("like-tac-theme", nextDark ? "dark" : "light"); }
  return <button className="button quiet" onClick={toggleTheme} type="button">{dark ? "Light mode" : "Dark mode"}</button>;
}
