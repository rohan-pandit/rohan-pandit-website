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
  }

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
  if (event.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
    closeModal();
  }
});
