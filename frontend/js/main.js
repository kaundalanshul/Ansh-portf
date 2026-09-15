// API URL — change to your deployed Render backend URL when deploying frontend (e.g. 'https://ansh-backend.onrender.com/api')
const API_BASE = window.API_BASE || 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  loadProfileSettings();
  loadProjects();
  loadSkills();
  initContactForm();
  initTextReveal();
});

function initThreeJS() {
  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Material inspired by glassy/metallic look
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
  });

  const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const light1 = new THREE.PointLight(0xffffff, 1, 100);
  light1.position.set(10, 10, 10);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xdddddd, 0.8, 100);
  light2.position.set(-10, -10, -10);
  scene.add(light2);

  camera.position.z = 30;

  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

async function loadProjects() {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    const result = await res.json();

    if (result.data) {
      renderProjects(result.data);
      const statProj = document.getElementById('statProjects');
      if (statProj) statProj.textContent = `${result.data.length}+`;
    }
  } catch (e) {
    console.error('Error loading projects', e);
  }
}

function renderProjects(projects) {
  const indexContainer = document.getElementById('projectIndex');
  const galleryContainer = document.getElementById('projectsGallery');

  if (!indexContainer || !galleryContainer) return;

  indexContainer.innerHTML = '';
  galleryContainer.innerHTML = '';

  if (projects.length === 0) {
    indexContainer.innerHTML = '<div>No projects found.</div>';
    return;
  }

  projects.forEach((proj, idx) => {
    const numStr = String(idx + 1).padStart(2, '0');

    // Index Item
    const indexHTML = `
      <div class="index-item ${idx === 0 ? 'active' : ''}" data-target="proj-${proj._id}">
        <span class="index-num">${numStr}</span>
        <span class="index-title">${proj.title}</span>
      </div>
    `;
    indexContainer.insertAdjacentHTML('beforeend', indexHTML);

    const liveHref = proj.liveUrl
      ? (/^https?:\/\//i.test(proj.liveUrl) ? proj.liveUrl : 'https://' + proj.liveUrl)
      : '';

    // If project has liveUrl, render live interactive preview frame; otherwise render image
    let previewHtml = '';
    if (liveHref) {
      const hasImage = !!proj.imageUrl;
      const modeToggleHtml = hasImage
        ? `<div class="mode-toggle">
            <button type="button" class="mode-btn active" data-mode="live" onclick="togglePreviewMode('${proj._id}', 'live')" title="Interactive Live Preview">Live</button>
            <button type="button" class="mode-btn" data-mode="image" onclick="togglePreviewMode('${proj._id}', 'image')" title="Static Screenshot">Photo</button>
           </div>`
        : '';

      const imagePreviewHtml = hasImage
        ? `<div class="preview-image-wrapper" style="display:none;">
             <img src="${proj.imageUrl}" class="project-image" alt="${proj.title}" style="margin: 0; border-radius: 0; aspect-ratio: 16/10; object-fit: cover;">
           </div>`
        : '';

      previewHtml = `
        <div class="live-preview-container" id="preview-${proj._id}">
          <div class="preview-browser-header">
            <div class="browser-window-dots">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
            </div>
            <div class="preview-address-bar">
              <span class="lock-icon">🔒</span>
              <span class="address-text">${liveHref}</span>
            </div>
            <div class="preview-controls">
              ${modeToggleHtml}
              <div class="device-toggle" role="group" aria-label="Device View">
                <button type="button" class="device-btn active" data-device="desktop" onclick="setPreviewDevice('${proj._id}', 'desktop')" title="Desktop View">🖥️ Desktop</button>
                <button type="button" class="device-btn" data-device="mobile" onclick="setPreviewDevice('${proj._id}', 'mobile')" title="Mobile View">📱 Mobile</button>
              </div>
              <a href="${liveHref}" target="_blank" rel="noopener noreferrer" class="btn-open-live">
                Open Live Site ↗
              </a>
            </div>
          </div>
          <div class="preview-viewport-wrapper">
            <div class="preview-device-screen desktop" id="screen-${proj._id}">
              <iframe
                src="${liveHref}"
                class="preview-iframe"
                id="iframe-${proj._id}"
                title="${proj.title} Live Preview"
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          </div>
          ${imagePreviewHtml}
          <div class="preview-footer">
            <span class="preview-status"><span class="pulse-dot"></span> Live Interactive Preview</span>
            <a href="${liveHref}" target="_blank" rel="noopener noreferrer" class="btn-open-live-full">
              Open Live Site [ ↗ ]
            </a>
          </div>
        </div>
      `;
    } else {
      previewHtml = proj.imageUrl
        ? `<img src="${proj.imageUrl}" class="project-image" alt="${proj.title}" style="margin-bottom: 1.5rem;" onerror="this.onerror=null;this.src='';this.alt='Photo Not Found';">`
        : `<div class="project-image" style="display:flex;align-items:center;justify-content:center;font-family:monospace;margin-bottom:1.5rem;">NO PHOTO</div>`;
    }

    const liveLinkBelowPhoto = liveHref
      ? `<div class="live-link-below-photo" style="margin-bottom: 1.5rem;">
          <a href="${liveHref}" target="_blank" rel="noopener noreferrer" class="btn-view" style="font-weight: 800; font-size: 0.95rem; word-break: break-all;">
            🔗 Open Live Site: ${proj.liveUrl} ↗
          </a>
        </div>`
      : '';

    const descHtml = proj.description ? `<p>${proj.description}</p>` : '';
    const techHtml = (proj.technologies && proj.technologies.length > 0)
      ? `<div class="tech-tags">${proj.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>`
      : '';

    const githubHref = proj.githubUrl
      ? (/^https?:\/\//i.test(proj.githubUrl) ? proj.githubUrl : 'https://' + proj.githubUrl)
      : '';
    const githubLink = githubHref
      ? `<a href="${githubHref}" target="_blank" rel="noopener noreferrer" class="btn-view">[ SOURCE CODE ]</a>`
      : '';

    const galleryHTML = `
      <div class="project-showcase" id="proj-${proj._id}">
        ${previewHtml}
        ${liveLinkBelowPhoto}
        <h3>${proj.title}</h3>
        ${descHtml}
        ${techHtml}
        ${githubLink}
      </div>
    `;
    galleryContainer.insertAdjacentHTML('beforeend', galleryHTML);
  });

  initScrollSpy();
}

function initScrollSpy() {
  const showcases = document.querySelectorAll('.project-showcase');
  const indexItems = document.querySelectorAll('.index-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        const id = entry.target.id;
        indexItems.forEach(item => {
          if (item.dataset.target === id) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.5 });

  showcases.forEach(el => observer.observe(el));

  // Click to scroll
  indexItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

async function loadSkills() {
  try {
    const res = await fetch(`${API_BASE}/skills`);
    const result = await res.json();

    if (result.data) {
      const statSkills = document.getElementById('statSkills');
      if (statSkills) statSkills.textContent = `${result.data.length}+`;

      const grouped = result.data.reduce((acc, s) => {
        if (!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
      }, {});

      const grid = document.getElementById('skillsGrid');
      if (grid) {
        grid.innerHTML = Object.entries(grouped).map(([cat, skills]) => `
            <div class="skill-category">
              <div class="skill-category-title">${cat}</div>
              <ul class="skill-list">
                ${skills.map(s => `<li>${s.name}</li>`).join('')}
              </ul>
            </div>
          `).join('');
      }
    }
  } catch (e) {
    console.error('Error loading skills', e);
  }
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.textContent = '[ SENDING... ]';
    btn.disabled = true;

    const data = {
      name: document.getElementById('contactName').value,
      email: document.getElementById('contactEmail').value,
      subject: document.getElementById('contactSubject').value,
      message: document.getElementById('contactMessage').value,
    };

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      status.textContent = result.success ? "Message sent successfully." : "Error sending message.";
      if (result.success) form.reset();
    } catch (err) {
      status.textContent = "Network error.";
    } finally {
      btn.textContent = '[ SEND MESSAGE ]';
      btn.disabled = false;
      setTimeout(() => status.textContent = '', 5000);
    }
  });
}

function initTextReveal() {
  const revealElements = document.querySelectorAll('.reveal-text');

  revealElements.forEach(el => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.innerHTML = words.map(word => `<span class="reveal-word">${word}</span>`).join(' ');
  });

  const words = document.querySelectorAll('.reveal-word');

  function handleScroll() {
    const triggerBottom = window.innerHeight * 0.85; // Trigger at 85% down the viewport

    words.forEach(word => {
      const wordTop = word.getBoundingClientRect().top;

      if (wordTop < triggerBottom) {
        word.classList.add('active');
      } else {
        word.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Call once initially to catch any text already in view
}

async function loadProfileSettings() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const result = await res.json();
    if (result.data) {
      const p = result.data;

      // Hero
      const heroTitleEl = document.getElementById('heroTitle');
      if (heroTitleEl && p.heroTitle) {
        heroTitleEl.innerHTML = p.heroTitle.replace(/\n/g, '<br>');
      }

      const heroSubEl = document.getElementById('heroSubtitle');
      if (heroSubEl && p.heroSubtitle) {
        heroSubEl.innerHTML = p.heroSubtitle.replace(/\n/g, '<br>');
      }

      // About / Profile
      const aboutBioEl = document.getElementById('aboutBio');
      if (aboutBioEl && p.aboutBio) {
        aboutBioEl.textContent = p.aboutBio;
      }

      const aboutSpecEl = document.getElementById('aboutSpecialization');
      if (aboutSpecEl && p.aboutSpecialization) {
        aboutSpecEl.textContent = p.aboutSpecialization;
      }

      const aboutHighlightEl = document.getElementById('aboutHighlight');
      if (aboutHighlightEl && p.aboutHighlight) {
        aboutHighlightEl.textContent = p.aboutHighlight;
      }

      const aboutImgEl = document.getElementById('aboutImage');
      if (aboutImgEl && p.profileImage) {
        aboutImgEl.src = p.profileImage;
        if (p.name) aboutImgEl.alt = p.name;
      }

      // Re-initialize text reveal for dynamic about text
      initTextReveal();

      // Contact Email
      const emailEl = document.getElementById('displayContactEmail');
      if (emailEl && p.contactEmail) {
        emailEl.textContent = p.contactEmail;
      }

      // Marquee Text
      const marqueeEl = document.getElementById('marqueeContent');
      if (marqueeEl && p.marqueeText) {
        const text = p.marqueeText;
        marqueeEl.innerHTML = `
          <span>${text}</span>
          <span>◆</span>
          <span>${text}</span>
          <span>◆</span>
        `;
      }

      // Hobbies / Interests
      if (p.hobbies && Array.isArray(p.hobbies)) {
        renderFrontendHobbies(p.hobbies);
      }
    }
  } catch (e) {
    console.error('Error loading profile settings', e);
  }
}

function renderFrontendHobbies(hobbies) {
  const container = document.getElementById('hobbiesGrid');
  if (!container) return;

  if (hobbies.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No interests added.</p>';
    return;
  }

  container.innerHTML = hobbies.map((h, i) => `
    <div class="hobby-card">
      <div class="hobby-image-wrapper">
        <img src="${h.image || 'hobby_music.jpg'}" alt="${h.title}" class="hobby-image">
      </div>
      <div class="hobby-info">
        <span class="hobby-num">${h.num || '0' + (i + 1)}</span>
        <h3 class="hobby-title">${h.title}</h3>
      </div>
    </div>
  `).join('');
}

/* ── Live Preview Device and Mode Switchers ─────── */
window.setPreviewDevice = function(projId, device) {
  const container = document.getElementById(`preview-${projId}`);
  if (!container) return;

  const screen = container.querySelector('.preview-device-screen');
  const desktopBtn = container.querySelector('.device-btn[data-device="desktop"]');
  const mobileBtn = container.querySelector('.device-btn[data-device="mobile"]');

  if (device === 'mobile') {
    screen.classList.remove('desktop');
    screen.classList.add('mobile');
    desktopBtn?.classList.remove('active');
    mobileBtn?.classList.add('active');
  } else {
    screen.classList.remove('mobile');
    screen.classList.add('desktop');
    mobileBtn?.classList.remove('active');
    desktopBtn?.classList.add('active');
  }
};

window.togglePreviewMode = function(projId, mode) {
  const container = document.getElementById(`preview-${projId}`);
  if (!container) return;

  const liveView = container.querySelector('.preview-viewport-wrapper');
  const imageView = container.querySelector('.preview-image-wrapper');
  const liveBtn = container.querySelector('.mode-btn[data-mode="live"]');
  const imgBtn = container.querySelector('.mode-btn[data-mode="image"]');

  if (mode === 'image' && imageView) {
    liveView.style.display = 'none';
    imageView.style.display = 'block';
    liveBtn?.classList.remove('active');
    imgBtn?.classList.add('active');
  } else {
    if (imageView) imageView.style.display = 'none';
    liveView.style.display = 'flex';
    imgBtn?.classList.remove('active');
    liveBtn?.classList.add('active');
  }
};

/* ── Mobile Hamburger Menu ──────────────────────── */
(function initMobileMenu() {
  const hamburger = document.getElementById('navHamburger');
  const overlay = document.getElementById('mobileNavOverlay');
  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = overlay.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  overlay.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
})();
