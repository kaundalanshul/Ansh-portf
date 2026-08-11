/**
 * Portfolio Public Site — Main JavaScript
 * ────────────────────────────────────────
 * - Fetches projects and skills from the API
 * - Renders dynamic content
 * - Contact form submission
 * - Scroll animations and navigation
 */

/* ── Configuration ─────────────────────────────── */
const API_BASE = '/api';

/* ── DOM Elements ──────────────────────────────── */
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const projectsGrid = document.getElementById('projectsGrid');
const skillsGrid = document.getElementById('skillsGrid');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

/* ══════════════════════════════════════════════════
   Navigation
   ══════════════════════════════════════════════════ */

/** Scroll-based navbar styling */
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Update active nav link based on scroll position
  updateActiveNav();
});

/** Mobile menu toggle */
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('active');
});

/** Close mobile menu when a link is clicked */
navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

/** Highlight current section in navigation */
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 100;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = navLinks.querySelector(`a[href="#${id}"]`);

    if (link) {
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

/* ══════════════════════════════════════════════════
   API Fetching
   ══════════════════════════════════════════════════ */

/** Generic fetch helper with error handling */
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    return null;
  }
}

/* ══════════════════════════════════════════════════
   Projects
   ══════════════════════════════════════════════════ */

/** Fetch and render projects */
async function loadProjects() {
  const result = await fetchAPI('/projects');

  if (!result || !result.data || result.data.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">📂</div>
        <p>Projects coming soon! Stay tuned.</p>
      </div>
    `;
    return;
  }

  // Update stat counter
  const statProjects = document.querySelector('#statProjects .number');
  if (statProjects) {
    statProjects.textContent = `${result.data.length}+`;
  }

  // Render project cards
  projectsGrid.innerHTML = result.data
    .map((project) => createProjectCard(project))
    .join('');

  // Re-apply scroll reveal to new elements
  initScrollReveal();
}

/** Create HTML for a single project card */
function createProjectCard(project) {
  const techTags = project.technologies
    .map((tech) => `<span class="tech-tag">${escapeHTML(tech)}</span>`)
    .join('');

  const imageSection = project.imageUrl
    ? `<img src="${escapeHTML(project.imageUrl)}" alt="${escapeHTML(project.title)}" loading="lazy">`
    : `<span class="placeholder-icon">🖥️</span>`;

  const featuredBadge = project.featured
    ? `<span class="project-card-badge">Featured</span>`
    : '';

  const liveLink = project.liveUrl
    ? `<a href="${escapeHTML(project.liveUrl)}" target="_blank" rel="noopener">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         Live Demo
       </a>`
    : '';

  const githubLink = project.githubUrl
    ? `<a href="${escapeHTML(project.githubUrl)}" target="_blank" rel="noopener">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
         Source Code
       </a>`
    : '';

  return `
    <div class="project-card reveal">
      <div class="project-card-image">
        ${imageSection}
        ${featuredBadge}
      </div>
      <div class="project-card-body">
        <h3>${escapeHTML(project.title)}</h3>
        <p>${escapeHTML(project.description)}</p>
        <div class="project-tech-tags">${techTags}</div>
        <div class="project-card-links">
          ${liveLink}
          ${githubLink}
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   Skills
   ══════════════════════════════════════════════════ */

/** Category icons mapping */
const categoryIcons = {
  Frontend: '🎨',
  Backend: '⚙️',
  Tools: '🛠️',
  Other: '💡',
};

/** Fetch and render skills grouped by category */
async function loadSkills() {
  const result = await fetchAPI('/skills');

  if (!result || !result.data || result.data.length === 0) {
    skillsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">🎯</div>
        <p>Skills will appear here once added.</p>
      </div>
    `;
    return;
  }

  // Update stat counter
  const statSkills = document.querySelector('#statSkills .number');
  if (statSkills) {
    statSkills.textContent = `${result.data.length}+`;
  }

  // Group skills by category
  const grouped = result.data.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Render category cards
  skillsGrid.innerHTML = Object.entries(grouped)
    .map(([category, skills]) => createSkillCategory(category, skills))
    .join('');

  // Re-apply scroll reveal
  initScrollReveal();
}

/** Create HTML for a skill category with skill bars */
function createSkillCategory(category, skills) {
  const skillItems = skills
    .map(
      (skill) => `
      <div class="skill-item">
        <div class="skill-info">
          <span class="name">${skill.icon ? skill.icon + ' ' : ''}${escapeHTML(skill.name)}</span>
          <span class="percentage">${skill.proficiency}%</span>
        </div>
        <div class="skill-bar">
          <div class="skill-bar-fill" data-width="${skill.proficiency}"></div>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div class="skill-category reveal">
      <div class="skill-category-header">
        <span class="cat-icon">${categoryIcons[category] || '💡'}</span>
        <h3>${escapeHTML(category)}</h3>
      </div>
      ${skillItems}
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   Contact Form
   ══════════════════════════════════════════════════ */

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Disable button during submission
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>⏳</span> Sending...';
  formStatus.className = 'form-status';
  formStatus.style.display = 'none';

  // Gather form data
  const formData = {
    name: document.getElementById('contactName').value.trim(),
    email: document.getElementById('contactEmail').value.trim(),
    subject: document.getElementById('contactSubject').value.trim(),
    message: document.getElementById('contactMessage').value.trim(),
  };

  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      formStatus.className = 'form-status success';
      formStatus.textContent = result.message || 'Message sent successfully!';
      formStatus.style.display = 'block';
      contactForm.reset();
    } else {
      // Show validation errors if any
      const errorMsg = result.errors
        ? result.errors.map((e) => e.message).join(', ')
        : result.message || 'Failed to send message.';

      formStatus.className = 'form-status error';
      formStatus.textContent = errorMsg;
      formStatus.style.display = 'block';
    }
  } catch (error) {
    formStatus.className = 'form-status error';
    formStatus.textContent = 'Network error. Please try again later.';
    formStatus.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>📨</span> Send Message';

    // Hide status after 5 seconds
    setTimeout(() => {
      formStatus.style.display = 'none';
    }, 5000);
  }
});

/* ══════════════════════════════════════════════════
   Scroll Reveal Animation
   ══════════════════════════════════════════════════ */

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Animate skill bars when they become visible
          const skillBars = entry.target.querySelectorAll('.skill-bar-fill');
          skillBars.forEach((bar) => {
            const width = bar.getAttribute('data-width');
            setTimeout(() => {
              bar.style.width = `${width}%`;
            }, 300);
          });

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  reveals.forEach((el) => observer.observe(el));
}

/* ══════════════════════════════════════════════════
   Utility Functions
   ══════════════════════════════════════════════════ */

/** Escape HTML to prevent XSS */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ══════════════════════════════════════════════════
   Initialization
   ══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Load dynamic content from API
  loadProjects();
  loadSkills();

  // Initialize scroll reveal animations
  initScrollReveal();
});
