function collect(href) {
      const uniq = (xs) => {
        const s = new Set();
        const out = [];
        for (const x of xs) {
          const t = (x || "").trim();
          if (!t || s.has(t)) continue;
          s.add(t);
          out.push(t);
        }
        return out;
      };

      const visible = [...document.querySelectorAll("body *")].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 2 && r.height > 2 && cs.display !== "none" && cs.visibility !== "hidden";
      });

      const computedFonts = [];
      const colors = [];
      const backgrounds = [];
      const radii = [];
      const animations = [];
      const samples = [];

      const pickSelector = (el) => {
        if (el.id) return `#${el.id}`;
        const cls = [...el.classList].slice(0, 2).join(".");
        if (cls) return `${el.tagName.toLowerCase()}.${cls}`;
        return el.tagName.toLowerCase();
      };

      const interesting = new Set(["body", "h1", "h2", "h3", "header", "nav", "main", "section", "button", "a"]);
      for (const el of visible.slice(0, 500)) {
        const cs = getComputedStyle(el);
        computedFonts.push(cs.fontFamily);
        colors.push(cs.color);
        const bg =
          cs.backgroundImage && cs.backgroundImage !== "none"
            ? `${cs.backgroundImage} / ${cs.backgroundColor}`
            : cs.backgroundColor;
        backgrounds.push(bg);
        radii.push(cs.borderRadius);
        if (cs.animationName && cs.animationName !== "none") {
          animations.push(`${cs.animationName} ${cs.animationDuration}`);
        }
        const tag = el.tagName.toLowerCase();
        if (interesting.has(tag) || el.className.toString().match(/hero|card|feature|cta/i)) {
          samples.push({
            selector: pickSelector(el),
            fontFamily: cs.fontFamily,
            color: cs.color,
            background: bg,
            borderRadius: cs.borderRadius,
            padding: cs.padding,
            textAlign: cs.textAlign,
            gridTemplateColumns: cs.gridTemplateColumns,
          });
        }
      }

      const declaredFonts = [];
      const keyframes = [];
      const sectionPaddings = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules = [];
        try {
          rules = Array.from(sheet.cssRules);
        } catch {
          continue;
        }
        for (const rule of rules) {
          const css = rule.cssText || "";
          const fm = css.match(/font-family:\s*([^;]+)/gi);
          if (fm) {
            for (const m of fm) declaredFonts.push(m.replace(/font-family:\s*/i, ""));
          }
          if (rule instanceof CSSKeyframesRule) {
            keyframes.push(`@keyframes ${rule.name} { ${rule.cssText.slice(0, 180)} }`);
          }
        }
      }
      for (const styleEl of Array.from(document.querySelectorAll("style"))) {
        const css = styleEl.textContent || "";
        const fm = css.match(/font-family:\s*([^;]+)/gi);
        if (fm) for (const m of fm) declaredFonts.push(m.replace(/font-family:\s*/i, ""));
        const kf = css.match(/@keyframes\s+[\w-]+\s*\{[^}]+\}/gi);
        if (kf) keyframes.push(...kf.map((k) => k.replace(/\s+/g, " ").slice(0, 220)));
      }

      const googleFonts = [...document.querySelectorAll('link[href*="fonts.google"]')].map(
        (l) => l.href,
      );

      const headings = [...document.querySelectorAll("h1,h2,h3")].map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || "").replace(/\s+/g, " ").trim(),
      }));
      const paragraphs = [...document.querySelectorAll("p")]
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0)
        .slice(0, 30);
      const buttons = [...document.querySelectorAll("button, a, [role=button]")]
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0 && t.length < 48);
      const links = [...document.querySelectorAll("a[href]")].map((a) => a.href);

      const html = document.documentElement.outerHTML;
      const hasLucide =
        /lucide/i.test(html) ||
        !!document.querySelector("[data-lucide], .lucide, svg.lucide") ||
        googleFonts.some((g) => /lucide/i.test(g));
      const svgIconCount = document.querySelectorAll("svg").length;

      const cardLike = visible.filter((el) => {
        const cls = el.className.toString();
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const looksCard =
          /card|feature/i.test(cls) ||
          (r.width > 180 &&
            r.width < 420 &&
            r.height > 120 &&
            r.height < 520 &&
            parseFloat(cs.borderRadius) >= 8 &&
            el.querySelector("h2,h3,h4") &&
            el.querySelector("p"));
        return looksCard;
      });
      const widths = cardLike.map((el) => Math.round(el.getBoundingClientRect().width));
      const featureCardCount = cardLike.length;
      const equalWidthCards =
        widths.length >= 3 && widths.slice(0, 3).every((w) => Math.abs(w - widths[0]) <= 16);

      const hero =
        (document.querySelector("header, .hero, [class*=hero], section")) ||
        document.body;
      const heroTextAlign = getComputedStyle(hero).textAlign;

      for (const sec of Array.from(document.querySelectorAll("section, header, footer, main"))) {
        sectionPaddings.push(getComputedStyle(sec).padding);
      }

      return {
        url: href,
        title: document.title,
        headings,
        paragraphs,
        buttons: uniq(buttons).slice(0, 20),
        links: uniq(links).slice(0, 20),
        bodyText: (document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 4000),
        computedFonts: uniq(computedFonts).slice(0, 20),
        declaredFonts: uniq(declaredFonts).slice(0, 20),
        googleFonts,
        backgrounds: uniq(backgrounds).slice(0, 30),
        colors: uniq(colors).slice(0, 20),
        radii: uniq(radii).slice(0, 12),
        sectionPaddings: sectionPaddings.slice(0, 24),
        animations: uniq(animations).slice(0, 12),
        keyframes: uniq(keyframes).slice(0, 8),
        hasLucide,
        svgIconCount,
        featureCardCount,
        equalWidthCards,
        heroTextAlign,
        samples: samples.slice(0, 24),
      };
}
