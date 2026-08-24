(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const header = document.querySelector('[data-header]');
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Case-study jump nav: centered when every pill fits, but once the
  // window narrows enough that it overflows, switch to left-aligned so the
  // scrollable list starts at the first item instead of opening already
  // scrolled to a centered midpoint with both ends cut off.
  const caseJump = document.querySelector('.case-jump');
  if (caseJump) {
    const syncCaseJumpOverflow = () => {
      caseJump.classList.toggle('is-overflowing', caseJump.scrollWidth > caseJump.clientWidth + 1);
    };
    syncCaseJumpOverflow();
    window.addEventListener('resize', syncCaseJumpOverflow, { passive: true });
  }

  const navToggle = document.querySelector('[data-nav-toggle]');
  const navMenu = document.querySelector('[data-nav-menu]');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      navMenu.classList.toggle('is-open', !isOpen);
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
      });
    });
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    // threshold: 0 (not a specific ratio like 0.12) so this can't miss the
    // crossing on a fast scroll the way the nav highlighter used to: any
    // intersection at all is enough to reveal, instead of requiring the
    // browser to sample a frame at exactly that ratio.
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -56px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const allSections = [...document.querySelectorAll('main section[id], .case-cover[id]')];
  const activeLinks = [...document.querySelectorAll('.case-jump a')]
    .filter((link) => link.hash);

  if (allSections.length && activeLinks.length && 'IntersectionObserver' in window) {
    // The last tracked section (reflection) can get stuck "active" once the
    // page is scrolled to its max, if the content below it (footer, etc.)
    // isn't tall enough to clear the section out of the observer's band
    // first. Once there's nowhere left to scroll, no section is really
    // "current" anymore, so treat that as nothing being active.
    const isAtPageBottom = () =>
      window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;

    // A specific ratio threshold (e.g. 0.28) only fires the callback when
    // intersection crosses that exact ratio. On a fast scroll the browser
    // can sample before and after a section's whole visible window without
    // ever landing a frame inside it, skipping the crossing entirely and
    // leaving the link stuck in its last reported state — worse for short
    // sections, which have a narrower window to get sampled inside of.
    // threshold: 0 fires on any enter/exit of the band instead, which is
    // the boundary browsers reliably report regardless of scroll speed.
    //
    // Two adjacent sections can both be short enough to sit inside the
    // band at once (e.g. a compact Define next to a compact Ideation), so
    // track everyone currently intersecting and only ever light up the
    // bottom-most of them, instead of toggling each link independently.
    const intersectingIds = new Set();
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          intersectingIds.add(entry.target.id);
        } else {
          intersectingIds.delete(entry.target.id);
        }
      });

      const atBottom = isAtPageBottom();
      let currentId = null;
      if (!atBottom) {
        for (let i = allSections.length - 1; i >= 0; i--) {
          if (intersectingIds.has(allSections[i].id)) {
            currentId = allSections[i].id;
            break;
          }
        }
      }

      activeLinks.forEach((link) => {
        link.classList.toggle('is-active', link.hash === `#${currentId}`);
      });
    }, { threshold: 0, rootMargin: '-18% 0px -62% 0px' });

    allSections.forEach((section) => activeObserver.observe(section));

    // The observer only re-fires when a ratio crosses the threshold, which
    // may not happen on the exact scroll tick that reaches the bottom, so
    // also clear on scroll as a direct backstop.
    window.addEventListener('scroll', () => {
      if (isAtPageBottom()) {
        activeLinks.forEach((link) => link.classList.remove('is-active'));
      }
    }, { passive: true });
  }

  if (finePointer && !prefersReducedMotion) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (event) => {
      document.body.style.setProperty('--cursor-x', `${event.clientX}px`);
      document.body.style.setProperty('--cursor-y', `${event.clientY}px`);
      if (glow) glow.style.opacity = '1';
    }, { passive: true });

    document.querySelectorAll('.interactive-card, .artifact-card, .small-work-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 5;
        const rotateX = (((y / rect.height) - 0.5) * -5);
        card.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
        card.style.setProperty('--ty', '-3px');
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--ty', '0px');
      });
    });
  }

  document.querySelectorAll('[data-copy-email]').forEach((button) => {
    button.addEventListener('click', async () => {
      const email = button.dataset.copyEmail;
      try {
        await navigator.clipboard.writeText(email);
        showToast('Email copied to clipboard');
      } catch (error) {
        showToast(email);
      }
    });
  });

  document.querySelectorAll('[data-placeholder]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showToast(link.dataset.placeholder || 'Case study coming soon.');
    });
  });

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const localTimeNode = document.querySelector('[data-local-time]');
  if (localTimeNode) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const updateLocalTime = () => {
      localTimeNode.textContent = formatter.format(new Date());
    };
    updateLocalTime();
    setInterval(updateLocalTime, 1000);
  }

  // ═══ ART CAROUSEL — remove this block with the HTML sections to undo ═══
  const artCarousel = document.querySelector('[data-art-carousel]');
  if (artCarousel) {
    const track = artCarousel.querySelector('[data-art-track]');
    const slides = [...track.querySelectorAll('.art-carousel-slide')];
    const prevBtn = artCarousel.querySelector('[data-art-prev]');
    const nextBtn = artCarousel.querySelector('[data-art-next]');

    let activeIndex = 0;
    let autoTimer = null;
    let resumeTimer = null;
    let scrollRAF = null;
    let isProgrammaticScroll = false;
    let programmaticScrollFallback = null;

    function renderActive() {
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === activeIndex));
    }

    function setActive(index, { scroll = true } = {}) {
      activeIndex = (index + slides.length) % slides.length;
      renderActive();
      if (scroll) {
        // Absolute target, not a relative scrollBy: relative deltas compound when
        // the auto-advance timer and a user click land close together, which was
        // producing the "jump then re-center" glitch. Center point is computed via
        // rect (stable under the slide's scale transform since scaling is center-
        // origin) translated into the track's own scroll space via its current
        // scrollLeft, so this is correct even mid-transition.
        const slide = slides[activeIndex];
        const trackRect = track.getBoundingClientRect();
        const slideRect = slide.getBoundingClientRect();
        const slideCenterInScrollSpace = slideRect.left + slideRect.width / 2 - trackRect.left + track.scrollLeft;
        const target = slideCenterInScrollSpace - track.clientWidth / 2;
        // While this scroll animates, ignore the 'scroll' listener's own closest-
        // slide detection below — otherwise it reads intermediate positions
        // mid-flight and reassigns activeIndex before the animation finishes,
        // which is what caused the visible "settle, then re-center" glitch.
        isProgrammaticScroll = true;
        clearTimeout(programmaticScrollFallback);
        programmaticScrollFallback = setTimeout(() => { isProgrammaticScroll = false; }, 1200);
        track.scrollTo({ left: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }

    function closestToCenter() {
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      slides.forEach((slide, i) => {
        const rect = slide.getBoundingClientRect();
        const dist = Math.abs((rect.left + rect.width / 2) - center);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      return closest;
    }

    track.addEventListener('scrollend', () => {
      isProgrammaticScroll = false;
      clearTimeout(programmaticScrollFallback);
    });

    track.addEventListener('scroll', () => {
      if (isProgrammaticScroll) return;
      if (scrollRAF) return;
      scrollRAF = requestAnimationFrame(() => {
        scrollRAF = null;
        const idx = closestToCenter();
        if (idx !== activeIndex) {
          activeIndex = idx;
          renderActive();
        }
      });
    }, { passive: true });

    function startAuto() {
      if (prefersReducedMotion) return;
      clearInterval(autoTimer);
      autoTimer = setInterval(() => setActive(activeIndex + 1), 4200);
    }

    function pauseAuto() {
      clearInterval(autoTimer);
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(startAuto, 6000);
    }

    slides.forEach((slide, i) => {
      slide.addEventListener('click', () => {
        setActive(i);
        pauseAuto();
      });
    });
    prevBtn?.addEventListener('click', () => { setActive(activeIndex - 1); pauseAuto(); });
    nextBtn?.addEventListener('click', () => { setActive(activeIndex + 1); pauseAuto(); });
    track.addEventListener('pointerdown', pauseAuto, { passive: true });
    track.addEventListener('wheel', pauseAuto, { passive: true });

    const initialIndex = Math.floor(slides.length / 2);
    requestAnimationFrame(() => setActive(initialIndex));
    startAuto();
  }

  const lightbox = document.getElementById('art-lightbox');
  if (lightbox) {
    const lightboxImg = lightbox.querySelector('img');
    // About page art grid
    document.querySelector('.art-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.art-item[data-insight]');
      if (btn) {
        lightboxImg.src = btn.dataset.src;
        lightboxImg.alt = btn.dataset.title || '';
        lightbox.querySelector('.art-lightbox-title').textContent = btn.dataset.title || '';
        lightbox.querySelector('.art-lightbox-insight').textContent = btn.dataset.insight || '';
        lightbox.classList.add('is-open');
        lightbox.querySelector('.art-lightbox-close').focus();
      }
    });
    lightbox.addEventListener('click', () => {
      lightbox.classList.remove('is-open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('is-open');
    });
  }
  // ═══ END ART STRIP ═══
  // ═══ END ART STRIP LIGHTBOX ═══

  // ── Before/after toggle ──
  document.querySelectorAll('.ba-toggle-wrap').forEach((wrap) => {
    const btns = wrap.querySelectorAll('.ba-btn');
    const before = wrap.querySelector('.ba-before');
    const after = wrap.querySelector('.ba-after');
    if (!before || !after || !btns.length) return;
    before.classList.add('is-visible');
    btns[0].classList.add('is-active');
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        before.classList.toggle('is-visible', i === 0);
        after.classList.toggle('is-visible', i === 1);
      });
    });
  });

  // ── Tab groups ──
  document.querySelectorAll('[data-tabs]').forEach((group) => {
    const tabs = [...group.querySelectorAll('.tab-btn')];
    const panels = [...group.querySelectorAll('.tab-panel')];
    if (!tabs.length || !panels.length) return;
    tabs[0].classList.add('is-active');
    panels[0].classList.add('is-active');
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('is-active'));
        panels.forEach((p) => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        if (panels[i]) panels[i].classList.add('is-active');
      });
    });
  });

  // ── Journey subway map ──
  document.querySelectorAll('.journey-subway').forEach((map) => {
    const stops = [...map.querySelectorAll('.subway-stop')];
    const panels = [...map.querySelectorAll('.subway-panel')];
    const fill = map.querySelector('.subway-track-fill');
    const wrap = map.querySelector('.subway-track-wrap');
    const CIRC = 119.4;
    const DURATION = 10000;
    const TICK = 80;
    let timer = null;
    let elapsed = 0;
    let current = 0;

    function setFill(idx) {
      if (!fill || !wrap) return;
      const wrapRect = wrap.getBoundingClientRect();
      const getDotCenter = (stop) => {
        const r = stop.querySelector('.stop-dot-wrap').getBoundingClientRect();
        return r.left + r.width / 2 - wrapRect.left;
      };
      const startX = getDotCenter(stops[0]);
      const endX = getDotCenter(stops[idx]);
      fill.style.left = `${startX}px`;
      fill.style.width = `${Math.max(0, endX - startX)}px`;
    }

    function resetRings() {
      stops.forEach((s) => {
        const ring = s.querySelector('.ring-prog');
        if (ring) ring.style.strokeDashoffset = CIRC;
      });
    }

    function startTimer(idx) {
      clearInterval(timer);
      elapsed = 0;
      resetRings();
      const ring = stops[idx].querySelector('.ring-prog');
      timer = setInterval(() => {
        elapsed += TICK;
        const pct = Math.min(elapsed / DURATION, 1);
        if (ring) ring.style.strokeDashoffset = CIRC * (1 - pct);
        if (elapsed >= DURATION) {
          clearInterval(timer);
          activate((idx + 1) % stops.length);
        }
      }, TICK);
    }

    function activate(idx) {
      current = idx;
      stops.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      panels.forEach((p, i) => p.classList.toggle('is-active', i === idx));
      setFill(idx);
      startTimer(idx);
    }

    stops.forEach((stop, i) => stop.addEventListener('click', () => activate(i)));

    requestAnimationFrame(() => activate(0));
    window.addEventListener('resize', () => setFill(current), { passive: true });
  });

  // ── Stat counter animation ──
  const countEls = document.querySelectorAll('[data-count-to]');
  if (countEls.length && !prefersReducedMotion && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.countTo, 10);
        const suffix = el.dataset.countSuffix || '';
        const duration = 900;
        const startTime = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    countEls.forEach((el) => countObserver.observe(el));
  }

  const heroRole = document.querySelector('.hero-role');
  if (heroRole) {
    const roles = ['UI/UX Designer', 'Systems Thinker', 'Startup Builder', 'Visual Artist'];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let roleIndex = 0;

    if (prefersReducedMotion) {
      heroRole.textContent = roles[0];
      setInterval(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        heroRole.textContent = roles[roleIndex];
      }, 2000);
    } else {
      const typeSpeed = 55;
      const deleteSpeed = 32;
      const holdTime = 1300;
      const pauseBeforeType = 300;

      const typeRole = () => {
        const role = roles[roleIndex];
        let charIndex = 0;
        const typeChar = () => {
          charIndex++;
          heroRole.textContent = role.slice(0, charIndex);
          if (charIndex < role.length) {
            setTimeout(typeChar, typeSpeed);
          } else {
            setTimeout(deleteRole, holdTime);
          }
        };
        typeChar();
      };

      const deleteRole = () => {
        const role = roles[roleIndex];
        let charIndex = role.length;
        const deleteChar = () => {
          charIndex--;
          heroRole.textContent = role.slice(0, charIndex);
          if (charIndex > 0) {
            setTimeout(deleteChar, deleteSpeed);
          } else {
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(typeRole, pauseBeforeType);
          }
        };
        deleteChar();
      };

      heroRole.textContent = '';
      typeRole();
    }
  }

  // Floating skill chips — click to pop
  document.querySelectorAll('.skill-chip-float').forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.closest('.chip-anchor').classList.add('chip-popped');
    });
  });

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  // ── Card / image sliders ──
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const slides = [...slider.querySelectorAll('[data-slide]')];
    if (!slides.length) return;
    const prevBtn = slider.querySelector('[data-prev]');
    const nextBtn = slider.querySelector('[data-next]');
    const countEl = slider.querySelector('.iter-count');
    let current = 0;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      if (countEl) countEl.textContent = `${current + 1} / ${slides.length}`;
    }

    prevBtn?.addEventListener('click', () => show(current - 1));
    nextBtn?.addEventListener('click', () => show(current + 1));
    show(0);
  });

  // ── Summary / full case study toggle ──
  const viewToggle = document.querySelector('[data-view-toggle]');
  if (viewToggle) {
    const summaryBtn = viewToggle.querySelector('[data-view-summary]');
    const fullBtn = viewToggle.querySelector('[data-view-full]');

    function setView(condensed) {
      document.body.classList.toggle('is-condensed', condensed);
      summaryBtn.classList.toggle('is-active', condensed);
      fullBtn.classList.toggle('is-active', !condensed);
      summaryBtn.setAttribute('aria-pressed', String(condensed));
      fullBtn.setAttribute('aria-pressed', String(!condensed));
    }

    document.body.classList.add('is-condensed');
    summaryBtn.addEventListener('click', () => {
      setView(true);
      showToast('Showing summary');
    });
    fullBtn.addEventListener('click', () => {
      setView(false);
      showToast('Showing full case study');
    });
  }
})();
