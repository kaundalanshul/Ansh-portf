// API URL — dynamically resolved from config.js or auto-detected based on hostname
function getApiBase() {
  if (window.API_BASE && !window.API_BASE.includes('localhost')) {
    return window.API_BASE;
  }
  if (window.location && window.location.hostname && window.location.hostname.includes('onrender.com')) {
    return 'https://ansh-portf-2cf4.onrender.com/api';
  }
  return window.API_BASE || 'http://localhost:5000/api';
}
const API_BASE = getApiBase();

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  loadProfileSettings();
  loadProjects();
  loadSkills();
  loadInterests();
  initContactForm();
  initTextReveal();
  initInterestNavigation();
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
  const CACHE_KEY = 'portfolio_cached_projects';

  // Show cached projects immediately while fetching
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      if (Array.isArray(cachedData) && cachedData.length > 0) {
        renderProjects(cachedData);
        const statProj = document.getElementById('statProjects');
        if (statProj) statProj.textContent = `${cachedData.length}+`;
      }
    }
  } catch (e) { /* ignore cache errors */ }

  try {
    const res = await fetch(`${API_BASE}/projects`);
    const result = await res.json();

    if (result.data) {
      renderProjects(result.data);
      const statProj = document.getElementById('statProjects');
      if (statProj) statProj.textContent = `${result.data.length}+`;
      // Update cache
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(result.data));
      } catch (e) { /* ignore */ }
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

    }
  } catch (e) {
    console.error('Error loading profile settings', e);
  }
}

/* ══════════════════════════════════════════════════
   INTERESTS & RELATED ITEMS CONTROLLER
   ══════════════════════════════════════════════════ */

window.currentInterests = [];

// Fallback initial interests in case API is still initializing
const fallbackInterests = [
  {
    _id: "670100000000000000000001",
    num: "01",
    title: "MUSIC",
    image: "hobby_music.jpg",
    description: "Curated playlists, sonic atmospheres, and electronic beats that provide the rhythm for deep coding sessions.",
    items: [
      {
        _id: "670100000000000000000101",
        title: "Discovery",
        subtitle: "Daft Punk • 2001",
        tag: "Album",
        description: "The gold standard of French House and electronic production. From 'One More Time' to 'Voyager', every synth line is iconic.",
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com/album/4m2880jivSbbyEGAKfITCa"
      },
      {
        _id: "670100000000000000000102",
        title: "Dive",
        subtitle: "Tycho • 2011",
        tag: "Ambient",
        description: "Warm, textured analog synthesizers and nostalgic acoustic melodies that form the backbone of endless focused development hours.",
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com/album/43q4GZ9U1Yw6Jc0z0C4n3j"
      },
      {
        _id: "670100000000000000000103",
        title: "Deep Focus Lo-Fi Coding",
        subtitle: "Curated Spotify Mix",
        tag: "Playlist",
        description: "Down-tempo beats, vinyl crackles, and gentle electric piano chords tuned specifically for bug hunting and clean system design.",
        image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com"
      },
      {
        _id: "670100000000000000000104",
        title: "Divenire",
        subtitle: "Ludovico Einaudi • 2006",
        tag: "Modern Classical",
        description: "Breathtaking minimalist piano paired with cinematic string orchestration for creative inspiration and mental clarity.",
        image: "https://images.unsplash.com/photo-1520523839898-507127043814?auto=format&fit=crop&w=600&q=80",
        link: "https://open.spotify.com"
      }
    ],
    spotifyPlaylists: [
      {
        _id: "670100000000000000000199",
        title: "Curated Spotify Playlist",
        url: "https://open.spotify.com/playlist/6jZaEmElzm5jlVlarE8jZc?si=-8pXoqm5TBKUbmbC6wVOoQ&utm_source=copy-link&pi=HWqHUETPS6qvE",
        order: 0
      }
    ]
  },
  {
    _id: "670100000000000000000002",
    num: "02",
    title: "TRAVEL",
    image: "hobby_travel.jpg",
    description: "Venture beyond screens into mountain ridges, serene coastal roads, and historic cultural destinations.",
    items: [
      {
        _id: "670100000000000000000201",
        title: "Himalayan Ridge Expeditions",
        subtitle: "Himachal Pradesh & Spiti Valley",
        tag: "Mountains",
        description: "High altitude passes, rugged mountain terrains, ancient monasteries, and crystal-clear star-studded night skies.",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
        link: ""
      },
      {
        _id: "670100000000000000000202",
        title: "Kyoto Heritage & Zen Gardens",
        subtitle: "Kyoto, Japan",
        tag: "Culture",
        description: "Wandering through bamboo groves of Arashiyama, peaceful stone zen gardens, and historic cedar wooden temple architecture.",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80",
        link: ""
      },
      {
        _id: "670100000000000000000203",
        title: "Coastal Cliff Roads",
        subtitle: "Ocean Highway Drives",
        tag: "Road Trip",
        description: "The thrill of open-window sunset drives along winding cliffs with the crash of ocean surf and crisp sea breezes.",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
        link: ""
      },
      {
        _id: "670100000000000000000204",
        title: "Night Markets & Street Food",
        subtitle: "Southeast Asia Trails",
        tag: "Gastronomy",
        description: "Immersing in sizzling culinary traditions, aromatic spices, lively night buzz, and spontaneous conversations with locals.",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
        link: ""
      }
    ]
  },
  {
    _id: "670100000000000000000003",
    num: "03",
    title: "READING",
    image: "hobby_reading.jpg",
    description: "Deep exploration of computer architecture, software craftsmanship, human psychology, and philosophical insights.",
    items: [
      {
        _id: "670100000000000000000301",
        title: "Designing Data-Intensive Applications",
        subtitle: "Martin Kleppmann",
        tag: "Architecture",
        description: "The definitive guide to distributed databases, storage engines, stream processing, consensus, and fault-tolerant architectures.",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
        link: "https://dataintensive.net/"
      },
      {
        _id: "670100000000000000000302",
        title: "Clean Code",
        subtitle: "Robert C. Martin ('Uncle Bob')",
        tag: "Craftsmanship",
        description: "Principles of writing software that is readable, maintainable, modular, and a genuine pleasure for fellow engineers to collaborate on.",
        image: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80",
        link: ""
      },
      {
        _id: "670100000000000000000303",
        title: "Atomic Habits",
        subtitle: "James Clear",
        tag: "Productivity",
        description: "A framework of incremental 1% compound improvements. System over goals, identity-based habits, and effortless consistency.",
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
        link: ""
      },
      {
        _id: "670100000000000000000304",
        title: "Deep Work",
        subtitle: "Cal Newport",
        tag: "Philosophy",
        description: "Cultivating intense, undistracted cognitive focus in an era of notifications, fragmented attention, and superficial busywork.",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
        link: ""
      }
    ]
  }
];

window.currentInterests = fallbackInterests;

/** Load Interests from backend REST API */
async function loadInterests() {
  try {
    const res = await fetch(`${API_BASE}/interests`);
    const result = await res.json();
    if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
      window.currentInterests = result.data;
      renderFrontendInterests(window.currentInterests);
    } else {
      renderFrontendInterests(fallbackInterests);
    }
  } catch (err) {
    console.warn('Could not load interests from API, using fallback data:', err);
    renderFrontendInterests(fallbackInterests);
  }

  // Check if page loaded with a specific interest hash
  checkInterestHash();
}

/** Render clickable interest category cards in the main section */
function renderFrontendInterests(interests) {
  const container = document.getElementById('hobbiesGrid');
  if (!container) return;

  if (!interests || interests.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No interests added.</p>';
    return;
  }

  container.innerHTML = interests.map((item, i) => {
    const num = item.num || (i < 9 ? `0${i + 1}` : `${i + 1}`);
    const itemCount = Array.isArray(item.items) ? item.items.length : 0;
    const countText = itemCount === 1 ? '1 ITEM' : `${itemCount} ITEMS`;
    const imageSrc = item.image || 'hobby_music.jpg';

    return `
      <div class="hobby-card" onclick="openInterestDetail('${item._id || item.title}')" role="button" tabindex="0" aria-label="View ${escapeHtml(item.title)} details">
        <div class="hobby-image-wrapper">
          <img src="${imageSrc}" alt="${escapeHtml(item.title)}" class="hobby-image" loading="lazy">
          <span class="hobby-hover-prompt">[ EXPLORE → ]</span>
        </div>
        <div class="hobby-info">
          <div class="hobby-meta-left">
            <span class="hobby-num">${num}</span>
            <h3 class="hobby-title">${escapeHtml(item.title)}</h3>
          </div>
          <span class="hobby-count-badge">${countText}</span>
        </div>
      </div>
    `;
  }).join('');
}

/** Open dedicated detail view for a specific interest */
window.openInterestDetail = function(idOrTitle) {
  const interest = window.currentInterests.find((it) => 
    String(it._id) === String(idOrTitle) || 
    it.title.toLowerCase() === String(idOrTitle).toLowerCase()
  );

  if (!interest) {
    console.warn('Interest not found:', idOrTitle);
    return;
  }

  const overlay = document.getElementById('interestDetailOverlay');
  if (!overlay) return;

  const num = interest.num || '01';
  const title = interest.title || 'INTEREST';
  const desc = interest.description || 'Explore curated items, recommendations, and creative inspirations.';
  const image = interest.image || 'hobby_music.jpg';
  const items = Array.isArray(interest.items) ? interest.items : [];

  // Populate hero banner
  const tagEl = document.getElementById('interestHeroTag');
  const titleEl = document.getElementById('interestHeroTitle');
  const descEl = document.getElementById('interestHeroDesc');
  const imgEl = document.getElementById('interestHeroImg');
  const countEl = document.getElementById('interestStatCount');
  const breadcrumbEl = document.getElementById('interestDetailBreadcrumb');

  if (tagEl) tagEl.textContent = `// INTEREST CATEGORY ${num}`;
  if (titleEl) titleEl.textContent = title;
  if (descEl) descEl.textContent = desc;
  if (imgEl) {
    imgEl.src = image;
    imgEl.alt = title;
  }
  if (countEl) countEl.textContent = `${items.length} ${items.length === 1 ? 'ITEM' : 'ITEMS'}`;
  if (breadcrumbEl) breadcrumbEl.textContent = `INTEREST / ${num} — ${title}`;

  // Populate Spotify Playlists if available
  const spotifySection = document.getElementById('interestSpotifySection');
  const spotifyGrid = document.getElementById('interestSpotifyGrid');
  const playlists = Array.isArray(interest.spotifyPlaylists) ? interest.spotifyPlaylists : [];

  if (spotifySection && spotifyGrid) {
    if (playlists.length > 0) {
      spotifySection.style.display = 'block';
      spotifyGrid.innerHTML = playlists.map((pl) => {
        const embedUrl = getSpotifyEmbedUrl(pl.url);
        const plTitle = pl.title || 'Curated Spotify Playlist';
        return `
          <div class="spotify-embed-card">
            <div class="spotify-embed-header">
              <div class="spotify-embed-title-wrap">
                <svg class="spotify-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.68.472-1.038.254-2.846-1.74-6.428-2.133-10.65-1.168-.41.094-.817-.16-.91-.568-.094-.41.16-.816.568-.91 4.625-1.055 8.583-.609 11.772 1.354.358.218.472.68.258 1.038zm1.468-3.264c-.274.444-.86.587-1.304.313-3.257-2.003-8.225-2.583-12.078-1.413-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.397-1.335 9.873-.687 13.615 1.615.444.274.587.86.313 1.304zm.126-3.398C15.2 8.354 8.795 8.134 5.12 9.25c-.6.183-1.238-.163-1.421-.763-.183-.6.163-1.238.763-1.421 4.22-1.282 11.29-1.026 15.655 1.565.542.321.721 1.022.4 1.564-.322.542-1.023.722-1.42.012z"/>
                </svg>
                <h4 class="spotify-embed-title">${escapeHtml(plTitle)}</h4>
              </div>
              <a href="${pl.url}" target="_blank" rel="noopener noreferrer" class="spotify-open-link" title="Open playlist in Spotify app">
                <span>Open in App</span> ↗
              </a>
            </div>
            <div class="spotify-iframe-wrapper">
              <iframe 
                src="${embedUrl}" 
                width="100%" 
                height="352" 
                frameborder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
              </iframe>
            </div>
          </div>
        `;
      }).join('');
    } else {
      spotifySection.style.display = 'none';
      spotifyGrid.innerHTML = '';
    }
  }

  // Populate related items grid
  const itemsGrid = document.getElementById('interestItemsGrid');
  if (itemsGrid) {
    if (items.length === 0) {
      itemsGrid.innerHTML = `
        <div class="interest-empty-items">
          <p>No curated items added for ${escapeHtml(title)} yet.</p>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:8px;">Add items from the admin panel to show them here!</p>
        </div>
      `;
    } else {
      itemsGrid.innerHTML = items.map((item, idx) => {
        const itemTag = item.tag ? `<span class="interest-item-tag-badge">${escapeHtml(item.tag)}</span>` : '';
        const itemMedia = item.image
          ? `<img src="${item.image}" alt="${escapeHtml(item.title || 'Item')}" class="interest-item-img" loading="lazy">`
          : `<div class="interest-item-placeholder">#${idx + 1}</div>`;
        const linkBtn = item.link
          ? `<div class="interest-item-action">
               <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="interest-item-link-btn">
                 [ EXPLORE LINK ↗ ]
               </a>
             </div>`
          : '';

        return `
          <div class="interest-item-card">
            <div class="interest-item-media">
              ${itemMedia}
              ${itemTag}
            </div>
            <div class="interest-item-body">
              <h4 class="interest-item-title">${escapeHtml(item.title || 'Untitled')}</h4>
              ${item.subtitle ? `<p class="interest-item-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}
              ${item.description ? `<p class="interest-item-desc">${escapeHtml(item.description)}</p>` : ''}
              ${linkBtn}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Activate overlay
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Update hash
  const slug = encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'));
  history.replaceState(null, '', `#interest-${slug}`);

  // Scroll overlay to top
  overlay.scrollTop = 0;
};

/** Open by name (fallback helper for initial DOM cards) */
window.openInterestDetailByName = function(name) {
  window.openInterestDetail(name);
};

/** Close dedicated detail view and return to Interests section */
window.closeInterestDetail = function() {
  const overlay = document.getElementById('interestDetailOverlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  // Return to interests section
  history.replaceState(null, '', '#hobbies');
  const hobbiesSection = document.getElementById('hobbies');
  if (hobbiesSection) {
    hobbiesSection.scrollIntoView({ behavior: 'smooth' });
  }
};

/** Deep-linking & Keyboard setup */
function initInterestNavigation() {
  // Listen for Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('interestDetailOverlay');
      if (overlay && overlay.classList.contains('active')) {
        closeInterestDetail();
      }
    }
  });

  // Listen for hash changes
  window.addEventListener('hashchange', checkInterestHash);
}

function checkInterestHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#interest-')) {
    const slug = decodeURIComponent(hash.replace('#interest-', '')).replace(/-/g, ' ');
    const matched = window.currentInterests.find((it) => it.title.toLowerCase() === slug.toLowerCase());
    if (matched) {
      openInterestDetail(matched._id);
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Convert any Spotify URL into an official embed URL */
function getSpotifyEmbedUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (url.includes('open.spotify.com/embed/')) {
    return url.includes('theme=0') ? url : (url + (url.includes('?') ? '&theme=0' : '?theme=0'));
  }
  const match = url.match(/open\.spotify\.com\/(playlist|track|album|artist|show|episode)\/([a-zA-Z0-9]+)/i);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
  }
  const uriMatch = url.match(/spotify:(playlist|track|album|artist|show|episode):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=generator&theme=0`;
  }
  return url;
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
