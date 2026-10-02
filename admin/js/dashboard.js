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
    interests: 'Manage Interests',
    spotify: 'Music / Spotify Management',
    messages: 'Contact Messages',
    'site-profile': 'Site Content & Profile',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';

  if (section === 'site-profile') {
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
}

/** Handle photo file upload via FileReader */
function handlePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById('projectImageUrl');
    if (urlInput) {
      urlInput.value = dataUrl;
      updatePhotoPreview();
    }
  };
  reader.readAsDataURL(file);
}

/** Update photo preview thumbnail */
function updatePhotoPreview() {
  const urlInput = document.getElementById('projectImageUrl');
  const previewContainer = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');

  if (!urlInput || !previewContainer || !previewImg) return;

  const url = urlInput.value.trim();
  if (url) {
    previewImg.src = url;
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

/** Load site profile settings from API */
async function loadSiteProfileSettings() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const data = await res.json();
    if (data.success && data.data) {
      currentSiteProfile = data.data;
      document.getElementById('siteHeroTitle').value = currentSiteProfile.heroTitle || '';
      document.getElementById('siteHeroSubtitle').value = currentSiteProfile.heroSubtitle || '';
      document.getElementById('siteName').value = currentSiteProfile.name || '';
      document.getElementById('siteProfileImage').value = currentSiteProfile.profileImage || '';
      document.getElementById('siteAboutBio').value = currentSiteProfile.aboutBio || '';
      document.getElementById('siteAboutSpecialization').value = currentSiteProfile.aboutSpecialization || '';
      document.getElementById('siteAboutHighlight').value = currentSiteProfile.aboutHighlight || '';
      document.getElementById('siteContactEmail').value = currentSiteProfile.contactEmail || '';
      document.getElementById('siteMarqueeText').value = currentSiteProfile.marqueeText || '';

      renderHobbies(currentSiteProfile.hobbies || []);
    }
  } catch (err) {
    showToast('Failed to load site profile settings', 'error');
  }
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

  // Clear empty message if present
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

/** Remove a hobby row */
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
  const marqueeText = document.getElementById('siteMarqueeText').value.trim();

  // Collect hobbies
  const hobbiesContainer = document.getElementById('hobbiesContainer');
  const hobbyRows = hobbiesContainer.querySelectorAll('.hobby-input-row');
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
    marqueeText,
    hobbies,
  };

  const result = await authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (result && result.success) {
    showToast('Site content & profile updated successfully!', 'success');
    currentSiteProfile = result.data;
  } else {
    showToast(result?.message || 'Failed to update site content', 'error');
  }
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
    previewImg.src = cat.image;
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

/** Handle image upload for interest category — converts to base64 data URL */
function handleInterestCategoryImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('interestCategoryImage').value = dataUrl;
    const previewDiv = document.getElementById('interestCategoryImagePreview');
    const previewImg = document.getElementById('interestCategoryPreviewImg');
    if (previewDiv && previewImg) {
      previewImg.src = dataUrl;
      previewDiv.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
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

/** Handle image upload for interest item */
function handleInterestItemImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('interestItemImage').value = e.target.result;
  };
  reader.readAsDataURL(file);
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
