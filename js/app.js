// Renders the sidebar list, the home grid and each project page from window.PROJECTS.
// Pages are addressed by URL hash (e.g. #dicey) so links can be shared and Back works.
(function () {
  // Projects set to false in js/config.js are left out everywhere (list, grid, links, next/previous).
  const visible = (window.CONFIG && window.CONFIG.projects) || {};
  const projects = (window.PROJECTS || []).filter((p) => visible[p.slug] !== false);
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
  const sections = [
    { type: "code", title: "Code" },
    { type: "design", title: "Design" },
  ];

  const nav = document.getElementById("nav");
  const main = document.getElementById("main");
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.querySelector(".menu-toggle");

  // Small helper for building elements: el("a", { href: "#" }, "text", child, ...)
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key === "class") node.className = value;
      else node.setAttribute(key, value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(child));
    }
    return node;
  }

  const coverOf = (p) => p.cover || (p.items.find((i) => i.src) || {}).src;

  function buildNav() {
    for (const s of sections) {
      const list = projects.filter((p) => p.type === s.type);
      if (!list.length) continue;
      nav.append(
        el("section", {},
          el("h2", {}, s.title),
          el("ul", {}, list.map((p) => el("li", {}, el("a", { href: "#" + p.slug, "data-slug": p.slug }, p.title))))
        )
      );
    }
  }

  function renderHome() {
    document.title = "Rodney Gordon";
    main.replaceChildren(
      el("div", { class: "grid" },
        projects.map((p) =>
          el("a", { class: "card", href: "#" + p.slug },
            el("img", { src: coverOf(p), alt: "", loading: "lazy", style: p.coverPosition && "object-position:" + p.coverPosition }),
            el("div", { class: "label" }, el("strong", {}, p.title), el("span", {}, p.type))
          )
        )
      )
    );
  }

  function renderProject(p) {
    document.title = p.title + " | Rodney Gordon";
    const index = projects.indexOf(p);
    const prev = projects[index - 1];
    const next = projects[index + 1];
    const images = p.items.filter((i) => i.src).map((i) => i.src);

    const media = p.items.map((item) => {
      if (item.heading) return el("h2", {}, item.heading);
      if (item.video) {
        return el("div", { class: "video" },
          el("iframe", { src: item.video, title: p.title + " video", loading: "lazy", allowfullscreen: "" }));
      }
      const img = el("img", { src: item.src, alt: item.caption || p.title, loading: "lazy" });
      img.addEventListener("click", () => openLightbox(images, images.indexOf(item.src)));
      return el("figure", {}, img, item.caption && el("figcaption", {}, item.caption));
    });

    main.replaceChildren(
      el("article", { class: "project" },
        el("header", {},
          el("h1", {}, p.title),
          el("p", { class: "description" }, p.description),
          p.tools && p.tools.length ? el("p", { class: "tools" }, p.tools.join(" · ")) : null,
          p.links && p.links.length
            ? el("div", { class: "links" }, p.links.map((l) => el("a", { href: l.url, target: "_blank", rel: "noopener" }, l.label)))
            : null
        ),
        el("div", { class: "media" }, media),
        el("nav", { class: "pager", "aria-label": "More projects" },
          prev ? el("a", { class: "prev", href: "#" + prev.slug }, "← " + prev.title) : null,
          next ? el("a", { class: "next", href: "#" + next.slug }, next.title + " →") : null
        )
      )
    );
  }

  function route() {
    const slug = decodeURIComponent(location.hash.slice(1));
    const project = bySlug[slug];
    if (project) renderProject(project);
    else renderHome();

    nav.querySelectorAll("a").forEach((a) => {
      if (a.dataset.slug === slug) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    sidebar.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  // ----- Lightbox -----
  const lightbox = document.querySelector(".lightbox");
  const lbImg = lightbox.querySelector("img");
  let lbList = [];
  let lbIndex = 0;

  function showLightbox(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIndex];
    const single = lbList.length < 2;
    lightbox.querySelector(".lb-prev").hidden = single;
    lightbox.querySelector(".lb-next").hidden = single;
  }

  function openLightbox(list, i) {
    lbList = list;
    showLightbox(i);
    lightbox.hidden = false;
    lightbox.querySelector(".lb-close").focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
  }

  lightbox.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lb-prev").addEventListener("click", () => showLightbox(lbIndex - 1));
  lightbox.querySelector(".lb-next").addEventListener("click", () => showLightbox(lbIndex + 1));
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showLightbox(lbIndex - 1);
    if (e.key === "ArrowRight") showLightbox(lbIndex + 1);
  });

  // ----- Mobile menu -----
  toggle.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  buildNav();
  window.addEventListener("hashchange", route);
  route();
})();
