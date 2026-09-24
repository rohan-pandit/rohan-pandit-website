// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll-reveal animations
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Scroll-spy: highlight active nav link
const sections = document.querySelectorAll('main .section[id]');
const navAnchors = document.querySelectorAll('[data-nav]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => a.classList.remove('active'));
        const active = document.querySelector(`[data-nav][href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  },
  { rootMargin: '-45% 0px -45% 0px' }
);

sections.forEach((section) => spyObserver.observe(section));

// Case study modal
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const modalTags = document.getElementById('modalTags');
const modalNext = document.getElementById('modalNext');
const modalBox = modalOverlay.querySelector('.modal');
const projectIds = [...document.querySelectorAll('.project-card [data-modal-target]')]
  .map((trigger) => trigger.getAttribute('data-modal-target'));
let lastTrigger = null;

function openModal(targetId, trigger) {
  const template = document.getElementById(`modal-${targetId}`);
  if (!template) return;

  modalContent.innerHTML = '';
  modalContent.appendChild(template.content.cloneNode(true));
  modalTags.textContent = template.dataset.tags || '';

  // Hint that screenshots scroll sideways on mobile (hidden by CSS on larger screens)
  const shots = modalContent.querySelector('.cs-shots');
  if (shots && shots.querySelectorAll('figure').length > 1) {
    const hint = document.createElement('p');
    hint.className = 'swipe-hint';
    hint.textContent = 'Swipe for more screenshots →';
    shots.after(hint);
    buildShotViewer(shots);
  }
  if (shots) makeShotsZoomable(shots);

  // "Next" cycles through the case studies in card order
  const nextId = projectIds[(projectIds.indexOf(targetId) + 1) % projectIds.length];
  const nextTemplate = document.getElementById(`modal-${nextId}`);
  modalNext.hidden = projectIds.length < 2 || !nextTemplate;
  if (nextTemplate) {
    modalNext.textContent = `Next: ${nextTemplate.dataset.short || 'case study'} →`;
    modalNext.dataset.target = nextId;
  }

  if (trigger) lastTrigger = trigger;
  modalBox.scrollTop = 0;
  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  modalBox.focus();
}

// Desktop screenshot viewer: one large shot with thumbnails (CSS shows every shot on smaller screens)
function buildShotViewer(shots) {
  const figures = [...shots.querySelectorAll('figure')];
  const nav = document.createElement('div');
  nav.className = 'shot-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'shot-arrow';
  prev.setAttribute('aria-label', 'Previous screenshot');
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'shot-arrow';
  next.setAttribute('aria-label', 'Next screenshot');
  next.textContent = '›';

  const thumbs = document.createElement('div');
  thumbs.className = 'shot-thumbs';

  const counter = document.createElement('p');
  counter.className = 'shot-count';

  let current = 0;
  const show = (index) => {
    current = (index + figures.length) % figures.length;
    figures.forEach((figure, i) => figure.classList.toggle('is-active', i === current));
    [...thumbs.children].forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === current)));
    counter.textContent = `${current + 1} / ${figures.length}`;
  };

  figures.forEach((figure, i) => {
    const img = figure.querySelector('img');
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = figure.querySelector('.device-browser') ? 'shot-thumb is-browser' : 'shot-thumb';
    thumb.setAttribute('aria-label', `Show screenshot ${i + 1}: ${img.alt}`);
    thumb.innerHTML = `<img src="${img.getAttribute('src')}" alt="">`;
    thumb.addEventListener('click', () => show(i));
    thumbs.appendChild(thumb);
  });

  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  shots.showShot = (step) => show(current + step);

  nav.append(prev, thumbs, next);
  shots.append(nav, counter);
  shots.classList.add('has-viewer');
  show(0);
}

// Lightbox: click any case study screenshot to view it larger (all screen sizes)
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let lightboxShots = [];
let lightboxIndex = 0;
let lightboxTrigger = null;

function makeShotsZoomable(shots) {
  const figures = [...shots.querySelectorAll('figure')];
  figures.forEach((figure, i) => {
    const img = figure.querySelector('img');
    img.classList.add('is-zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `View larger: ${img.alt}`);
    const open = () => openLightbox(figures, i, img);
    img.addEventListener('click', open);
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function showLightboxShot(index) {
  lightboxIndex = (index + lightboxShots.length) % lightboxShots.length;
  const figure = lightboxShots[lightboxIndex];
  const img = figure.querySelector('img');
  lightboxImg.src = img.getAttribute('src');
  lightboxImg.alt = img.alt;
  lightboxImg.classList.toggle('is-phone', Boolean(figure.querySelector('.device-phone')));
  lightboxCaption.textContent = lightboxShots.length > 1 ? `${lightboxIndex + 1} / ${lightboxShots.length}` : '';
}

function openLightbox(figures, index, trigger) {
  lightboxShots = figures;
  lightboxTrigger = trigger;
  lightboxPrev.hidden = lightboxNext.hidden = figures.length < 2;
  showLightboxShot(index);
  // Stays hidden in the HTML so it never shows up unstyled; reveal it, then fade in
  lightbox.hidden = false;
  void lightbox.offsetWidth;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!lightbox.classList.contains('is-open')) lightbox.hidden = true;
  }, 250);
  if (lightboxTrigger) lightboxTrigger.focus();
}

lightboxPrev.addEventListener('click', () => showLightboxShot(lightboxIndex - 1));
lightboxNext.addEventListener('click', () => showLightboxShot(lightboxIndex + 1));
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox || event.target.classList.contains('lightbox-figure')) closeLightbox();
});

modalNext.addEventListener('click', () => {
  openModal(modalNext.dataset.target);
});

function closeModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastTrigger) lastTrigger.focus();
}

document.querySelectorAll('[data-modal-target]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    openModal(trigger.getAttribute('data-modal-target'), trigger);
  });
});

// Make the whole card clickable, while keeping the link as the single focusable control
document.querySelectorAll('.project-card').forEach((card) => {
  const trigger = card.querySelector('[data-modal-target]');
  if (!trigger) return;

  card.addEventListener('click', (event) => {
    if (event.target.closest('[data-modal-target]')) return;
    openModal(trigger.getAttribute('data-modal-target'), trigger);
  });
});

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (event) => {
  // The lightbox sits on top of the modal, so it gets keys first
  if (lightbox.classList.contains('is-open')) {
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showLightboxShot(lightboxIndex - 1);
    if (event.key === 'ArrowRight') showLightboxShot(lightboxIndex + 1);
    return;
  }

  if (!modalOverlay.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeModal();

  // Arrow keys step through screenshots when the desktop viewer is showing
  const shots = modalContent.querySelector('.cs-shots.has-viewer');
  if (shots && window.matchMedia('(min-width: 901px)').matches &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    shots.showShot(event.key === 'ArrowRight' ? 1 : -1);
  }
});
