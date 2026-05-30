/* =====================================================
   BIZTEL.AI — Landing interactions
   ===================================================== */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Year ----------
document.getElementById('yr').textContent = new Date().getFullYear();

// ---------- Sticky nav ----------
const nav = document.getElementById('nav');
const progress = document.getElementById('scrollProgress');
const onScroll = () => {
  const y = window.scrollY;
  if (y > 30) nav.classList.add('is-scrolled');
  else nav.classList.remove('is-scrolled');
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = Math.min(100, (y / max) * 100) + '%';
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Cursor glow ----------
const glow = document.getElementById('cursorGlow');
let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
let tx = gx, ty = gy;
let mouseX = tx, mouseY = ty;
window.addEventListener('mousemove', (e) => {
  tx = e.clientX;
  ty = e.clientY;
  mouseX = e.clientX;
  mouseY = e.clientY;
});
const animateGlow = () => {
  gx += (tx - gx) * 0.12;
  gy += (ty - gy) * 0.12;
  glow.style.left = gx + 'px';
  glow.style.top = gy + 'px';
  requestAnimationFrame(animateGlow);
};
animateGlow();

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal, .section-head, .cap, .ind-card').forEach((el) => io.observe(el));

// ---------- Char split for hero title ----------
document.querySelectorAll('[data-split]').forEach((el) => {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c, i) => {
    const span = document.createElement('span');
    span.className = c === ' ' ? 'ch sp' : 'ch';
    span.textContent = c === ' ' ? ' ' : c;
    span.style.transitionDelay = (i * 28) + 'ms';
    el.appendChild(span);
  });
});

const revealChars = () => {
  document.querySelectorAll('.line__inner .ch').forEach((c) => c.classList.add('is-in'));
};

// ---------- Glitch on hero title (occasional) ----------
const heroTitle = document.querySelector('.hero__title');
if (heroTitle && !reduced) {
  setInterval(() => {
    if (Math.random() < 0.4) {
      heroTitle.classList.add('is-glitch');
      setTimeout(() => heroTitle.classList.remove('is-glitch'), 180);
    }
  }, 4200);
}

// ---------- Hero canvas: cursor-reactive particle network ----------
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let W, H, particles;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const resize = () => {
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
};

const initParticles = () => {
  const count = Math.min(90, Math.floor((W * H) / 14000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.6 + 0.4,
  }));
};

let canvasVisible = true;
let canvasRaf = 0;
const tick = () => {
  if (!canvasVisible) { canvasRaf = 0; return; }
  ctx.clearRect(0, 0, W, H);
  const heroRect = canvas.getBoundingClientRect();
  const localMx = mouseX - heroRect.left;
  const localMy = mouseY - heroRect.top;

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];

    // gentle attraction toward cursor
    const dxm = localMx - a.x;
    const dym = localMy - a.y;
    const distM = Math.sqrt(dxm * dxm + dym * dym);
    if (distM < 200 && distM > 0) {
      a.vx += (dxm / distM) * 0.012;
      a.vy += (dym / distM) * 0.012;
    }
    // velocity damping
    a.vx *= 0.985;
    a.vy *= 0.985;

    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const alpha = (1 - dist / 150) * 0.4;
        ctx.strokeStyle = `rgba(0, 240, 200, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) { p.x = 0; p.vx *= -1; }
    if (p.x > W) { p.x = W; p.vx *= -1; }
    if (p.y < 0) { p.y = 0; p.vy *= -1; }
    if (p.y > H) { p.y = H; p.vy *= -1; }

    ctx.fillStyle = 'rgba(0, 240, 200, 0.75)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  canvasRaf = requestAnimationFrame(tick);
};

const startCanvas = () => {
  resize();
  initParticles();
  if (!canvasRaf) tick();
};

// Pause canvas rAF loop when hero scrolls offscreen
const heroEl = document.querySelector('.hero');
if (heroEl && 'IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      canvasVisible = entry.isIntersecting;
      if (canvasVisible && !canvasRaf) tick();
    });
  }, { threshold: 0 }).observe(heroEl);
}
// Also pause when tab goes background
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    canvasVisible = false;
  } else if (heroEl && heroEl.getBoundingClientRect().bottom > 0) {
    canvasVisible = true;
    if (!canvasRaf) tick();
  }
});

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

// ---------- Hero parallax ----------
const heroContent = document.querySelector('.hero__content');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y < window.innerHeight && heroContent) {
    heroContent.style.transform = `translateY(${y * 0.18}px)`;
    heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.7)));
  }
}, { passive: true });

// ---------- Pillar tilt on hover ----------
document.querySelectorAll('[data-tilt]').forEach((el) => {
  const media = el.querySelector('.pillar__media');
  if (!media) return;
  el.addEventListener('mousemove', (e) => {
    const rect = media.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    media.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  el.addEventListener('mouseleave', () => {
    media.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
  });
});

// ---------- Magnetic buttons ----------
document.querySelectorAll('[data-magnetic]').forEach((el) => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0, 0)';
  });
});

// ---------- Scramble text on hover ----------
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';
const scramble = (el) => {
  const original = el.dataset.original || el.textContent;
  el.dataset.original = original;
  let frame = 0;
  const queue = [...original].map((char, i) => ({
    from: char,
    to: char,
    start: Math.floor(Math.random() * 12),
    end: Math.floor(Math.random() * 12) + 12,
  }));
  let raf;
  const update = () => {
    let output = '';
    let complete = 0;
    for (let i = 0; i < queue.length; i++) {
      const { from, to, start, end } = queue[i];
      if (frame >= end) {
        complete++;
        output += to;
      } else if (frame >= start) {
        const ch = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        output += `<span style="color:var(--accent)">${ch}</span>`;
      } else {
        output += from;
      }
    }
    el.innerHTML = output;
    if (complete < queue.length) {
      raf = requestAnimationFrame(update);
      frame++;
    }
  };
  cancelAnimationFrame(el._scrambleRaf);
  frame = 0;
  el._scrambleRaf = requestAnimationFrame(update);
};

document.querySelectorAll('[data-scramble]').forEach((el) => {
  el.addEventListener('mouseenter', () => scramble(el));
});

// ---------- Mobile menu toggle ----------
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  const closeMenu = () => {
    burger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.classList.toggle('menu-open', isOpen);
  });
  // Close on link click
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMenu);
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
  });
}

// ---------- Custom video play overlay ----------
document.querySelectorAll('.video-card__frame').forEach((frame) => {
  const playBtn = frame.querySelector('.video-card__play');
  const video = frame.querySelector('video');
  if (!playBtn || !video) return;

  playBtn.addEventListener('click', () => {
    video.play().catch(() => {});
  });
  video.addEventListener('play', () => frame.classList.add('is-playing'));
  video.addEventListener('ended', () => frame.classList.remove('is-playing'));
});

// ---------- Demo form → mailto ----------
const auditForm = document.getElementById('auditForm');
if (auditForm) {
  auditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = auditForm;
    const get = (n) => (f[n] && f[n].value || '').trim();
    const subject = encodeURIComponent(`Demo Request — ${get('company') || 'BiztelAI'}`);
    const lines = [
      'Hi Pugazh,',
      '',
      "I'd like to book a demo. Details below:",
      '',
      `Name        : ${get('name')}`,
      `Company     : ${get('company')}`,
      `Role        : ${get('role')}`,
      `Industry    : ${get('industry')}`,
      `Process     : ${get('process_type')}`,
      `Email       : ${get('email')}`,
      '',
      'Message:',
      get('message') || '(none)',
      '',
      '— sent via biztel.ai',
    ];
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:pugazh@biztel.ai?subject=${subject}&body=${body}`;
    const btn = auditForm.querySelector('button span');
    if (btn) btn.textContent = 'Opening mail →';
    setTimeout(() => { if (btn) btn.textContent = 'Book a Demo'; }, 4000);
  });
}

// ---------- Animated number counters ----------
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const countUp = (el) => {
  const target = parseFloat(el.dataset.count);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const v = Math.round(target * easeOut(t));
    el.textContent = prefix + (v < 10 && el.dataset.prefix === undefined && target < 10 ? '0' + v : v) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = prefix + v + suffix;
  };
  requestAnimationFrame(step);
};

const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      countUp(entry.target);
      counterIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('[data-count]').forEach((el) => counterIO.observe(el));

// ---------- Splash intro ----------
const splash = document.getElementById('splash');
const pctEl = document.getElementById('splashPct');
document.body.style.overflow = 'hidden';

const runSplash = () => {
  let p = 0;
  const tickPct = () => {
    p += Math.random() * 9 + 4;
    if (p > 100) p = 100;
    pctEl.textContent = String(Math.floor(p)).padStart(3, '0');
    if (p < 100) {
      setTimeout(tickPct, 70 + Math.random() * 90);
    } else {
      setTimeout(() => {
        splash.classList.add('is-done');
        document.body.style.overflow = '';
        if (!reduced) startCanvas();
        revealChars();
        markSplashSeen();
      }, 280);
    }
  };
  tickPct();
};

const splashSeen = (() => {
  try { return sessionStorage.getItem('biztel.splashSeen') === '1'; }
  catch { return false; }
})();
const markSplashSeen = () => {
  try { sessionStorage.setItem('biztel.splashSeen', '1'); } catch {}
};

if (reduced || splashSeen) {
  splash.classList.add('is-done');
  document.body.style.overflow = '';
  revealChars();
  if (!reduced) startCanvas();
  markSplashSeen();
} else {
  // Start immediately — DOMContentLoaded already fired since script is at end of body
  requestAnimationFrame(runSplash);
}
