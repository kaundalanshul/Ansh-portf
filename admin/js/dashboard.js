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
  await Promise.all([loadProjects(), loadSkills(), loadMessages(), loadSiteProfileSettings()]);
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
    messages: 'Contact Messages',
    'site-profile': 'Site Content & Profile',
  };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[section] || 'Dashboard';

  if (section === 'site-profile') {
    loadSiteProfileSettings();
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

/** Load and render projects */
async function loadProjects() {
  const result = await authFetch('/projects');
  if (result && result.data) {
    projects = result.data;
    renderProjectsTable();
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
    title: document.getElementById('projectTitle').value.trim(),
    description: document.getElementById('projectDescription').value.trim(),
    technologies: techInput ? techInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    imageUrl: document.getElementById('projectImageUrl').value.trim(),
    liveUrl: document.getElementById('projectLiveUrl').value.trim(),
    githubUrl: document.getElementById('projectGithubUrl').value.trim(),
    featured: document.getElementById('projectFeatured').checked,
    order: parseInt(document.getElementById('projectOrder').value) || 0,
  };

  // Only title is strictly required; allow saving partial/incomplete projects
  if (!data.title) {
    showToast('Project title is required', 'error');
    return;
  }

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
    showToast(result.message || 'Project saved!');
    closeModal('projectModal');
    await loadProjects();
    updateStats();
  } else {
    const errorDetail = result?.errors?.map((e) => e.message).join(', ');
    const msg = errorDetail || result?.message || 'Failed to save project';
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
