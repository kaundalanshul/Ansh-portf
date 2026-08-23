const API_BASE = 'http://localhost:5000/api';

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

    // Gallery Item
    const imgHtml = proj.imageUrl
      ? `<img src="${proj.imageUrl}" class="project-image" alt="${proj.title}" style="margin-bottom: 0.75rem;">`
      : `<div class="project-image" style="display:flex;align-items:center;justify-content:center;font-family:monospace;margin-bottom:0.75rem;">NO PHOTO</div>`;

    const liveLinkBelowPhoto = proj.liveUrl
      ? `<div class="live-link-below-photo" style="margin-bottom: 1.5rem;">
          <a href="${proj.liveUrl}" target="_blank" class="btn-view" style="font-weight: 800; font-size: 0.95rem; word-break: break-all;">
            🔗 Live Project: ${proj.liveUrl} ↗
          </a>
        </div>`
      : '';

    const techHtml = proj.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');

    const galleryHTML = `
      <div class="project-showcase" id="proj-${proj._id}">
        ${imgHtml}
        ${liveLinkBelowPhoto}
        <h3>${proj.title}</h3>
        <p>${proj.description}</p>
        <div class="tech-tags">${techHtml}</div>
        ${proj.githubUrl ? `<a href="${proj.githubUrl}" target="_blank" class="btn-view">[ SOURCE CODE ]</a>` : ''}
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
