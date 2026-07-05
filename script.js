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
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -56px 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const allSections = [...document.querySelectorAll('main section[id], .case-cover[id]')];
  const activeLinks = [...document.querySelectorAll('.nav-pill a, .case-jump a')]
    .filter((link) => link.hash);

  if (allSections.length && activeLinks.length && 'IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        activeLinks.forEach((link) => {
          const samePage = !link.pathname || link.pathname === window.location.pathname || link.pathname.endsWith(window.location.pathname.split('/').filter(Boolean).pop() || '');
          link.classList.toggle('is-active', entry.isIntersecting && samePage && link.hash === `#${entry.target.id}`);
        });
      });
    }, { threshold: 0.28, rootMargin: '-18% 0px -62% 0px' });

    allSections.forEach((section) => activeObserver.observe(section));
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

  // ═══ ART STRIP — remove this block with the HTML sections to undo ═══
  const artTrack = document.querySelector('.art-strip-track');
  if (artTrack) {
    const inner = artTrack.querySelector('.art-strip-inner');
    if (inner && window.matchMedia('(max-width: 720px)').matches) {
      const items = Array.from(inner.children);
      items.forEach((item) => {
        inner.appendChild(item.cloneNode(true));
      });
      inner.classList.add('is-looping');
    }
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

  const heroRole = document.querySelector('.hero-role');
  if (heroRole) {
    const roles = ['ui/ux designer', 'systems thinker', 'startup builder', 'visual artist'];
    let roleIndex = 0;
    setInterval(() => {
      heroRole.classList.add('is-fading');
      setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        heroRole.textContent = roles[roleIndex];
        heroRole.classList.remove('is-fading');
      }, 320);
    }, 2500);
  }

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
})();
