const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
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
      if(statProj) statProj.textContent = `${result.data.length}+`;
    }
  } catch (e) {
    console.error('Error loading projects', e);
  }
}

function renderProjects(projects) {
  const indexContainer = document.getElementById('projectIndex');
  const galleryContainer = document.getElementById('projectsGallery');
  
  if(!indexContainer || !galleryContainer) return;
  
  indexContainer.innerHTML = '';
  galleryContainer.innerHTML = '';

  if(projects.length === 0) {
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
    const imgHtml = proj.imageUrl ? `<img src="${proj.imageUrl}" class="project-image">` : `<div class="project-image" style="display:flex;align-items:center;justify-content:center;font-family:monospace;">NO IMAGE</div>`;
    const techHtml = proj.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');
    
    const galleryHTML = `
      <div class="project-showcase" id="proj-${proj._id}">
        ${imgHtml}
        <h3>${proj.title}</h3>
        <p>${proj.description}</p>
        <div class="tech-tags">${techHtml}</div>
        ${proj.liveUrl ? `<a href="${proj.liveUrl}" target="_blank" class="btn-view">[ LIVE DEMO ]</a>` : ''}
        ${proj.githubUrl ? `<a href="${proj.githubUrl}" target="_blank" class="btn-view" style="margin-left:1rem;">[ SOURCE ]</a>` : ''}
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
      if(statSkills) statSkills.textContent = `${result.data.length}+`;
      
      const grouped = result.data.reduce((acc, s) => {
        if(!acc[s.category]) acc[s.category] = [];
        acc[s.category].push(s);
        return acc;
      }, {});

      const grid = document.getElementById('skillsGrid');
      if(grid) {
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

  if(!form) return;

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
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      const result = await res.json();
      
      status.textContent = result.success ? "Message sent successfully." : "Error sending message.";
      if(result.success) form.reset();
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
