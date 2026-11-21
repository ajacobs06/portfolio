/* ajacobs.dev: progressive enhancement only. The page reads fine without this file. */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- screen-reader announcer ---------- */
  const sr = document.createElement("div");
  sr.setAttribute("aria-live", "polite");
  sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
  document.body.appendChild(sr);
  const announce = (msg) => { sr.textContent = ""; window.setTimeout(() => { sr.textContent = msg; }, 60); };

  /* ---------- header: hairline once scrolled, highlight the section in view ---------- */
  const top = $(".top");
  const onScroll = () => top.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const navLinks = $$("[data-nav]");
  if ("IntersectionObserver" in window) {
    const setNav = (id) => navLinks.forEach((a) => {
      if (a.dataset.nav === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setNav(e.target.dataset.section || "");
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("[data-section], .hero").forEach((s) => spy.observe(s));
  }

  /* ---------- work: filter by role ---------- */
  const roleKeys = $$("[data-role]");
  const rows = $$(".row");
  const matchCount = $("#match-count");
  const roleNames = { all: "all roles", it: "IT support", systems: "systems", cloud: "cloud", devops: "DevOps" };
  const setRole = (role) => {
    let n = 0;
    roleKeys.forEach((k) => k.setAttribute("aria-pressed", String(k.dataset.role === role)));
    rows.forEach((r) => {
      const roles = (r.dataset.roles || "").split(/\s+/).filter(Boolean);
      const hit = role === "all" || roles.includes(role);
      r.classList.toggle("is-off", !hit);
      if (hit) n += 1;
    });
    if (matchCount) matchCount.textContent = String(n);
    announce(role === "all" ? `Showing all ${n} projects` : `${n} of ${rows.length} projects fit ${roleNames[role]}`);
  };
  roleKeys.forEach((k) => k.addEventListener("click", () => {
    const already = k.getAttribute("aria-pressed") === "true";
    setRole(already && k.dataset.role !== "all" ? "all" : k.dataset.role);
  }));

  /* ---------- live: round trip to the cluster, which pod answered ---------- */
  // Each reply lights the request path once, edge to node, so the dots only move
  // when a real request has just gone through them.
  const rtt = $("#rtt");
  const served = $("#served");
  const hops = $$(".hop");
  const pass = () => {
    if (reduce.matches) return;
    hops.forEach((h, i) => {
      h.classList.remove("is-pass");
      void h.offsetWidth;
      $(".hop__dot", h).style.animationDelay = `${i * 90}ms`;
      h.classList.add("is-pass");
    });
  };
  const ping = () => {
    if (!window.fetch) return;
    const t0 = performance.now();
    fetch("/served-by", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !d.node || !d.pod || d.node.includes("$")) return;
        const ms = Math.min(999, Math.round(performance.now() - t0));
        if (rtt) rtt.textContent = String(ms);
        if (served) {
          served.textContent = "";
          const pod = document.createElement("b");
          pod.textContent = `pod ${d.pod.split("-").pop()}`;
          const node = document.createElement("b");
          node.textContent = d.node;
          served.append("Served by ", pod, " on ", node, ", one of three nodes in my homelab.");
        }
        pass();
      })
      .catch(() => {});
  };
  ping();
  window.setInterval(() => { if (!document.hidden) ping(); }, 15000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ping(); });

  /* ---------- contact: copy email ---------- */
  const copyBtn = $("[data-copy]");
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    copyBtn.setAttribute("aria-label", `Copy email address ${copyBtn.dataset.copy}`);
    const label = $(".copy__txt", copyBtn);
    let t;
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        copyBtn.classList.add("is-copied");
        label.textContent = "Copied";
        announce("Email address copied");
        window.clearTimeout(t);
        t = window.setTimeout(() => { copyBtn.classList.remove("is-copied"); label.textContent = copyBtn.dataset.copy; }, 1800);
      } catch (_) { /* clipboard refused: the mailto button still works */ }
    });
  }
})();
