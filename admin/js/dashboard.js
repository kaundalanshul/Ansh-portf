/**
 * Admin Dashboard — dashboard.js
 * ───────────────────────────────
 * CRUD operations for Projects, Skills, and Messages.
 * Handles data tables, modals, and toast notifications.
 */

/* ══════════════════════════════════════════════════
   Initialization
   ══════════════════════════════════════════════════ */

// Data stores
let projects = [];
let skills = [];
let messages = [];
let interestCategories = [];

/**
 * Resolves an image URL so relative backend paths (/api/images/..., /uploads/...)
 * point to the active backend API host rather than admin static port.
 */
function resolveImageUrl(url) {
  if (!url) return '';
  url = String(url).trim();
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  // Strip out hardcoded localhost or 127.0.0.1 origins (e.g. from local development testing)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)) {
    url = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  }

  // External CDN URLs (Cloudinary, Unsplash, external images)
  if (/^https?:\/\//i.test(url)) return url;

  const apiRoot = API_BASE.replace(/\/api\/?$/, '');
  if (url.startsWith('/api/')) return `${apiRoot}${url}`;
  if (url.startsWith('api/')) return `${apiRoot}/${url}`;
  if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
    const clean = url.startsWith('/') ? url : `/${url}`;
    return `${apiRoot}${clean}`;
  }
  return url;
}

/**
 * Upload a file (photo or PDF) to the persistent backend storage
 * @param {File} file
 * @returns {Promise<string|null>} Persistent URL (e.g. "/api/images/<id>") or null
 */
async function uploadFileToBackend(file) {
  if (!file) return null;
  const token = getToken();
  if (!token) {
    showToast('Please log in again to upload photos.', 'error');
    return null;
  }

  // Convert to base64 data URL
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        image: base64Data,
        filename: file.name,
        contentType: file.type,
      }),
    });

    const result = await res.json();
    if (result && result.success && result.url) {
      return result.url;
    } else {
      showToast(result?.message || 'Upload failed.', 'error');
      return null;
    }
  } catch (err) {
    console.error('File upload network error:', err);
    showToast('Network error while uploading photo to backend.', 'error');
    return null;
  }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
  // Auth guard — redirect if not logged in
  if (!requireAuth()) return;

  // Display admin info
  const admin = getAdmin();
  if (admin) {
    const emailEl = document.getElementById('adminEmail');
    const avatarEl = document.getElementById('adminAvatar');
    if (emailEl) emailEl.textContent = admin.email;
    if (avatarEl) avatarEl.textContent = admin.email.charAt(0).toUpperCase();
  }

  // Load all data
  loadDashboardData();

  // Setup mobile sidebar
  setupSidebar();
});

/** Load all data concurrently */
async function loadDashboardData() {
  await Promise.all([loadProjects(), loadSkills(), loadMessages(), loadSiteProfileSettings(), loadInterestsAdmin()]);
  updateStats();
}

/** Update overview stats counters */
function updateStats() {
  const projEl = document.getElementById('totalProjects');
  if (projEl) projEl.textContent = projects.length;

  const skillEl = document.getElementById('totalSkills');
  if (skillEl) skillEl.textContent = skills.length;

  const expEl = document.getElementById('totalExperience');
  if (expEl) {
    const count = currentSiteProfile && Array.isArray(currentSiteProfile.experience) ? currentSiteProfile.experience.length : 0;
    expEl.textContent = count;
  }

  const certEl = document.getElementById('totalCertifications');
  if (certEl) {
    const count = currentSiteProfile && Array.isArray(currentSiteProfile.certifications) ? currentSiteProfile.certifications.length : 0;
    certEl.textContent = count;
  }

  const msgEl = document.getElementById('totalMessages');
  if (msgEl) msgEl.textContent = messages.length;

  const unreadCount = messages.filter((m) => !m.read).length;
  const unreadEl = document.getElementById('unreadMessages');
  if (unreadEl) unreadEl.textContent = unreadCount;

  const badgeEl = document.getElementById('unreadBadge');
  if (badgeEl) {
    badgeEl.textContent = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }
}

/* ══════════════════════════════════════════════════
   Sidebar Navigation
   ══════════════════════════════════════════════════ */

function switchSection(section) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach((s) => {
    s.classList.remove('active');
  });

  // Show selected section
  const target = document.getElementById(`section-${section}`);
  if (target) target.classList.add('active');

  // Update nav items
  document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
    item.classList.remove('active');
  });
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  // Update page title
  const titles = {
    overview: 'Overview',
    projects: 'Manage Projects',
    skills: 'Manage Skills',
    journey: 'Experience & Education',
    certifications: 'Certifications & Achievements',
    interests: 'Manage Interests',
    spotify: 'Music / Spotify Management',
    messages: 'Contact Messages',
    'site-profile': 'Site Content & Profile',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';

  if (section === 'site-profile' || section === 'journey' || section === 'certifications') {
    loadSiteProfileSettings();
  }
  if (section === 'interests') {
    loadInterestsAdmin();
  }
  if (section === 'spotify') {
    loadSpotifyAdmin();
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

/** Setup mobile sidebar toggle */
function setupSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
}

/* ══════════════════════════════════════════════════
   Stats
   ══════════════════════════════════════════════════ */

function updateStats() {
  document.getElementById('totalProjects').textContent = projects.length;
  document.getElementById('totalSkills').textContent = skills.length;
  document.getElementById('totalMessages').textContent = messages.length;

  const unreadCount = messages.filter((m) => !m.read).length;
  document.getElementById('unreadMessages').textContent = unreadCount;

  // Update sidebar badge
  const badge = document.getElementById('unreadBadge');
  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

/* ══════════════════════════════════════════════════
   Toast Notifications
   ══════════════════════════════════════════════════ */

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* ══════════════════════════════════════════════════
   Modal Helpers
   ══════════════════════════════════════════════════ */

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach((overlay) => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });
});

/* ══════════════════════════════════════════════════
   Confirm Delete
   ══════════════════════════════════════════════════ */

function confirmDelete(text, callback) {
  document.getElementById('confirmText').textContent = text;
  const btn = document.getElementById('confirmDeleteBtn');

  // Clone to remove old listeners
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);

  newBtn.addEventListener('click', () => {
    closeModal('confirmModal');
    callback();
  });

  openModal('confirmModal');
}

/* ══════════════════════════════════════════════════
   PROJECTS CRUD
   ══════════════════════════════════════════════════ */

/** Load and render projects with localStorage caching for resilience */
async function loadProjects() {
  // Show cached projects immediately while fetching fresh data
  const CACHE_KEY = 'portfolio_admin_projects_cache';
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const cachedProjects = JSON.parse(cached);
      if (Array.isArray(cachedProjects) && cachedProjects.length > 0 && projects.length === 0) {
        projects = cachedProjects;
        renderProjectsTable();
      }
    }
  } catch (e) { /* ignore cache errors */ }

  // Fetch fresh data from server
  const result = await authFetch('/projects');
  if (result && result.data) {
    projects = result.data;
    renderProjectsTable();
    // Update cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result.data));
    } catch (e) { /* ignore cache write errors */ }
  } else if (projects.length === 0) {
    // If fetch failed and no cache, try public endpoint without auth
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      if (data && data.data) {
        projects = data.data;
        renderProjectsTable();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
      }
    } catch (e) { /* server unavailable */ }
  }
}

/** Render projects data table */
function renderProjectsTable() {
  const tbody = document.getElementById('projectsTableBody');

  if (projects.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="icon">📂</div>
            <p>No projects yet. Click "Add Project" to get started.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = projects
    .map(
      (p) => `
      <tr>
        <td><strong style="color:var(--text-primary)">${escapeHTML(p.title)}</strong></td>
        <td>
          ${p.liveUrl
            ? `<a href="${/^https?:\/\//i.test(p.liveUrl) ? p.liveUrl : 'https://' + p.liveUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-primary, #3b82f6); font-weight:600; text-decoration:none; font-size:0.82rem; display:inline-flex; align-items:center; gap:5px;" title="${escapeHTML(p.liveUrl)}">
                <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;"></span>
                <span>Live Preview ↗</span>
              </a>`
            : '<span style="color:var(--text-muted);font-size:0.8rem;">—</span>'
          }
        </td>
        <td>
          <div class="table-tech-tags">
            ${p.technologies && p.technologies.length > 0
              ? p.technologies.map((t) => `<span>${escapeHTML(t)}</span>`).join('')
              : '<span style="color:var(--text-muted);font-size:0.75rem;">None</span>'}
          </div>
        </td>
        <td>${p.featured ? '<span class="badge badge-featured">Featured</span>' : '—'}</td>
        <td>${p.order}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editProject('${p._id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProject('${p._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

/** Test live URL in a new browser tab */
function testLiveUrl() {
  const input = document.getElementById('projectLiveUrl');
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    showToast('Please enter a live website URL first', 'error');
    return;
  }
  const fullUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}

/** Clear photo selection */
function clearPhoto() {
  const urlInput = document.getElementById('projectImageUrl');
  const fileInput = document.getElementById('projectPhotoFile');
  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';
  updatePhotoPreview();
  showToast('Photo removed. Click "Save Project" to persist.');
}

/** Handle photo file upload via persistent backend upload */
async function handlePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const urlInput = document.getElementById('projectImageUrl');
  const previewContainer = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');

  // Instant local visual preview
  if (previewImg && previewContainer) {
    previewImg.src = URL.createObjectURL(file);
    previewContainer.style.display = 'block';
  }

  showToast('⏳ Uploading photo to database...', 'info');

  const uploadedUrl = await uploadFileToBackend(file);
  if (uploadedUrl) {
    if (urlInput) urlInput.value = uploadedUrl;
    updatePhotoPreview();
    showToast('✅ Project photo uploaded! Click "Save Project" to persist.');
  } else {
    updatePhotoPreview();
  }
}

/** Update photo preview thumbnail */
function updatePhotoPreview() {
  const urlInput = document.getElementById('projectImageUrl');
  const previewContainer = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');

  if (!urlInput || !previewContainer || !previewImg) return;

  const url = urlInput.value.trim();
  if (url) {
    previewImg.src = resolveImageUrl(url);
    previewContainer.style.display = 'block';
  } else {
    previewImg.src = '';
    previewContainer.style.display = 'none';
  }
}

/** Open project modal for adding */
function openProjectModal() {
  document.getElementById('projectModalTitle').textContent = 'Add Project';
  document.getElementById('projectForm').reset();
  document.getElementById('projectId').value = '';
  document.getElementById('projectOrder').value = '0';
  const fileInput = document.getElementById('projectPhotoFile');
  if (fileInput) fileInput.value = '';
  updatePhotoPreview();
  openModal('projectModal');
}

/** Open project modal for editing */
function editProject(id) {
  const project = projects.find((p) => p._id === id);
  if (!project) return;

  document.getElementById('projectModalTitle').textContent = 'Edit Project';
  document.getElementById('projectId').value = project._id;
  document.getElementById('projectTitle').value = project.title || '';
  document.getElementById('projectDescription').value = project.description || '';
  document.getElementById('projectTechnologies').value = (project.technologies || []).join(', ');
  document.getElementById('projectImageUrl').value = project.imageUrl || '';
  document.getElementById('projectLiveUrl').value = project.liveUrl || '';
  document.getElementById('projectGithubUrl').value = project.githubUrl || '';
  document.getElementById('projectFeatured').checked = !!project.featured;
  document.getElementById('projectOrder').value = project.order || 0;
  const fileInput = document.getElementById('projectPhotoFile');
  if (fileInput) fileInput.value = '';
  updatePhotoPreview();

  openModal('projectModal');
}

/** Save project (create or update) */
async function saveProject() {
  const id = document.getElementById('projectId').value;
  const techInput = document.getElementById('projectTechnologies').value;

  const data = {
    title: document.getElementById('projectTitle').value.trim() || 'Untitled Project',
    description: document.getElementById('projectDescription').value.trim(),
    technologies: techInput ? techInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    imageUrl: document.getElementById('projectImageUrl').value.trim(),
    liveUrl: document.getElementById('projectLiveUrl').value.trim(),
    githubUrl: document.getElementById('projectGithubUrl').value.trim(),
    featured: document.getElementById('projectFeatured').checked,
    order: parseInt(document.getElementById('projectOrder').value) || 0,
  };

  let result;
  if (id) {
    // Update
    result = await authFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } else {
    // Create
    result = await authFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  if (result && result.success) {
    showToast(result.message || 'Project saved successfully!');
    closeModal('projectModal');
    await loadProjects();
    updateStats();
  } else {
    const errorDetail = result?.errors?.map((e) => e.message).join(', ');
    const msg = errorDetail || result?.message || 'Failed to save project. Please check your connection and try again.';
    showToast(msg, 'error');
  }
}

/** Delete a project */
function deleteProject(id) {
  const project = projects.find((p) => p._id === id);
  const title = project ? project.title : 'this project';
  confirmDelete(`Delete project "${title}"?`, async () => {
    const result = await authFetch(`/projects/${id}`, { method: 'DELETE' });
    if (result && result.success) {
      showToast('Project deleted');
      await loadProjects();
      updateStats();
    } else {
      showToast('Failed to delete project', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   SKILLS CRUD
   ══════════════════════════════════════════════════ */

/** Load and render skills */
async function loadSkills() {
  const result = await authFetch('/skills');
  if (result && result.data) {
    skills = result.data;
    renderSkillsTable();
  }
}

/** Render skills data table */
function renderSkillsTable() {
  const tbody = document.getElementById('skillsTableBody');

  if (skills.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="icon">🎯</div>
            <p>No skills yet. Click "Add Skill" to get started.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = skills
    .map(
      (s) => `
      <tr>
        <td><strong style="color:var(--text-primary)">${escapeHTML(s.name)}</strong></td>
        <td>${escapeHTML(s.category)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:4px;background:var(--bg-tertiary);border-radius:2px;max-width:80px;">
              <div style="height:100%;width:${s.proficiency}%;background:var(--accent-gradient);border-radius:2px;"></div>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-accent);">${s.proficiency}%</span>
          </div>
        </td>
        <td>${s.icon || '—'}</td>
        <td>${s.order}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editSkill('${s._id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSkill('${s._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

/** Open skill modal for adding */
function openSkillModal() {
  document.getElementById('skillModalTitle').textContent = 'Add Skill';
  document.getElementById('skillForm').reset();
  document.getElementById('skillId').value = '';
  document.getElementById('skillOrder').value = '0';
  document.getElementById('skillProficiency').value = '50';
  document.getElementById('skillCategory').value = 'Frontend';
  openModal('skillModal');
}

/** Open skill modal for editing */
function editSkill(id) {
  const skill = skills.find((s) => s._id === id);
  if (!skill) return;

  document.getElementById('skillModalTitle').textContent = 'Edit Skill';
  document.getElementById('skillId').value = skill._id;
  document.getElementById('skillName').value = skill.name || '';
  document.getElementById('skillCategory').value = skill.category || 'Other';
  document.getElementById('skillProficiency').value = skill.proficiency ?? 50;
  document.getElementById('skillIcon').value = skill.icon || '';
  document.getElementById('skillOrder').value = skill.order || 0;

  openModal('skillModal');
}

/** Save skill (create or update) */
async function saveSkill() {
  const id = document.getElementById('skillId').value;

  const data = {
    name: document.getElementById('skillName').value.trim(),
    category: document.getElementById('skillCategory').value || 'Other',
    proficiency: parseInt(document.getElementById('skillProficiency').value) || 50,
    icon: document.getElementById('skillIcon').value.trim(),
    order: parseInt(document.getElementById('skillOrder').value) || 0,
  };

  // Only name is strictly required
  if (!data.name) {
    showToast('Skill name is required', 'error');
    return;
  }

  let result;
  if (id) {
    result = await authFetch(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } else {
    result = await authFetch('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  if (result && result.success) {
    showToast(result.message || 'Skill saved!');
    closeModal('skillModal');
    await loadSkills();
    updateStats();
  } else {
    const errorDetail = result?.errors?.map((e) => e.message).join(', ');
    const msg = errorDetail || result?.message || 'Failed to save skill';
    showToast(msg, 'error');
  }
}

/** Delete a skill */
function deleteSkill(id) {
  const skill = skills.find((s) => s._id === id);
  const name = skill ? skill.name : 'this skill';
  confirmDelete(`Delete skill "${name}"?`, async () => {
    const result = await authFetch(`/skills/${id}`, { method: 'DELETE' });
    if (result && result.success) {
      showToast('Skill deleted');
      await loadSkills();
      updateStats();
    } else {
      showToast('Failed to delete skill', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   MESSAGES
   ══════════════════════════════════════════════════ */

/** Load and render messages */
async function loadMessages() {
  const result = await authFetch('/messages');
  if (result && result.data) {
    messages = result.data;
    renderMessagesTable();
  }
}

/** Render messages data table */
function renderMessagesTable() {
  const tbody = document.getElementById('messagesTableBody');

  if (messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="icon">💬</div>
            <p>No messages yet. They'll appear here when visitors contact you.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = messages
    .map(
      (m) => `
      <tr style="${!m.read ? 'background:rgba(59,130,246,0.03);' : ''}">
        <td>
          <span class="badge ${m.read ? 'badge-read' : 'badge-unread'}">
            ${m.read ? 'Read' : 'New'}
          </span>
        </td>
        <td>
          <div>
            <strong style="color:var(--text-primary)">${escapeHTML(m.name)}</strong>
            <div class="message-meta">${escapeHTML(m.email)}</div>
          </div>
        </td>
        <td style="color:var(--text-primary)">${escapeHTML(m.subject)}</td>
        <td><div class="message-preview">${escapeHTML(m.message)}</div></td>
        <td class="message-meta">${formatDate(m.createdAt)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="viewMessage('${m._id}')">👁️</button>
            <button class="btn btn-secondary btn-sm" onclick="toggleMessageRead('${m._id}')" title="${m.read ? 'Mark unread' : 'Mark read'}">
              ${m.read ? '📭' : '📬'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteMessage('${m._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

/** View full message in modal */
function viewMessage(id) {
  const msg = messages.find((m) => m._id === id);
  if (!msg) return;

  document.getElementById('msgViewName').textContent = msg.name;
  document.getElementById('msgViewEmail').textContent = msg.email;
  document.getElementById('msgViewSubject').textContent = msg.subject;
  document.getElementById('msgViewBody').textContent = msg.message;
  document.getElementById('msgViewDate').textContent = formatDate(msg.createdAt);

  openModal('messageModal');

  // Auto-mark as read
  if (!msg.read) {
    toggleMessageRead(id);
  }
}

/** Toggle message read/unread status */
async function toggleMessageRead(id) {
  const result = await authFetch(`/messages/${id}/read`, { method: 'PATCH' });
  if (result && result.success) {
    await loadMessages();
    updateStats();
  }
}

/** Delete a message */
function deleteMessage(id) {
  confirmDelete('Delete this message?', async () => {
    const result = await authFetch(`/messages/${id}`, { method: 'DELETE' });
    if (result && result.success) {
      showToast('Message deleted');
      await loadMessages();
      updateStats();
    } else {
      showToast('Failed to delete message', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   Utility Functions
   ══════════════════════════════════════════════════ */

/** Escape HTML to prevent XSS in rendered content */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Format an ISO date string into a readable format */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ── Admin Profile ────────────────────────────── */

/** Open the profile edit modal */
function openProfileModal() {
  const admin = getAdmin();
  if (!admin) return;

  document.getElementById('profileEmail').value = admin.email;
  document.getElementById('profilePassword').value = '';
  openModal('profileModal');
}

/** Save admin profile changes */
async function saveProfile() {
  const email = document.getElementById('profileEmail').value.trim();
  const password = document.getElementById('profilePassword').value;

  if (!email) {
    showToast('Email address is required', 'error');
    return;
  }

  const data = { email };
  if (password) {
    data.password = password;
  }

  const result = await authFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (result && result.success) {
    showToast(result.message || 'Profile updated successfully!');

    // Update local storage data
    const currentAdmin = getAdmin() || {};
    currentAdmin.email = result.data.admin.email;
    localStorage.setItem(ADMIN_KEY, JSON.stringify(currentAdmin));

    // Update UI elements
    const emailEl = document.getElementById('adminEmail');
    const avatarEl = document.getElementById('adminAvatar');
    if (emailEl) emailEl.textContent = result.data.admin.email;
    if (avatarEl) avatarEl.textContent = result.data.admin.email.charAt(0).toUpperCase();

    closeModal('profileModal');

    // If password was updated, force re-login for security
    if (password) {
      showToast('Password changed. Redirecting to login...', 'success');
      setTimeout(() => logout(), 1500);
    }
  } else {
    showToast(result?.message || 'Failed to update profile', 'error');
  }
}

/* ══════════════════════════════════════════════════
   Site Content & Profile Settings Management
   ══════════════════════════════════════════════════ */

let currentSiteProfile = null;

/** Load site profile settings from API and populate all admin sections */
async function loadSiteProfileSettings() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const data = await res.json();
    if (data.success && data.data) {
      currentSiteProfile = data.data;

      // Hero
      const heroTitleEl = document.getElementById('siteHeroTitle');
      if (heroTitleEl) heroTitleEl.value = currentSiteProfile.heroTitle || '';
      const heroSubEl = document.getElementById('siteHeroSubtitle');
      if (heroSubEl) heroSubEl.value = currentSiteProfile.heroSubtitle || '';

      // Profile & About
      const nameEl = document.getElementById('siteName');
      if (nameEl) nameEl.value = currentSiteProfile.name || '';
      const pfpEl = document.getElementById('siteProfileImage');
      if (pfpEl) {
        pfpEl.value = currentSiteProfile.profileImage || '';
        updateProfilePhotoPreview();
      }
      const bioEl = document.getElementById('siteAboutBio');
      if (bioEl) bioEl.value = currentSiteProfile.aboutBio || '';
      const specEl = document.getElementById('siteAboutSpecialization');
      if (specEl) specEl.value = currentSiteProfile.aboutSpecialization || '';
      const highlightEl = document.getElementById('siteAboutHighlight');
      if (highlightEl) highlightEl.value = currentSiteProfile.aboutHighlight || '';

      // Contact & Social
      const emailEl = document.getElementById('siteContactEmail');
      if (emailEl) emailEl.value = currentSiteProfile.contactEmail || '';
      const phoneEl = document.getElementById('siteContactPhone');
      if (phoneEl) phoneEl.value = currentSiteProfile.contactPhone || '';
      const locEl = document.getElementById('siteContactLocation');
      if (locEl) locEl.value = currentSiteProfile.contactLocation || '';

      renderSocialLinksAdmin(currentSiteProfile.socialLinks || []);

      // Resume
      const resumeEl = document.getElementById('siteResumeUrl');
      if (resumeEl) resumeEl.value = currentSiteProfile.resumeUrl || 'resume.pdf';

      // Footer Marquee
      const marqueeEl = document.getElementById('siteMarqueeText');
      if (marqueeEl) marqueeEl.value = currentSiteProfile.marqueeText || '';

      // Hobbies Quick List
      renderHobbies(currentSiteProfile.hobbies || []);

      // Experience & Education Tables
      renderExperienceAdmin(currentSiteProfile.experience || []);
      renderEducationAdmin(currentSiteProfile.education || []);

      // Certifications & Achievements Tables
      renderCertificationsAdmin(currentSiteProfile.certifications || []);
      renderAchievementsAdmin(currentSiteProfile.achievements || []);

      updateStats();
    }
  } catch (err) {
    showToast('Failed to load site profile settings', 'error');
  }
}

/** Clear profile photo */
function clearProfilePhoto() {
  const input = document.getElementById('siteProfileImage');
  const upload = document.getElementById('siteProfileUpload');
  if (input) input.value = '';
  if (upload) upload.value = '';
  updateProfilePhotoPreview();
  showToast('Profile photo cleared. Click "Save All Changes" to persist.');
}

/** Update profile photo live thumbnail */
function updateProfilePhotoPreview() {
  const input = document.getElementById('siteProfileImage');
  const container = document.getElementById('siteProfilePreviewContainer');
  const img = document.getElementById('siteProfilePreviewImg');
  if (!input || !container || !img) return;

  const val = input.value.trim();
  if (val) {
    img.src = resolveImageUrl(val);
    container.style.display = 'block';
  } else {
    img.src = '';
    container.style.display = 'none';
  }
}

/** Handle direct profile image upload */
async function handleProfilePhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const input = document.getElementById('siteProfileImage');
  const container = document.getElementById('siteProfilePreviewContainer');
  const img = document.getElementById('siteProfilePreviewImg');

  // Instant local visual preview
  if (img && container) {
    img.src = URL.createObjectURL(file);
    container.style.display = 'block';
  }

  showToast('⏳ Uploading profile photo to database...', 'info');

  const uploadedUrl = await uploadFileToBackend(file);
  if (uploadedUrl) {
    if (input) input.value = uploadedUrl;
    updateProfilePhotoPreview();
    showToast('✅ Profile photo uploaded! Click "Save All Changes" to persist.');
  } else {
    updateProfilePhotoPreview();
  }
}

/** Test current resume link */
function testResumeLink() {
  const url = document.getElementById('siteResumeUrl').value.trim() || 'resume.pdf';
  window.open(resolveImageUrl(url), '_blank');
}

/** Handle direct resume upload */
async function handleResumeUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  showToast('⏳ Uploading resume PDF...', 'info');
  const uploadedUrl = await uploadFileToBackend(file);
  if (uploadedUrl) {
    const input = document.getElementById('siteResumeUrl');
    if (input) input.value = uploadedUrl;
    showToast('✅ Resume PDF uploaded! Click "Save All Changes" to persist.');
  }
}

/* ── Social Media Links Admin ──────────────────── */

function renderSocialLinksAdmin(links) {
  const container = document.getElementById('socialLinksAdminContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!links || links.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No social media links added. Click "+ Add Social Link" to add your GitHub, LinkedIn, etc.</p>';
    return;
  }

  links.forEach((s) => {
    addSocialLinkRow(s.platform, s.label, s.url);
  });
}

function addSocialLinkRow(platform = 'github', label = '', url = '') {
  const container = document.getElementById('socialLinksAdminContainer');
  if (!container) return;

  if (container.querySelector('p')) {
    container.innerHTML = '';
  }

  const row = document.createElement('div');
  row.className = 'social-link-input-row';
  row.style.cssText = 'display:flex; gap:10px; align-items:center; margin-bottom:10px; background:var(--bg-input); padding:10px; border-radius:8px;';

  row.innerHTML = `
    <select class="social-platform-select" style="width:130px;">
      <option value="github" ${platform === 'github' ? 'selected' : ''}>GitHub</option>
      <option value="linkedin" ${platform === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
      <option value="twitter" ${platform === 'twitter' ? 'selected' : ''}>Twitter / X</option>
      <option value="email" ${platform === 'email' ? 'selected' : ''}>Email</option>
      <option value="instagram" ${platform === 'instagram' ? 'selected' : ''}>Instagram</option>
      <option value="portfolio" ${platform === 'portfolio' ? 'selected' : ''}>Website</option>
      <option value="leetcode" ${platform === 'leetcode' ? 'selected' : ''}>LeetCode</option>
    </select>
    <input type="text" class="social-label-input" placeholder="Label (e.g. GitHub)" value="${label || ''}" style="width:140px;">
    <input type="text" class="social-url-input" placeholder="URL (e.g. https://github.com/...)" value="${url || ''}" style="flex:1;">
    <button type="button" class="btn btn-secondary btn-sm" onclick="removeSocialLinkRow(this)" style="color:var(--accent-red,#ef4444); border-color:var(--border-color);">✕</button>
  `;

  container.appendChild(row);
}

function removeSocialLinkRow(btn) {
  const row = btn.closest('.social-link-input-row');
  if (row) row.remove();
}

/** Render interest/hobby rows in the admin form */
function renderHobbies(hobbies) {
  const container = document.getElementById('hobbiesContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!hobbies || hobbies.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No interests added yet. Click "+ Add Interest" to add one.</p>';
    return;
  }

  hobbies.forEach((hobby, index) => {
    addHobbyRow(hobby.title, hobby.image, hobby.num || `0${index + 1}`);
  });
}

/** Add a new hobby input row */
function addHobbyRow(title = '', image = '', num = '') {
  const container = document.getElementById('hobbiesContainer');
  if (!container) return;

  if (container.querySelector('p')) {
    container.innerHTML = '';
  }

  const row = document.createElement('div');
  row.className = 'hobby-input-row';
  row.style.cssText = 'display:flex; gap:12px; align-items:center; margin-bottom:12px; background:var(--bg-input); padding:12px; border-radius:8px;';

  row.innerHTML = `
    <input type="text" class="hobby-num-input" placeholder="01" value="${num}" style="width:60px;">
    <input type="text" class="hobby-title-input" placeholder="Interest Title (e.g. MUSIC)" value="${title}" style="flex:1;">
    <input type="text" class="hobby-image-input" placeholder="Image filename (e.g. hobby_music.jpg)" value="${image}" style="flex:1.5;">
    <button type="button" class="btn btn-secondary" onclick="removeHobbyRow(this)" style="color:var(--accent-red,#ff5555); border-color:var(--border-color);">🗑️</button>
  `;

  container.appendChild(row);
}

function removeHobbyRow(btn) {
  const row = btn.closest('.hobby-input-row');
  if (row) row.remove();
}

/** Save all site profile settings to API */
async function saveSiteProfileSettings() {
  const heroTitle = document.getElementById('siteHeroTitle').value;
  const heroSubtitle = document.getElementById('siteHeroSubtitle').value;
  const name = document.getElementById('siteName').value.trim();
  const profileImage = document.getElementById('siteProfileImage').value.trim();
  const aboutBio = document.getElementById('siteAboutBio').value.trim();
  const aboutSpecialization = document.getElementById('siteAboutSpecialization').value.trim();
  const aboutHighlight = document.getElementById('siteAboutHighlight').value.trim();
  const contactEmail = document.getElementById('siteContactEmail').value.trim();
  const contactPhone = (document.getElementById('siteContactPhone')?.value || '').trim();
  const contactLocation = (document.getElementById('siteContactLocation')?.value || '').trim();
  const resumeUrl = (document.getElementById('siteResumeUrl')?.value || '').trim();
  const marqueeText = document.getElementById('siteMarqueeText').value.trim();

  // Collect social links
  const socialRows = document.querySelectorAll('.social-link-input-row');
  const socialLinks = [];
  socialRows.forEach((row, idx) => {
    const platform = row.querySelector('.social-platform-select').value;
    const label = row.querySelector('.social-label-input').value.trim();
    const url = row.querySelector('.social-url-input').value.trim();
    if (url) {
      socialLinks.push({ platform, label: label || platform, url, order: idx + 1 });
    }
  });

  // Collect hobbies
  const hobbiesContainer = document.getElementById('hobbiesContainer');
  const hobbyRows = hobbiesContainer ? hobbiesContainer.querySelectorAll('.hobby-input-row') : [];
  const hobbies = [];

  hobbyRows.forEach((row, idx) => {
    const num = row.querySelector('.hobby-num-input').value.trim() || `0${idx + 1}`;
    const title = row.querySelector('.hobby-title-input').value.trim();
    const image = row.querySelector('.hobby-image-input').value.trim();

    if (title) {
      hobbies.push({ num, title, image });
    }
  });

  const payload = {
    heroTitle,
    heroSubtitle,
    name,
    profileImage,
    aboutBio,
    aboutSpecialization,
    aboutHighlight,
    contactEmail,
    contactPhone,
    contactLocation,
    resumeUrl,
    marqueeText,
    hobbies,
    socialLinks,
  };

  // Preserve existing experience, education, certs, and achievements arrays
  if (currentSiteProfile) {
    if (currentSiteProfile.experience) payload.experience = currentSiteProfile.experience;
    if (currentSiteProfile.education) payload.education = currentSiteProfile.education;
    if (currentSiteProfile.certifications) payload.certifications = currentSiteProfile.certifications;
    if (currentSiteProfile.achievements) payload.achievements = currentSiteProfile.achievements;
  }

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (result && result.success) {
    showToast('Site content & profile updated successfully!', 'success');
    currentSiteProfile = result.data;
    updateStats();
  } else {
    showToast(result?.message || 'Failed to update site content', 'error');
  }
}

/* ══════════════════════════════════════════════════
   WORK EXPERIENCE CRUD
   ══════════════════════════════════════════════════ */

function renderExperienceAdmin(list) {
  const tbody = document.getElementById('experienceTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">
            <div class="icon">💼</div>
            <p>No work experience added yet. Click "+ Add Experience" above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = sorted.map((exp, idx) => {
    const id = exp._id || `exp_${idx}`;
    const techs = Array.isArray(exp.technologies) ? exp.technologies.join(', ') : '';
    return `
      <tr>
        <td><strong style="color:var(--text-primary);">${escapeHTML(exp.role)}</strong></td>
        <td>${escapeHTML(exp.company)}</td>
        <td><span class="badge badge-read">${escapeHTML(exp.period || 'Present')}</span></td>
        <td>${escapeHTML(exp.location || '—')}</td>
        <td><small style="color:var(--text-secondary);">${escapeHTML(techs || '—')}</small></td>
        <td>${exp.order || 0}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editExperience('${id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteExperience('${id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openExperienceModal(id = null) {
  document.getElementById('expId').value = '';
  document.getElementById('expRole').value = '';
  document.getElementById('expCompany').value = '';
  document.getElementById('expPeriod').value = '';
  document.getElementById('expLocation').value = '';
  document.getElementById('expDescription').value = '';
  document.getElementById('expTechnologies').value = '';
  document.getElementById('expOrder').value = '0';
  document.getElementById('experienceModalTitle').textContent = 'Add Work Experience';

  if (id && currentSiteProfile && Array.isArray(currentSiteProfile.experience)) {
    const exp = currentSiteProfile.experience.find((e, idx) => String(e._id || `exp_${idx}`) === String(id));
    if (exp) {
      document.getElementById('experienceModalTitle').textContent = 'Edit Work Experience';
      document.getElementById('expId').value = id;
      document.getElementById('expRole').value = exp.role || '';
      document.getElementById('expCompany').value = exp.company || '';
      document.getElementById('expPeriod').value = exp.period || '';
      document.getElementById('expLocation').value = exp.location || '';
      document.getElementById('expDescription').value = exp.description || '';
      document.getElementById('expTechnologies').value = Array.isArray(exp.technologies) ? exp.technologies.join(', ') : '';
      document.getElementById('expOrder').value = exp.order || 0;
    }
  }

  openModal('experienceModal');
}

function editExperience(id) {
  openExperienceModal(id);
}

async function saveExperience() {
  const id = document.getElementById('expId').value;
  const role = document.getElementById('expRole').value.trim();
  const company = document.getElementById('expCompany').value.trim();
  const period = document.getElementById('expPeriod').value.trim();
  const location = document.getElementById('expLocation').value.trim();
  const description = document.getElementById('expDescription').value.trim();
  const techStr = document.getElementById('expTechnologies').value.trim();
  const order = parseInt(document.getElementById('expOrder').value) || 0;

  if (!role || !company) {
    showToast('Role and Company are required', 'error');
    return;
  }

  const technologies = techStr ? techStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!currentSiteProfile) currentSiteProfile = {};
  if (!Array.isArray(currentSiteProfile.experience)) currentSiteProfile.experience = [];

  if (id) {
    const idx = currentSiteProfile.experience.findIndex((e, i) => String(e._id || `exp_${i}`) === String(id));
    if (idx >= 0) {
      currentSiteProfile.experience[idx] = {
        ...currentSiteProfile.experience[idx],
        role, company, period, location, description, technologies, order,
      };
    }
  } else {
    currentSiteProfile.experience.push({
      role, company, period, location, description, technologies, order,
    });
  }

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(currentSiteProfile),
  });

  if (result && result.success) {
    currentSiteProfile = result.data;
    closeModal('experienceModal');
    showToast('Experience saved successfully!');
    renderExperienceAdmin(currentSiteProfile.experience || []);
    updateStats();
  } else {
    showToast(result?.message || 'Failed to save experience', 'error');
  }
}

function deleteExperience(id) {
  confirmDelete('Delete this experience entry?', async () => {
    if (!currentSiteProfile || !Array.isArray(currentSiteProfile.experience)) return;
    currentSiteProfile.experience = currentSiteProfile.experience.filter((e, idx) => String(e._id || `exp_${idx}`) !== String(id));

    const result = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(currentSiteProfile),
    });

    if (result && result.success) {
      currentSiteProfile = result.data;
      showToast('Experience entry deleted');
      renderExperienceAdmin(currentSiteProfile.experience || []);
      updateStats();
    } else {
      showToast(result?.message || 'Failed to delete experience', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   FORMAL EDUCATION CRUD
   ══════════════════════════════════════════════════ */

function renderEducationAdmin(list) {
  const tbody = document.getElementById('educationTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="icon">🎓</div>
            <p>No education added yet. Click "+ Add Education" above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = sorted.map((edu, idx) => {
    const id = edu._id || `edu_${idx}`;
    return `
      <tr>
        <td><strong style="color:var(--text-primary);">${escapeHTML(edu.degree)}</strong></td>
        <td>${escapeHTML(edu.institution)}</td>
        <td><span class="badge badge-read">${escapeHTML(edu.year || '—')}</span></td>
        <td>${escapeHTML(edu.grade || '—')}</td>
        <td>${edu.order || 0}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editEducation('${id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteEducation('${id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openEducationModal(id = null) {
  document.getElementById('eduId').value = '';
  document.getElementById('eduDegree').value = '';
  document.getElementById('eduInstitution').value = '';
  document.getElementById('eduYear').value = '';
  document.getElementById('eduGrade').value = '';
  document.getElementById('eduDescription').value = '';
  document.getElementById('eduOrder').value = '0';
  document.getElementById('educationModalTitle').textContent = 'Add Education';

  if (id && currentSiteProfile && Array.isArray(currentSiteProfile.education)) {
    const edu = currentSiteProfile.education.find((e, idx) => String(e._id || `edu_${idx}`) === String(id));
    if (edu) {
      document.getElementById('educationModalTitle').textContent = 'Edit Education';
      document.getElementById('eduId').value = id;
      document.getElementById('eduDegree').value = edu.degree || '';
      document.getElementById('eduInstitution').value = edu.institution || '';
      document.getElementById('eduYear').value = edu.year || '';
      document.getElementById('eduGrade').value = edu.grade || '';
      document.getElementById('eduDescription').value = edu.description || '';
      document.getElementById('eduOrder').value = edu.order || 0;
    }
  }

  openModal('educationModal');
}

function editEducation(id) {
  openEducationModal(id);
}

async function saveEducation() {
  const id = document.getElementById('eduId').value;
  const degree = document.getElementById('eduDegree').value.trim();
  const institution = document.getElementById('eduInstitution').value.trim();
  const year = document.getElementById('eduYear').value.trim();
  const grade = document.getElementById('eduGrade').value.trim();
  const description = document.getElementById('eduDescription').value.trim();
  const order = parseInt(document.getElementById('eduOrder').value) || 0;

  if (!degree || !institution) {
    showToast('Degree and Institution are required', 'error');
    return;
  }

  if (!currentSiteProfile) currentSiteProfile = {};
  if (!Array.isArray(currentSiteProfile.education)) currentSiteProfile.education = [];

  if (id) {
    const idx = currentSiteProfile.education.findIndex((e, i) => String(e._id || `edu_${i}`) === String(id));
    if (idx >= 0) {
      currentSiteProfile.education[idx] = {
        ...currentSiteProfile.education[idx],
        degree, institution, year, grade, description, order,
      };
    }
  } else {
    currentSiteProfile.education.push({
      degree, institution, year, grade, description, order,
    });
  }

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(currentSiteProfile),
  });

  if (result && result.success) {
    currentSiteProfile = result.data;
    closeModal('educationModal');
    showToast('Education saved successfully!');
    renderEducationAdmin(currentSiteProfile.education || []);
    updateStats();
  } else {
    showToast(result?.message || 'Failed to save education', 'error');
  }
}

function deleteEducation(id) {
  confirmDelete('Delete this education entry?', async () => {
    if (!currentSiteProfile || !Array.isArray(currentSiteProfile.education)) return;
    currentSiteProfile.education = currentSiteProfile.education.filter((e, idx) => String(e._id || `edu_${idx}`) !== String(id));

    const result = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(currentSiteProfile),
    });

    if (result && result.success) {
      currentSiteProfile = result.data;
      showToast('Education entry deleted');
      renderEducationAdmin(currentSiteProfile.education || []);
      updateStats();
    } else {
      showToast(result?.message || 'Failed to delete education', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   CERTIFICATIONS CRUD
   ══════════════════════════════════════════════════ */

function renderCertificationsAdmin(list) {
  const tbody = document.getElementById('certificationsTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="table-empty">
            <div class="icon">🏆</div>
            <p>No certifications added yet. Click "+ Add Certification" above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = sorted.map((cert, idx) => {
    const id = cert._id || `cert_${idx}`;
    const linkPreview = cert.credentialUrl
      ? `<a href="${cert.credentialUrl}" target="_blank" style="color:var(--text-accent);">🔗 View</a>`
      : '—';
    return `
      <tr>
        <td><strong style="color:var(--text-primary);">${escapeHTML(cert.title)}</strong></td>
        <td>${escapeHTML(cert.issuer)}</td>
        <td>${escapeHTML(cert.issueDate || '—')}</td>
        <td><small style="color:var(--text-secondary);">${escapeHTML(cert.credentialId || '—')}</small></td>
        <td>${linkPreview}</td>
        <td>${cert.order || 0}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editCertification('${id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCertification('${id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCertificationModal(id = null) {
  document.getElementById('certId').value = '';
  document.getElementById('certTitle').value = '';
  document.getElementById('certIssuer').value = '';
  document.getElementById('certIssueDate').value = '';
  document.getElementById('certCredentialId').value = '';
  document.getElementById('certCredentialUrl').value = '';
  document.getElementById('certOrder').value = '0';
  document.getElementById('certificationModalTitle').textContent = 'Add Certification';

  if (id && currentSiteProfile && Array.isArray(currentSiteProfile.certifications)) {
    const cert = currentSiteProfile.certifications.find((c, idx) => String(c._id || `cert_${idx}`) === String(id));
    if (cert) {
      document.getElementById('certificationModalTitle').textContent = 'Edit Certification';
      document.getElementById('certId').value = id;
      document.getElementById('certTitle').value = cert.title || '';
      document.getElementById('certIssuer').value = cert.issuer || '';
      document.getElementById('certIssueDate').value = cert.issueDate || '';
      document.getElementById('certCredentialId').value = cert.credentialId || '';
      document.getElementById('certCredentialUrl').value = cert.credentialUrl || '';
      document.getElementById('certOrder').value = cert.order || 0;
    }
  }

  openModal('certificationModal');
}

function editCertification(id) {
  openCertificationModal(id);
}

async function saveCertification() {
  const id = document.getElementById('certId').value;
  const title = document.getElementById('certTitle').value.trim();
  const issuer = document.getElementById('certIssuer').value.trim();
  const issueDate = document.getElementById('certIssueDate').value.trim();
  const credentialId = document.getElementById('certCredentialId').value.trim();
  const credentialUrl = document.getElementById('certCredentialUrl').value.trim();
  const order = parseInt(document.getElementById('certOrder').value) || 0;

  if (!title || !issuer) {
    showToast('Title and Issuer are required', 'error');
    return;
  }

  if (!currentSiteProfile) currentSiteProfile = {};
  if (!Array.isArray(currentSiteProfile.certifications)) currentSiteProfile.certifications = [];

  if (id) {
    const idx = currentSiteProfile.certifications.findIndex((c, i) => String(c._id || `cert_${i}`) === String(id));
    if (idx >= 0) {
      currentSiteProfile.certifications[idx] = {
        ...currentSiteProfile.certifications[idx],
        title, issuer, issueDate, credentialId, credentialUrl, order,
      };
    }
  } else {
    currentSiteProfile.certifications.push({
      title, issuer, issueDate, credentialId, credentialUrl, order,
    });
  }

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(currentSiteProfile),
  });

  if (result && result.success) {
    currentSiteProfile = result.data;
    closeModal('certificationModal');
    showToast('Certification saved successfully!');
    renderCertificationsAdmin(currentSiteProfile.certifications || []);
    updateStats();
  } else {
    showToast(result?.message || 'Failed to save certification', 'error');
  }
}

function deleteCertification(id) {
  confirmDelete('Delete this certification?', async () => {
    if (!currentSiteProfile || !Array.isArray(currentSiteProfile.certifications)) return;
    currentSiteProfile.certifications = currentSiteProfile.certifications.filter((c, idx) => String(c._id || `cert_${idx}`) !== String(id));

    const result = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(currentSiteProfile),
    });

    if (result && result.success) {
      currentSiteProfile = result.data;
      showToast('Certification deleted');
      renderCertificationsAdmin(currentSiteProfile.certifications || []);
      updateStats();
    } else {
      showToast(result?.message || 'Failed to delete certification', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   KEY ACHIEVEMENTS CRUD
   ══════════════════════════════════════════════════ */

function renderAchievementsAdmin(list) {
  const tbody = document.getElementById('achievementsTableBody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="table-empty">
            <div class="icon">⚡</div>
            <p>No achievements added yet. Click "+ Add Achievement" above.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  tbody.innerHTML = sorted.map((ach, idx) => {
    const id = ach._id || `ach_${idx}`;
    return `
      <tr>
        <td><strong style="color:var(--text-primary);">${escapeHTML(ach.title)}</strong></td>
        <td><small style="color:var(--text-secondary);">${escapeHTML(ach.description || '—')}</small></td>
        <td>${escapeHTML(ach.date || '—')}</td>
        <td>${ach.order || 0}</td>
        <td>
          <div class="actions">
            <button class="btn btn-secondary btn-sm" onclick="editAchievement('${id}')">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAchievement('${id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAchievementModal(id = null) {
  document.getElementById('achieveId').value = '';
  document.getElementById('achieveTitle').value = '';
  document.getElementById('achieveDescription').value = '';
  document.getElementById('achieveDate').value = '';
  document.getElementById('achieveOrder').value = '0';
  document.getElementById('achievementModalTitle').textContent = 'Add Achievement';

  if (id && currentSiteProfile && Array.isArray(currentSiteProfile.achievements)) {
    const ach = currentSiteProfile.achievements.find((a, idx) => String(a._id || `ach_${idx}`) === String(id));
    if (ach) {
      document.getElementById('achievementModalTitle').textContent = 'Edit Achievement';
      document.getElementById('achieveId').value = id;
      document.getElementById('achieveTitle').value = ach.title || '';
      document.getElementById('achieveDescription').value = ach.description || '';
      document.getElementById('achieveDate').value = ach.date || '';
      document.getElementById('achieveOrder').value = ach.order || 0;
    }
  }

  openModal('achievementModal');
}

function editAchievement(id) {
  openAchievementModal(id);
}

async function saveAchievement() {
  const id = document.getElementById('achieveId').value;
  const title = document.getElementById('achieveTitle').value.trim();
  const description = document.getElementById('achieveDescription').value.trim();
  const date = document.getElementById('achieveDate').value.trim();
  const order = parseInt(document.getElementById('achieveOrder').value) || 0;

  if (!title) {
    showToast('Achievement title is required', 'error');
    return;
  }

  if (!currentSiteProfile) currentSiteProfile = {};
  if (!Array.isArray(currentSiteProfile.achievements)) currentSiteProfile.achievements = [];

  if (id) {
    const idx = currentSiteProfile.achievements.findIndex((a, i) => String(a._id || `ach_${i}`) === String(id));
    if (idx >= 0) {
      currentSiteProfile.achievements[idx] = {
        ...currentSiteProfile.achievements[idx],
        title, description, date, order,
      };
    }
  } else {
    currentSiteProfile.achievements.push({
      title, description, date, order,
    });
  }

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(currentSiteProfile),
  });

  if (result && result.success) {
    currentSiteProfile = result.data;
    closeModal('achievementModal');
    showToast('Achievement saved successfully!');
    renderAchievementsAdmin(currentSiteProfile.achievements || []);
    updateStats();
  } else {
    showToast(result?.message || 'Failed to save achievement', 'error');
  }
}

function deleteAchievement(id) {
  confirmDelete('Delete this achievement?', async () => {
    if (!currentSiteProfile || !Array.isArray(currentSiteProfile.achievements)) return;
    currentSiteProfile.achievements = currentSiteProfile.achievements.filter((a, idx) => String(a._id || `ach_${idx}`) !== String(id));

    const result = await authFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(currentSiteProfile),
    });

    if (result && result.success) {
      currentSiteProfile = result.data;
      showToast('Achievement deleted');
      renderAchievementsAdmin(currentSiteProfile.achievements || []);
      updateStats();
    } else {
      showToast(result?.message || 'Failed to delete achievement', 'error');
    }
  });
}

/* ══════════════════════════════════════════════════
   INTERESTS CRUD
   ══════════════════════════════════════════════════ */

/** Load all interest categories from the API */
async function loadInterestsAdmin() {
  const result = await authFetch('/interests');
  if (result && result.data) {
    interestCategories = result.data;
    renderInterestCategoriesList();
  }
}

/** Render all interest category cards with their items tables */
function renderInterestCategoriesList() {
  const container = document.getElementById('interestCategoriesList');
  if (!container) return;

  if (interestCategories.length === 0) {
    container.innerHTML = `
      <div class="data-table-wrapper" style="padding: 32px; text-align: center;">
        <div class="table-empty">
          <div class="icon">💡</div>
          <p>No interests yet. Click "Add Interest Category" to get started.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = interestCategories.map((cat) => {
    const items = Array.isArray(cat.items) ? cat.items : [];
    const imgPreview = cat.image
      ? `<img src="${cat.image}" alt="${cat.title}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; border:1px solid var(--border-color);">`
      : '<span style="color:var(--text-muted);">—</span>';

    const itemsHtml = items.length > 0
      ? `<table class="data-table" style="margin-top:12px;">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Tag</th>
              <th>Image</th>
              <th>Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => {
              const itemImgPreview = item.image
                ? `<img src="${item.image}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; border:1px solid var(--border-color);">`
                : '<span style="color:var(--text-muted);">—</span>';
              const linkText = item.link
                ? `<a href="${item.link}" target="_blank" rel="noopener" style="color:var(--text-accent); font-size:0.8rem;">🔗 Open</a>`
                : '<span style="color:var(--text-muted);">—</span>';
              return `
                <tr>
                  <td>${item.title || '<em style="color:var(--text-muted);">Untitled</em>'}</td>
                  <td style="color:var(--text-secondary); font-size:0.85rem;">${item.subtitle || '—'}</td>
                  <td><span style="background:var(--bg-tertiary); padding:2px 8px; border-radius:4px; font-size:0.75rem;">${item.tag || '—'}</span></td>
                  <td>${itemImgPreview}</td>
                  <td>${linkText}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-secondary btn-sm" onclick="editInterestItem('${cat._id}', '${item._id}')" title="Edit">✏️</button>
                      <button class="btn btn-secondary btn-sm" onclick="deleteInterestItem('${cat._id}', '${item._id}')" title="Delete" style="color:var(--error);">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>`
      : `<p style="color:var(--text-muted); margin-top:12px; font-size:0.9rem;">No related items yet. Add items to populate this interest on the portfolio.</p>`;

    return `
      <div class="card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; padding:24px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            ${imgPreview}
            <div>
              <h3 style="color:var(--text-primary); margin:0; font-size:1.1rem;">${cat.num || '01'} — ${cat.title || 'UNTITLED'}</h3>
              <p style="color:var(--text-secondary); font-size:0.82rem; margin-top:3px;">${cat.description ? cat.description.substring(0, 80) + (cat.description.length > 80 ? '…' : '') : 'No description'}</p>
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button class="btn btn-primary btn-sm" onclick="openInterestItemModal('${cat._id}')">+ Add Item</button>
            <button class="btn btn-secondary btn-sm" onclick="openSpotifyModal('${cat._id}')" title="Add Spotify Playlist">🎵 + Spotify</button>
            <button class="btn btn-secondary btn-sm" onclick="editInterestCategory('${cat._id}')" title="Edit Category">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="deleteInterestCategory('${cat._id}')" title="Delete Category" style="color:var(--error);">🗑️</button>
          </div>
        </div>

        <!-- Related Items Block -->
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">${items.length} related item${items.length !== 1 ? 's' : ''}</div>
        <div class="data-table-wrapper" style="margin:0 0 20px 0; padding:0;">
          ${itemsHtml}
        </div>

        <!-- Spotify Playlists Block -->
        <div style="border-top:1px solid var(--border-color); padding-top:16px; margin-top:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.1rem;">🎵</span>
              <strong style="font-size:0.92rem; color:var(--text-primary);">Spotify Playlists (${(cat.spotifyPlaylists || []).length})</strong>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openSpotifyModal('${cat._id}')">+ Add Spotify Playlist</button>
          </div>

          ${(cat.spotifyPlaylists && cat.spotifyPlaylists.length > 0)
            ? `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
                ${cat.spotifyPlaylists.map((pl) => {
                  const embedUrl = getSpotifyEmbedUrl(pl.url);
                  return `
                    <div style="background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:10px; padding:12px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:0.88rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(pl.title || 'Untitled')}">
                          ${escapeHtml(pl.title || 'Curated Playlist')}
                        </strong>
                        <div style="display:flex; gap:4px; flex-shrink:0;">
                          <button class="btn btn-secondary btn-sm" style="padding:2px 6px;" onclick="openSpotifyModal('${cat._id}', '${pl._id}')" title="Edit">✏️</button>
                          <button class="btn btn-secondary btn-sm" style="padding:2px 6px; color:var(--error);" onclick="deleteSpotifyPlaylist('${cat._id}', '${pl._id}')" title="Delete">🗑️</button>
                        </div>
                      </div>
                      <iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:8px; border:none; display:block;"></iframe>
                      <div style="margin-top:6px; text-align:right;">
                        <a href="${pl.url}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem; color:#1DB954; font-family:var(--font-mono); text-decoration:none;">Open in Spotify ↗</a>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>`
            : `<p style="color:var(--text-muted); font-size:0.82rem; margin:0;">No Spotify playlist linked yet. Click "+ Add Spotify Playlist" to display a playable music widget.</p>`
          }
        </div>
      </div>
    `;
  }).join('');
}

/* ── Interest Category CRUD ──────────────────────── */

/** Open modal for creating a new interest category */
function openInterestCategoryModal() {
  document.getElementById('interestCategoryModalTitle').textContent = 'Add Interest Category';
  document.getElementById('interestCategoryId').value = '';
  document.getElementById('interestCategoryTitle').value = '';
  document.getElementById('interestCategoryNum').value = '';
  document.getElementById('interestCategoryImage').value = '';
  document.getElementById('interestCategoryDescription').value = '';
  document.getElementById('interestCategoryOrder').value = interestCategories.length;
  const upload = document.getElementById('interestCategoryUpload');
  if (upload) upload.value = '';
  const previewDiv = document.getElementById('interestCategoryImagePreview');
  if (previewDiv) previewDiv.style.display = 'none';
  openModal('interestCategoryModal');
}

/** Open modal for editing an existing interest category */
function editInterestCategory(catId) {
  const cat = interestCategories.find((c) => c._id === catId);
  if (!cat) return;

  document.getElementById('interestCategoryModalTitle').textContent = 'Edit Interest Category';
  document.getElementById('interestCategoryId').value = cat._id;
  document.getElementById('interestCategoryTitle').value = cat.title || '';
  document.getElementById('interestCategoryNum').value = cat.num || '';
  document.getElementById('interestCategoryImage').value = cat.image || '';
  document.getElementById('interestCategoryDescription').value = cat.description || '';
  document.getElementById('interestCategoryOrder').value = cat.order || 0;
  const upload = document.getElementById('interestCategoryUpload');
  if (upload) upload.value = '';

  // Show preview if image exists
  const previewDiv = document.getElementById('interestCategoryImagePreview');
  const previewImg = document.getElementById('interestCategoryPreviewImg');
  if (cat.image && previewDiv && previewImg) {
    previewImg.src = resolveImageUrl(cat.image);
    previewDiv.style.display = 'block';
  } else if (previewDiv) {
    previewDiv.style.display = 'none';
  }

  openModal('interestCategoryModal');
}

/** Save interest category (create or update) */
async function saveInterestCategory() {
  const id = document.getElementById('interestCategoryId').value;
  const data = {
    title: (document.getElementById('interestCategoryTitle').value.trim() || 'NEW INTEREST').toUpperCase(),
    num: document.getElementById('interestCategoryNum').value.trim() || `0${interestCategories.length + 1}`,
    image: document.getElementById('interestCategoryImage').value.trim(),
    description: document.getElementById('interestCategoryDescription').value.trim(),
    order: parseInt(document.getElementById('interestCategoryOrder').value) || 0,
  };

  let result;
  if (id) {
    result = await authFetch(`/interests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } else {
    result = await authFetch('/interests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  if (result && result.success) {
    showToast(result.message || 'Interest saved successfully!');
    closeModal('interestCategoryModal');
    await loadInterestsAdmin();
  } else {
    showToast(result?.message || 'Failed to save interest', 'error');
  }
}

/** Delete an interest category */
function deleteInterestCategory(catId) {
  const cat = interestCategories.find((c) => c._id === catId);
  const title = cat ? cat.title : 'this interest';
  confirmDelete(`Delete interest "${title}" and all its related items?`, async () => {
    const result = await authFetch(`/interests/${catId}`, { method: 'DELETE' });
    if (result && result.success) {
      showToast('Interest category deleted');
      await loadInterestsAdmin();
    } else {
      showToast('Failed to delete interest', 'error');
    }
  });
}

/** Clear interest category photo */
function clearInterestCategoryPhoto() {
  const input = document.getElementById('interestCategoryImage');
  const upload = document.getElementById('interestCategoryUpload');
  if (input) input.value = '';
  if (upload) upload.value = '';
  updateInterestCategoryPhotoPreview();
  showToast('Photo removed. Click "Save Interest" to persist.');
}

/** Update interest category preview */
function updateInterestCategoryPhotoPreview() {
  const input = document.getElementById('interestCategoryImage');
  const previewDiv = document.getElementById('interestCategoryImagePreview');
  const previewImg = document.getElementById('interestCategoryPreviewImg');
  if (!input || !previewDiv || !previewImg) return;

  const val = input.value.trim();
  if (val) {
    previewImg.src = resolveImageUrl(val);
    previewDiv.style.display = 'block';
  } else {
    previewImg.src = '';
    previewDiv.style.display = 'none';
  }
}

/** Handle image upload for interest category */
async function handleInterestCategoryImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const input = document.getElementById('interestCategoryImage');
  const previewDiv = document.getElementById('interestCategoryImagePreview');
  const previewImg = document.getElementById('interestCategoryPreviewImg');

  if (previewImg && previewDiv) {
    previewImg.src = URL.createObjectURL(file);
    previewDiv.style.display = 'block';
  }

  showToast('⏳ Uploading category image...', 'info');
  const uploadedUrl = await uploadFileToBackend(file);
  if (uploadedUrl) {
    if (input) input.value = uploadedUrl;
    updateInterestCategoryPhotoPreview();
    showToast('✅ Category image uploaded! Click "Save Interest" to persist.');
  } else {
    updateInterestCategoryPhotoPreview();
  }
}

/* ── Interest Item CRUD ──────────────────────────── */

/** Open modal for creating a new item inside a category */
function openInterestItemModal(categoryId) {
  document.getElementById('interestItemModalTitle').textContent = 'Add Item';
  document.getElementById('interestItemCategoryId').value = categoryId;
  document.getElementById('interestItemId').value = '';
  document.getElementById('interestItemTitle').value = '';
  document.getElementById('interestItemSubtitle').value = '';
  document.getElementById('interestItemTag').value = '';
  document.getElementById('interestItemDescription').value = '';
  document.getElementById('interestItemImage').value = '';
  document.getElementById('interestItemLink').value = '';
  document.getElementById('interestItemOrder').value = 0;
  const upload = document.getElementById('interestItemUpload');
  if (upload) upload.value = '';
  updateInterestItemPhotoPreview();
  openModal('interestItemModal');
}

/** Open modal for editing an existing item */
function editInterestItem(categoryId, itemId) {
  const cat = interestCategories.find((c) => c._id === categoryId);
  if (!cat) return;
  const item = (cat.items || []).find((i) => i._id === itemId);
  if (!item) return;

  document.getElementById('interestItemModalTitle').textContent = 'Edit Item';
  document.getElementById('interestItemCategoryId').value = categoryId;
  document.getElementById('interestItemId').value = itemId;
  document.getElementById('interestItemTitle').value = item.title || '';
  document.getElementById('interestItemSubtitle').value = item.subtitle || '';
  document.getElementById('interestItemTag').value = item.tag || '';
  document.getElementById('interestItemDescription').value = item.description || '';
  document.getElementById('interestItemImage').value = item.image || '';
  document.getElementById('interestItemLink').value = item.link || '';
  document.getElementById('interestItemOrder').value = item.order || 0;
  const upload = document.getElementById('interestItemUpload');
  if (upload) upload.value = '';
  updateInterestItemPhotoPreview();
  openModal('interestItemModal');
}

/** Save interest item (create or update) */
async function saveInterestItem() {
  const categoryId = document.getElementById('interestItemCategoryId').value;
  const itemId = document.getElementById('interestItemId').value;

  const data = {
    title: document.getElementById('interestItemTitle').value.trim(),
    subtitle: document.getElementById('interestItemSubtitle').value.trim(),
    tag: document.getElementById('interestItemTag').value.trim(),
    description: document.getElementById('interestItemDescription').value.trim(),
    image: document.getElementById('interestItemImage').value.trim(),
    link: document.getElementById('interestItemLink').value.trim(),
    order: parseInt(document.getElementById('interestItemOrder').value) || 0,
  };

  let result;
  if (itemId) {
    // Update existing
    result = await authFetch(`/interests/${categoryId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } else {
    // Create new
    result = await authFetch(`/interests/${categoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  if (result && result.success) {
    showToast(result.message || 'Item saved successfully!');
    closeModal('interestItemModal');
    await loadInterestsAdmin();
  } else {
    showToast(result?.message || 'Failed to save item', 'error');
  }
}

/** Delete an interest item */
function deleteInterestItem(categoryId, itemId) {
  const cat = interestCategories.find((c) => c._id === categoryId);
  const item = cat ? (cat.items || []).find((i) => i._id === itemId) : null;
  const title = item ? item.title : 'this item';
  confirmDelete(`Delete item "${title}"?`, async () => {
    const result = await authFetch(`/interests/${categoryId}/items/${itemId}`, { method: 'DELETE' });
    if (result && result.success) {
      showToast('Item deleted');
      await loadInterestsAdmin();
    } else {
      showToast('Failed to delete item', 'error');
    }
  });
}

/** Clear interest item photo */
function clearInterestItemPhoto() {
  const input = document.getElementById('interestItemImage');
  const upload = document.getElementById('interestItemUpload');
  if (input) input.value = '';
  if (upload) upload.value = '';
  updateInterestItemPhotoPreview();
  showToast('Photo removed. Click "Save Item" to persist.');
}

/** Update interest item preview */
function updateInterestItemPhotoPreview() {
  const input = document.getElementById('interestItemImage');
  const previewDiv = document.getElementById('interestItemImagePreview');
  const previewImg = document.getElementById('interestItemPreviewImg');
  if (!input || !previewDiv || !previewImg) return;

  const val = input.value.trim();
  if (val) {
    previewImg.src = resolveImageUrl(val);
    previewDiv.style.display = 'block';
  } else {
    previewImg.src = '';
    previewDiv.style.display = 'none';
  }
}

/** Handle image upload for interest item */
async function handleInterestItemImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const input = document.getElementById('interestItemImage');
  const previewDiv = document.getElementById('interestItemImagePreview');
  const previewImg = document.getElementById('interestItemPreviewImg');

  if (previewImg && previewDiv) {
    previewImg.src = URL.createObjectURL(file);
    previewDiv.style.display = 'block';
  }

  showToast('⏳ Uploading item image...', 'info');
  const uploadedUrl = await uploadFileToBackend(file);
  if (uploadedUrl) {
    if (input) input.value = uploadedUrl;
    updateInterestItemPhotoPreview();
    showToast('✅ Item image uploaded! Click "Save Item" to persist.');
  } else {
    updateInterestItemPhotoPreview();
  }
}

/* ══════════════════════════════════════════════════
   SPOTIFY PLAYLIST MANAGEMENT CRUD
   ══════════════════════════════════════════════════ */

/** Convert standard Spotify URL to official Embed URL */
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

/** Load Spotify Management section in Admin */
async function loadSpotifyAdmin() {
  const container = document.getElementById('spotifyPlaylistsList');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Loading Spotify playlists...</div>';

  try {
    const res = await authFetch('/interests');
    if (res && res.success && Array.isArray(res.data)) {
      interestCategories = res.data;
    }
  } catch (err) {
    console.error('Error fetching interests for Spotify admin:', err);
  }

  // Gather playlists with their parent category
  const allPlaylists = [];
  interestCategories.forEach((cat) => {
    if (Array.isArray(cat.spotifyPlaylists)) {
      cat.spotifyPlaylists.forEach((pl) => {
        allPlaylists.push({
          ...pl,
          categoryId: cat._id,
          categoryTitle: cat.title,
        });
      });
    }
  });

  if (allPlaylists.length === 0) {
    container.innerHTML = `
      <div class="data-table-wrapper" style="padding:48px 24px; text-align:center;">
        <span style="font-size:3rem; display:block; margin-bottom:12px;">🎵</span>
        <h3 style="color:var(--text-primary); margin-bottom:8px;">No Spotify Playlists Configured</h3>
        <p style="color:var(--text-secondary); max-width:480px; margin:0 auto 20px;">
          Add Spotify playlist links to display interactive audio players directly in your Portfolio under the Music interest section.
        </p>
        <button class="btn btn-primary" onclick="openSpotifyModal()">+ Add Your First Spotify Playlist</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); gap:24px;">
      ${allPlaylists.map((pl) => {
        const embedUrl = getSpotifyEmbedUrl(pl.url);
        return `
          <div class="card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:14px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span style="display:inline-block; font-family:var(--font-mono); font-size:0.72rem; background:#000; color:#1DB954; font-weight:700; padding:3px 10px; border-radius:12px; margin-bottom:6px;">
                  CATEGORY: ${escapeHtml(pl.categoryTitle || 'MUSIC')}
                </span>
                <h3 style="margin:0; font-size:1.15rem; color:var(--text-primary);">${escapeHtml(pl.title || 'Untitled Playlist')}</h3>
                <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary);">Order: ${pl.order || 0}</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary btn-sm" onclick="openSpotifyModal('${pl.categoryId}', '${pl._id}')" title="Edit Playlist">✏️ Edit</button>
                <button class="btn btn-secondary btn-sm" onclick="deleteSpotifyPlaylist('${pl.categoryId}', '${pl._id}')" title="Delete Playlist" style="color:var(--error);">🗑️</button>
              </div>
            </div>

            <!-- Live Embed Iframe -->
            <div style="border-radius:12px; overflow:hidden; background:#121212; border:1px solid var(--border-color);">
              <iframe src="${embedUrl}" width="100%" height="220" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="display:block; border:none;"></iframe>
            </div>

            <!-- Footer Details -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid var(--border-color);">
              <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${escapeHtml(pl.url)}
              </span>
              <a href="${pl.url}" target="_blank" rel="noopener noreferrer" style="font-family:var(--font-mono); font-size:0.8rem; font-weight:700; color:#1DB954; text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                Open in App ↗
              </a>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/** Open Spotify Playlist Modal */
function openSpotifyModal(categoryId, playlistId) {
  // Populate category dropdown
  const select = document.getElementById('spotifyCategorySelect');
  if (select) {
    select.innerHTML = interestCategories.map((c) => `
      <option value="${c._id}" ${c.title.toUpperCase() === 'MUSIC' ? 'selected' : ''}>
        ${c.num || ''} — ${escapeHtml(c.title)}
      </option>
    `).join('');
  }

  const titleEl = document.getElementById('spotifyModalTitle');
  const catInput = document.getElementById('spotifyCategoryId');
  const plInput = document.getElementById('spotifyPlaylistId');
  const titleInput = document.getElementById('spotifyPlaylistTitle');
  const urlInput = document.getElementById('spotifyPlaylistUrl');
  const orderInput = document.getElementById('spotifyPlaylistOrder');

  if (playlistId) {
    // Edit mode
    titleEl.textContent = 'Edit Spotify Playlist';
    const cat = interestCategories.find((c) => String(c._id) === String(categoryId));
    const pl = cat ? (cat.spotifyPlaylists || []).find((p) => String(p._id) === String(playlistId)) : null;

    catInput.value = categoryId || '';
    plInput.value = playlistId || '';
    if (select && categoryId) select.value = categoryId;
    titleInput.value = pl ? pl.title : '';
    urlInput.value = pl ? pl.url : '';
    orderInput.value = pl ? (pl.order || 0) : 0;
  } else {
    // Add mode
    titleEl.textContent = 'Add Spotify Playlist';
    catInput.value = categoryId || '';
    plInput.value = '';
    if (categoryId && select) select.value = categoryId;
    titleInput.value = '';
    urlInput.value = '';
    orderInput.value = 0;
  }

  previewSpotifyEmbedInModal();
  openModal('spotifyModal');
}

/** Live preview in modal */
function previewSpotifyEmbedInModal() {
  const urlInput = document.getElementById('spotifyPlaylistUrl');
  const previewDiv = document.getElementById('spotifyModalPreviewContainer');
  const previewIframe = document.getElementById('spotifyModalPreviewIframe');

  if (!urlInput || !previewDiv || !previewIframe) return;

  const url = urlInput.value.trim();
  if (url && (url.includes('spotify.com') || url.includes('spotify:'))) {
    previewIframe.src = getSpotifyEmbedUrl(url);
    previewDiv.style.display = 'block';
  } else {
    previewDiv.style.display = 'none';
    previewIframe.src = '';
  }
}

/** Save Spotify Playlist (Add or Edit) */
async function saveSpotifyPlaylist() {
  const categoryId = document.getElementById('spotifyCategorySelect').value;
  const playlistId = document.getElementById('spotifyPlaylistId').value;
  const title = document.getElementById('spotifyPlaylistTitle').value.trim();
  const url = document.getElementById('spotifyPlaylistUrl').value.trim();
  const order = parseInt(document.getElementById('spotifyPlaylistOrder').value) || 0;

  if (!categoryId) {
    showToast('Please select an interest category', 'error');
    return;
  }
  if (!url) {
    showToast('Please enter a Spotify playlist link', 'error');
    return;
  }

  const payload = {
    title: title || 'Curated Spotify Playlist',
    url,
    order,
  };

  let result;
  if (playlistId) {
    // Update
    result = await authFetch(`/interests/${categoryId}/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    // Create
    result = await authFetch(`/interests/${categoryId}/playlists`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  if (result && result.success) {
    showToast(result.message || 'Spotify playlist saved successfully!');
    closeModal('spotifyModal');
    await loadInterestsAdmin();
    await loadSpotifyAdmin();
  } else {
    showToast(result?.message || 'Failed to save Spotify playlist', 'error');
  }
}

/** Delete Spotify Playlist */
function deleteSpotifyPlaylist(categoryId, playlistId) {
  confirmDelete('Are you sure you want to remove this Spotify playlist?', async () => {
    const result = await authFetch(`/interests/${categoryId}/playlists/${playlistId}`, {
      method: 'DELETE',
    });
    if (result && result.success) {
      showToast('Spotify playlist removed');
      await loadInterestsAdmin();
      await loadSpotifyAdmin();
    } else {
      showToast(result?.message || 'Failed to delete Spotify playlist', 'error');
    }
  });
}
