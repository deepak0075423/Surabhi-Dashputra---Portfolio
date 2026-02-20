(function () {
    'use strict';

    const DEFAULT_API_BASE = window.location.origin;
    const API_BASE_STORAGE_KEY = 'sd_admin_api_base';
    const urlParams = new URLSearchParams(window.location.search);
    const paramApiBase = (urlParams.get('api') || '').trim();
    const storedApiBase = (localStorage.getItem(API_BASE_STORAGE_KEY) || '').trim();
    let apiBase = DEFAULT_API_BASE;

    let token = localStorage.getItem('sd_admin_token');
    let currentSection = null;
    let originalData = null;
    let liveData = null;

    // ── DOM refs ──
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const loginScreen = $('#loginScreen');
    const resetScreen = $('#resetScreen');
    const dashboard = $('#dashboard');
    const loginForm = $('#loginForm');
    const loginError = $('#loginError');
    const apiBaseInput = $('#apiBase');
    const apiTestBtn = $('#apiTestBtn');
    const resetForm = $('#resetForm');
    const resetMsg = $('#resetMsg');
    const forgotToggle = $('#forgotToggle');
    const newPassForm = $('#newPassForm');
    const resetPassError = $('#resetPassError');
    const logoutBtn = $('#logoutBtn');
    const sectionTitle = $('#sectionTitle');
    const formArea = $('#formArea');
    const saveBtn = $('#saveBtn');
    const discardBtn = $('#discardBtn');
    const sidebar = $('#sidebar');
    const changePassBtn = $('#changePassBtn');
    const changePassModal = $('#changePassModal');
    const changePassForm = $('#changePassForm');
    const cpCancel = $('#cpCancel');
    const cpError = $('#cpError');
    const toast = $('#toast');

    // ── Section Schemas ──
    const schemas = {
        meta: {
            label: 'Meta / SEO',
            fields: [
                { key: 'pageTitle', label: 'Page Title', type: 'text' },
                { key: 'metaDescription', label: 'Meta Description', type: 'textarea' },
                { key: 'themeColor', label: 'Theme Color', type: 'text' }
            ]
        },
        navigation: {
            label: 'Navigation',
            fields: [
                { key: 'links', label: 'Nav Links', type: 'array', fields: [
                    { key: 'href', label: 'Href', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]}
            ]
        },
        hero: {
            label: 'Hero / Banner',
            fields: [
                { key: 'badge', label: 'Badge Text', type: 'text' },
                { key: 'firstName', label: 'First Name', type: 'text' },
                { key: 'lastName', label: 'Last Name', type: 'text' },
                { key: 'subheading', label: 'Subheading', type: 'text' },
                { key: 'spotifyListeners', label: 'Spotify Listener Count', type: 'text' },
                { key: 'heroImage', label: 'Hero Image', type: 'image', uploadType: 'image' },
                { key: 'ctaButtons', label: 'CTA Buttons', type: 'array', fields: [
                    { key: 'label', label: 'Button Text', type: 'text' },
                    { key: 'url', label: 'URL', type: 'text' },
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'class', label: 'CSS Class', type: 'text' }
                ]},
                { key: 'socialLinks', label: 'Social Links', type: 'array', fields: [
                    { key: 'url', label: 'URL', type: 'text' },
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]}
            ]
        },
        about: {
            label: 'About',
            fields: [
                { key: 'tag', label: 'Section Tag', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text', hint: 'Use <span class="highlight">text</span> for highlights' },
                { key: 'leadParagraph', label: 'Lead Paragraph (HTML)', type: 'textarea' },
                { key: 'bodyParagraphs', label: 'Body Paragraphs', type: 'array', fields: [
                    { key: '_value', label: 'Paragraph (HTML)', type: 'textarea' }
                ]},
                { key: 'tags', label: 'Tags', type: 'array', fields: [
                    { key: '_value', label: 'Tag Text', type: 'text' }
                ]},
                { key: 'floatBadge', label: 'Float Badge Text', type: 'text' },
                { key: 'aboutImage', label: 'About Image', type: 'image', uploadType: 'image' }
            ]
        },
        stats: {
            label: 'Stats Band',
            fields: [
                { key: 'items', label: 'Statistics', type: 'array', fields: [
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'target', label: 'Target Number', type: 'text' },
                    { key: 'suffix', label: 'Suffix', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]}
            ]
        },
        music: {
            label: 'Music / Spotify',
            fields: [
                { key: 'tag', label: 'Section Tag', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'defaultTrackUri', label: 'Default Spotify Track ID', type: 'text' },
                { key: 'spotifyArtistUrl', label: 'Spotify Artist URL', type: 'text' },
                { key: 'tabs', label: 'Filter Tabs', type: 'array', fields: [
                    { key: 'filter', label: 'Filter Key', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'playlist', label: 'Playlist Tracks', type: 'array', fields: [
                    { key: 'title', label: 'Song Title', type: 'text' },
                    { key: 'spotifyId', label: 'Spotify ID', type: 'text' },
                    { key: 'category', label: 'Category', type: 'text' }
                ]}
            ]
        },
        films: {
            label: 'Films & TV',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'tabs', label: 'Category Tabs', type: 'array', fields: [
                    { key: 'key', label: 'Key', type: 'text' },
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'cards', label: 'Film Cards', type: 'array', fields: [
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'year', label: 'Year / Badge', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'genre', label: 'Genre', type: 'text' },
                    { key: 'image', label: 'Image', type: 'image', uploadType: 'image' },
                    { key: 'gradient', label: 'Gradient CSS', type: 'text' },
                    { key: 'type', label: 'Type (films/tv)', type: 'text' }
                ]}
            ]
        },
        news: {
            label: 'News',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'perPage', label: 'Items Per Page', type: 'text' },
                { key: 'items', label: 'News Items', type: 'array', fields: [
                    { key: 'month', label: 'Month', type: 'text' },
                    { key: 'year', label: 'Year', type: 'text' },
                    { key: 'labelText', label: 'Label', type: 'text' },
                    { key: 'labelClass', label: 'Label Class', type: 'text' },
                    { key: 'labelIcon', label: 'Label Icon', type: 'text' },
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'desc', label: 'Description', type: 'textarea' },
                    { key: 'url', label: 'URL', type: 'text' },
                    { key: 'metas', label: 'Meta Tags', type: 'array', fields: [
                        { key: 'icon', label: 'Icon', type: 'text' },
                        { key: 'text', label: 'Text', type: 'text' }
                    ]}
                ]}
            ]
        },
        youtube: {
            label: 'YouTube',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'videos', label: 'Videos', type: 'array', fields: [
                    { key: 'title', label: 'Video Title', type: 'text' },
                    { key: 'embedId', label: 'YouTube Embed ID', type: 'text' }
                ]},
                { key: 'channelName', label: 'Channel Name', type: 'text' },
                { key: 'channelTagline', label: 'Channel Tagline', type: 'text' },
                { key: 'stats', label: 'Channel Stats', type: 'array', fields: [
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'value', label: 'Value', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'subscribeUrl', label: 'Subscribe URL', type: 'text' }
            ]
        },
        jingles: {
            label: 'Jingles',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'cards', label: 'Jingle Cards', type: 'array', fields: [
                    { key: 'brand', label: 'Brand Name', type: 'text' },
                    { key: 'brandIcon', label: 'Brand Icon Class', type: 'text' },
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'youtubeId', label: 'YouTube ID', type: 'text' },
                    { key: 'tags', label: 'Tags', type: 'array', fields: [
                        { key: 'icon', label: 'Icon', type: 'text' },
                        { key: 'label', label: 'Label', type: 'text' }
                    ]}
                ]}
            ]
        },
        reels: {
            label: 'Instagram Reels',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'reels', label: 'Reels', type: 'array', fields: [
                    { key: 'title', label: 'Title', type: 'text' },
                    { key: 'video', label: 'Video', type: 'video', uploadType: 'video' },
                    { key: 'likes', label: 'Likes', type: 'text' },
                    { key: 'comments', label: 'Comments', type: 'text' },
                    { key: 'shares', label: 'Shares', type: 'text' },
                    { key: 'reelUrl', label: 'Instagram URL', type: 'text' }
                ]},
                { key: 'channelName', label: 'Channel Name', type: 'text' },
                { key: 'channelTagline', label: 'Channel Tagline', type: 'text' },
                { key: 'stats', label: 'Stats', type: 'array', fields: [
                    { key: 'icon', label: 'Icon', type: 'text' },
                    { key: 'value', label: 'Value', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'followUrl', label: 'Follow URL', type: 'text' }
            ]
        },
        gallery: {
            label: 'Gallery',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'filterTabs', label: 'Filter Tabs', type: 'array', fields: [
                    { key: 'filter', label: 'Filter Key', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'perPage', label: 'Images Per Page', type: 'text' },
                { key: 'images', label: 'Gallery Images', type: 'array', fields: [
                    { key: 'src', label: 'Image', type: 'image', uploadType: 'gallery' },
                    { key: 'category', label: 'Category (all/live/recordings)', type: 'text' }
                ]}
            ]
        },
        academy: {
            label: 'Academy',
            fields: [
                { key: 'tag', label: 'Section Tag (HTML)', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'academyName', label: 'Academy Name', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'features', label: 'Features', type: 'array', fields: [
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
                { key: 'academyUrl', label: 'Academy URL', type: 'text' },
                { key: 'logoImage', label: 'Logo Image', type: 'image', uploadType: 'logo' }
            ]
        },
        contact: {
            label: 'Contact',
            fields: [
                { key: 'tag', label: 'Section Tag', type: 'text' },
                { key: 'title', label: 'Title (HTML)', type: 'text' },
                { key: 'subtitle', label: 'Subtitle', type: 'text' },
                { key: 'socialCards', label: 'Social Cards', type: 'array', fields: [
                    { key: 'platform', label: 'Platform', type: 'text' },
                    { key: 'handle', label: 'Handle', type: 'text' },
                    { key: 'url', label: 'URL', type: 'text' },
                    { key: 'icon', label: 'Icon Class', type: 'text' },
                    { key: 'class', label: 'CSS Class', type: 'text' }
                ]},
                { key: 'formHeading', label: 'Form Heading', type: 'text' },
                { key: 'formSubtitle', label: 'Form Subtitle', type: 'text' },
                { key: 'subjectOptions', label: 'Subject Options', type: 'array', fields: [
                    { key: 'value', label: 'Value', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'successMessage', label: 'Success Message', type: 'text' }
            ]
        },
        footer: {
            label: 'Footer',
            fields: [
                { key: 'description', label: 'Description', type: 'text' },
                { key: 'links', label: 'Footer Links', type: 'array', fields: [
                    { key: 'href', label: 'Href', type: 'text' },
                    { key: 'label', label: 'Label', type: 'text' }
                ]},
                { key: 'copyright', label: 'Copyright Text', type: 'text' }
            ]
        },
        logo: {
            label: 'Logo',
            fields: [
                { key: 'siteLogo', label: 'Site Logo (Header & Footer)', type: 'image', uploadType: 'logo' }
            ]
        }
    };

    // ── Helpers ──
    function showToast(msg, type) {
        toast.textContent = msg;
        toast.className = 'toast ' + type;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    function normalizeApiBase(raw) {
        let input = String(raw || '').trim();
        if (!input) return '';

        // If user pasted a full admin URL, keep only the origin.
        // Also support "localhost:3000" (missing scheme).
        if (!/^https?:\/\//i.test(input)) input = 'http://' + input;

        try {
            const u = new URL(input, window.location.href);
            return u.origin;
        } catch (_) {
            return '';
        }
    }

    function setApiBase(nextBase) {
        const normalized = normalizeApiBase(nextBase);
        if (!normalized) {
            apiBase = DEFAULT_API_BASE;
            localStorage.removeItem(API_BASE_STORAGE_KEY);
        } else {
            apiBase = normalized;
            localStorage.setItem(API_BASE_STORAGE_KEY, apiBase);
        }
        if (apiBaseInput) apiBaseInput.value = apiBase;
    }

    function apiUrl(path) {
        return apiBase + path;
    }

    async function parseJsonResponse(res) {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (_) {
            // Typical cause: admin is opened from a static server (SPA fallback returns HTML)
            if (ct.includes('text/html') || text.trim().startsWith('<')) {
                const url = res && res.url ? res.url : '(unknown url)';
                throw new Error('API returned HTML (not JSON) from ' + url + '. Backend URL is "' + apiBase + '". This usually means another server (Live Server/React dev server) is running on that port. Open admin from backend (http://localhost:3000/admin) or set "Backend URL" to the backend origin.');
            }
            throw new Error('Invalid JSON from API.');
        }
    }

    async function apiFetch(path, opts) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        headers['Accept'] = 'application/json';
        const res = await fetch(apiUrl(path), { ...opts, headers });
        if (res.status === 401) {
            token = null;
            localStorage.removeItem('sd_admin_token');
            showLogin();
            throw new Error('Session expired');
        }
        return res;
    }

    async function apiJson(path, opts) {
        const res = await apiFetch(path, opts);
        return parseJsonResponse(res);
    }

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Upload a file and return the path
    async function uploadFile(file, uploadType) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(apiUrl('/api/upload/' + uploadType), {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if (res.status === 401) {
            token = null;
            localStorage.removeItem('sd_admin_token');
            showLogin();
            throw new Error('Session expired');
        }
        const data = await parseJsonResponse(res);
        if (!data.success) throw new Error(data.error || 'Upload failed');
        return data.path;
    }

    // Create an upload field (image or video) with preview
    function createUploadField(field, currentValue, onValueChange) {
        const group = document.createElement('div');
        group.className = 'form-group upload-group';

        const label = document.createElement('label');
        label.textContent = field.label;
        group.appendChild(label);

        const wrap = document.createElement('div');
        wrap.className = 'upload-wrap';

        // Preview
        const preview = document.createElement('div');
        preview.className = 'upload-preview';
        if (currentValue) {
            if (field.type === 'video') {
                preview.innerHTML = '<video src="/' + currentValue + '" muted></video>';
            } else {
                preview.innerHTML = '<img src="/' + currentValue + '" alt="preview">';
            }
        } else {
            preview.innerHTML = '<div class="upload-empty"><i class="fas fa-' + (field.type === 'video' ? 'video' : 'image') + '"></i></div>';
        }
        wrap.appendChild(preview);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'upload-controls';

        // Path display
        const pathInput = document.createElement('input');
        pathInput.type = 'text';
        pathInput.value = currentValue || '';
        pathInput.placeholder = 'File path...';
        pathInput.className = 'upload-path';
        pathInput.dataset.key = field.key;
        pathInput.oninput = () => {
            onValueChange(pathInput.value);
            updatePreview(pathInput.value);
        };
        controls.appendChild(pathInput);

        // Upload button
        const uploadBtn = document.createElement('label');
        uploadBtn.className = 'btn-upload';
        uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = field.type === 'video' ? 'video/*' : 'image/*';
        fileInput.style.display = 'none';
        fileInput.onchange = async () => {
            if (!fileInput.files[0]) return;
            const file = fileInput.files[0];
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            uploadBtn.classList.add('uploading');
            try {
                const uploadType = field.uploadType || (field.type === 'video' ? 'video' : 'image');
                const newPath = await uploadFile(file, uploadType);
                pathInput.value = newPath;
                onValueChange(newPath);
                updatePreview(newPath);
                showToast('File uploaded!', 'success');
            } catch (err) {
                showToast('Upload failed: ' + err.message, 'error');
            } finally {
                uploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload';
                uploadBtn.classList.remove('uploading');
                fileInput.value = '';
            }
        };
        uploadBtn.appendChild(fileInput);
        controls.appendChild(uploadBtn);

        wrap.appendChild(controls);
        group.appendChild(wrap);

        function updatePreview(val) {
            if (val) {
                if (field.type === 'video') {
                    preview.innerHTML = '<video src="/' + val + '" muted></video>';
                } else {
                    preview.innerHTML = '<img src="/' + val + '" alt="preview">';
                }
            } else {
                preview.innerHTML = '<div class="upload-empty"><i class="fas fa-' + (field.type === 'video' ? 'video' : 'image') + '"></i></div>';
            }
        }

        return group;
    }

    // ── Auth ──
    function showLogin() {
        loginScreen.classList.remove('hidden');
        resetScreen.classList.add('hidden');
        dashboard.classList.add('hidden');
        if (apiBaseInput) apiBaseInput.value = apiBase;
    }

    function showDashboard() {
        loginScreen.classList.add('hidden');
        resetScreen.classList.add('hidden');
        dashboard.classList.remove('hidden');

        // Default landing section
        if (!currentSection) {
            setActiveSidebar('dashboard');
            loadSection('dashboard');
        }
    }

    async function checkAuth() {
        // Check for reset token in URL
        const params = new URLSearchParams(window.location.search);
        const resetToken = params.get('reset');
        if (resetToken) {
            loginScreen.classList.add('hidden');
            resetScreen.classList.remove('hidden');
            dashboard.classList.add('hidden');
            newPassForm.onsubmit = async (e) => {
                e.preventDefault();
                const pw = $('#newPass').value;
                const pw2 = $('#confirmPass').value;
                if (pw !== pw2) { resetPassError.textContent = 'Passwords do not match'; return; }
                try {
                    const res = await fetch(apiUrl('/api/auth/reset-password/' + resetToken), {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newPassword: pw })
                    });
                    const data = await parseJsonResponse(res);
                    if (data.success) {
                        showToast('Password reset! You can now login.', 'success');
                        window.history.replaceState({}, '', '/admin');
                        showLogin();
                    } else {
                        resetPassError.textContent = data.error || 'Reset failed';
                    }
                } catch { resetPassError.textContent = 'Network error'; }
            };
            return;
        }

        if (!token) { showLogin(); return; }
        try {
            const res = await apiFetch('/api/auth/verify');
            const data = await parseJsonResponse(res);
            if (data.success) showDashboard();
            else showLogin();
        } catch { showLogin(); }
    }

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        if (apiBaseInput && apiBaseInput.value.trim()) {
            setApiBase(apiBaseInput.value);
        } else if (paramApiBase) {
            setApiBase(paramApiBase);
        } else if (storedApiBase) {
            setApiBase(storedApiBase);
        } else {
            setApiBase('');
        }
        try {
            const res = await fetch(apiUrl('/api/auth/login'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: $('#loginUser').value, password: $('#loginPass').value })
            });
            const data = await parseJsonResponse(res);
            if (data.success) {
                token = data.token;
                localStorage.setItem('sd_admin_token', token);
                showDashboard();
            } else {
                loginError.textContent = data.error || 'Login failed';
            }
        } catch { loginError.textContent = 'Network error — is the server running?'; }
    };

    forgotToggle.onclick = () => resetForm.classList.toggle('hidden');

    resetForm.onsubmit = async (e) => {
        e.preventDefault();
        resetMsg.textContent = '';
        try {
            const res = await fetch(apiUrl('/api/auth/reset-password'), {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: $('#resetEmail').value })
            });
            const data = await parseJsonResponse(res);
            resetMsg.textContent = data.message || 'Check your email.';
        } catch { resetMsg.textContent = 'Network error'; }
    };

    async function testApi(baseOverride) {
        const base = normalizeApiBase(baseOverride) || apiBase;
        try {
            const res = await fetch(base + '/api/health', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            const data = await parseJsonResponse(res);
            if (data && (data.status === 'ok' || data.cms === true)) {
                showToast('Backend OK: ' + base, 'success');
            } else {
                showToast('Backend responded, but not expected JSON: ' + base, 'error');
            }
        } catch (err) {
            showToast('Backend test failed: ' + (err && err.message ? err.message : 'Unknown error'), 'error');
        }
    }

    if (apiTestBtn) {
        apiTestBtn.onclick = () => testApi(apiBaseInput ? apiBaseInput.value : apiBase);
    }

    logoutBtn.onclick = () => {
        token = null;
        localStorage.removeItem('sd_admin_token');
        currentSection = null;
        showLogin();
    };

    // ── Change Password ──
    changePassBtn.onclick = () => changePassModal.classList.remove('hidden');
    cpCancel.onclick = () => { changePassModal.classList.add('hidden'); cpError.textContent = ''; };
    changePassModal.querySelector('.modal-backdrop').onclick = cpCancel.onclick;

    changePassForm.onsubmit = async (e) => {
        e.preventDefault();
        cpError.textContent = '';
        const pw = $('#cpNew').value;
        if (pw !== $('#cpConfirm').value) { cpError.textContent = 'Passwords do not match'; return; }
        try {
            const res = await apiFetch('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword: $('#cpCurrent').value, newPassword: pw })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Password changed!', 'success');
                changePassModal.classList.add('hidden');
                changePassForm.reset();
            } else {
                cpError.textContent = data.error || 'Failed';
            }
        } catch { cpError.textContent = 'Network error'; }
    };

    // ── Sidebar Navigation ──
    $$('.sb-btn[data-section]').forEach(btn => {
        btn.onclick = () => {
            setActiveSidebar(btn.dataset.section);
            loadSection(btn.dataset.section);
        };
    });

    function setActiveSidebar(section) {
        if (!sidebar) return;
        sidebar.querySelectorAll('.sb-btn').forEach(b => b.classList.remove('active'));
        const active = sidebar.querySelector('.sb-btn[data-section="' + section + '"]');
        if (active) active.classList.add('active');
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleString();
        } catch { return ''; }
    }

    function snippet(text, n) {
        const s = String(text || '').replace(/\s+/g, ' ').trim();
        if (s.length <= n) return s;
        return s.slice(0, n - 1) + '…';
    }

    function openModal(titleText, bodyEl) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        const content = document.createElement('div');
        content.className = 'modal-content modal-large';

        const title = document.createElement('h3');
        title.textContent = titleText;
        content.appendChild(title);

        const body = document.createElement('div');
        body.className = 'modal-body';
        if (bodyEl) body.appendChild(bodyEl);
        content.appendChild(body);

        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-discard';
        closeBtn.textContent = 'Close';
        actions.appendChild(closeBtn);
        content.appendChild(actions);

        modal.appendChild(backdrop);
        modal.appendChild(content);
        document.body.appendChild(modal);

        function onKey(e) {
            if (e.key === 'Escape') close();
        }

        function close() {
            document.removeEventListener('keydown', onKey);
            modal.remove();
        }

        closeBtn.onclick = close;
        backdrop.onclick = close;
        document.addEventListener('keydown', onKey);
    }

    // ── Load Section ──
    async function loadSection(section) {
        currentSection = section;

        if (section === 'dashboard') {
            sectionTitle.textContent = 'Dashboard';
            saveBtn.classList.add('hidden');
            discardBtn.classList.add('hidden');
            formArea.innerHTML = '';
            await renderDashboard();
            return;
        }

        if (section === 'messages') {
            sectionTitle.textContent = 'Messages';
            saveBtn.classList.add('hidden');
            discardBtn.classList.add('hidden');
            formArea.innerHTML = '';
            await renderMessages();
            return;
        }

        const schema = schemas[section];
        if (!schema) return;
        sectionTitle.textContent = schema.label;
        formArea.innerHTML = '<p class="placeholder-text">Loading...</p>';
        saveBtn.classList.remove('hidden');
        discardBtn.classList.remove('hidden');

        try {
            const res = await apiFetch('/api/content/' + section);
            if (!res.ok) throw new Error('Failed to load');
            const data = await res.json();
            originalData = deepClone(data);
            liveData = data;
            renderForm(schema.fields, liveData, formArea);
        } catch (err) {
            formArea.innerHTML = '<p class="placeholder-text" style="color:var(--rose)">Error loading section: ' + err.message + '</p>';
        }
    }

    async function renderDashboard() {
        const wrap = document.createElement('div');
        wrap.className = 'dash-wrap';
        formArea.appendChild(wrap);

        const cards = document.createElement('div');
        cards.className = 'dash-cards';
        wrap.appendChild(cards);

        const cardTotal = document.createElement('div');
        cardTotal.className = 'dash-card';
        cardTotal.innerHTML = '<div class="dash-k">Total Messages</div><div class="dash-v">—</div>';
        cards.appendChild(cardTotal);

        const cardUnread = document.createElement('div');
        cardUnread.className = 'dash-card';
        cardUnread.innerHTML = '<div class="dash-k">Unread</div><div class="dash-v">—</div>';
        cards.appendChild(cardUnread);

        const cardLatest = document.createElement('div');
        cardLatest.className = 'dash-card';
        cardLatest.innerHTML = '<div class="dash-k">Latest</div><div class="dash-v">—</div>';
        cards.appendChild(cardLatest);

        const actions = document.createElement('div');
        actions.className = 'dash-actions';
        const openInbox = document.createElement('button');
        openInbox.type = 'button';
        openInbox.className = 'btn-save';
        openInbox.innerHTML = '<i class="fas fa-inbox"></i> Open Messages';
        openInbox.onclick = () => { setActiveSidebar('messages'); loadSection('messages'); };
        actions.appendChild(openInbox);
        wrap.appendChild(actions);

        const recentWrap = document.createElement('div');
        recentWrap.className = 'dash-recent';
        const recentTitle = document.createElement('h4');
        recentTitle.textContent = 'Recent Unread';
        recentWrap.appendChild(recentTitle);
        const list = document.createElement('div');
        list.className = 'dash-recent-list';
        list.innerHTML = '<p class="placeholder-text" style="padding:18px 0">Loading…</p>';
        recentWrap.appendChild(list);
        wrap.appendChild(recentWrap);

        try {
            const [stats, recent] = await Promise.all([
                apiJson('/api/messages/stats'),
                apiJson('/api/messages?limit=5&offset=0&unreadOnly=1')
            ]);
            if (stats.success) {
                cardTotal.querySelector('.dash-v').textContent = String(stats.total);
                cardUnread.querySelector('.dash-v').textContent = String(stats.unread);
                cardLatest.querySelector('.dash-v').textContent = stats.latestAt ? formatDate(stats.latestAt) : '—';
            }
            list.innerHTML = '';
            if (!recent.success || !recent.messages || recent.messages.length === 0) {
                const p = document.createElement('p');
                p.className = 'placeholder-text';
                p.style.padding = '18px 0';
                p.textContent = 'No unread messages.';
                list.appendChild(p);
                return;
            }
            recent.messages.forEach(m => {
                const row = document.createElement('div');
                row.className = 'dash-recent-item';
                const main = document.createElement('div');
                main.className = 'dash-recent-main';

                const top = document.createElement('div');
                top.className = 'dash-recent-top';
                const b = document.createElement('span');
                b.className = 'badge unread';
                b.textContent = 'Unread';
                top.appendChild(b);
                const date = document.createElement('span');
                date.className = 'dash-recent-date';
                date.textContent = formatDate(m.createdAt);
                top.appendChild(date);
                main.appendChild(top);

                const subject = document.createElement('div');
                subject.className = 'dash-recent-subject';
                subject.textContent = snippet(m.subject, 70);
                main.appendChild(subject);

                const from = document.createElement('div');
                from.className = 'dash-recent-from';
                from.textContent = snippet(m.name, 30) + ' • ' + snippet(m.email, 40);
                main.appendChild(from);

                const viewBtn = document.createElement('button');
                viewBtn.type = 'button';
                viewBtn.className = 'btn-add dash-view';
                viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
                viewBtn.onclick = () => openMessageModal(m);

                row.appendChild(main);
                row.appendChild(viewBtn);
                list.appendChild(row);
            });
        } catch (err) {
            showToast('Failed to load dashboard: ' + err.message, 'error');
        }
    }

    function openMessageModal(m) {
        const body = document.createElement('div');
        body.className = 'msg-modal';

        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        const rows = [
            { k: 'From', v: (m.name || '') + ' <' + (m.email || '') + '>' },
            { k: 'Subject', v: m.subject || '' },
            { k: 'Date', v: formatDate(m.createdAt) },
            { k: 'Email', v: m.emailSent === true ? 'Sent' : m.emailSent === false ? 'Failed' : '—' }
        ];
        rows.forEach(r => {
            const row = document.createElement('div');
            const k = document.createElement('span');
            k.className = 'msg-label';
            k.textContent = r.k;
            const v = document.createElement('div');
            v.className = 'msg-val';
            v.textContent = r.v;
            row.appendChild(k);
            row.appendChild(v);
            meta.appendChild(row);
        });
        body.appendChild(meta);

        const msg = document.createElement('div');
        msg.className = 'msg-body';
        msg.textContent = m.message || '';
        body.appendChild(msg);

        openModal('Message', body);
    }

    async function renderMessages() {
        const wrap = document.createElement('div');
        wrap.className = 'msg-wrap';
        formArea.appendChild(wrap);

        const toolbar = document.createElement('div');
        toolbar.className = 'msg-toolbar';
        toolbar.innerHTML = `
            <div class="msg-left">
                <input class="msg-search" type="text" placeholder="Search name, email, subject, message…">
                <label class="msg-check"><input type="checkbox" class="msg-unread"> Unread only</label>
            </div>
            <div class="msg-right">
                <button type="button" class="btn-add msg-refresh"><i class="fas fa-rotate"></i> Refresh</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        const tableWrap = document.createElement('div');
        tableWrap.className = 'msg-table-wrap';
        tableWrap.innerHTML = '<p class="placeholder-text" style="padding:18px 0">Loading…</p>';
        wrap.appendChild(tableWrap);

        const pager = document.createElement('div');
        pager.className = 'msg-pager';
        pager.innerHTML = `
            <button type="button" class="btn-discard msg-prev" disabled><i class="fas fa-chevron-left"></i> Prev</button>
            <div class="msg-page">—</div>
            <button type="button" class="btn-discard msg-next" disabled>Next <i class="fas fa-chevron-right"></i></button>
        `;
        wrap.appendChild(pager);

        const searchInput = toolbar.querySelector('.msg-search');
        const unreadOnlyInput = toolbar.querySelector('.msg-unread');
        const refreshBtn = toolbar.querySelector('.msg-refresh');
        const prevBtn = pager.querySelector('.msg-prev');
        const nextBtn = pager.querySelector('.msg-next');
        const pageEl = pager.querySelector('.msg-page');

        const state = { search: '', unreadOnly: false, limit: 25, offset: 0, total: 0 };

        function updatePager() {
            const from = state.total === 0 ? 0 : state.offset + 1;
            const to = Math.min(state.offset + state.limit, state.total);
            pageEl.textContent = `${from}–${to} of ${state.total}`;
            prevBtn.disabled = state.offset <= 0;
            nextBtn.disabled = state.offset + state.limit >= state.total;
        }

        async function fetchAndRender() {
            tableWrap.innerHTML = '<p class="placeholder-text" style="padding:18px 0">Loading…</p>';
            try {
                const qs = new URLSearchParams({
                    limit: String(state.limit),
                    offset: String(state.offset),
                    unreadOnly: state.unreadOnly ? '1' : '0',
                    search: state.search
                });
                const data = await apiJson('/api/messages?' + qs.toString());
                if (!data.success) throw new Error(data.error || 'Failed');
                state.total = data.total || 0;
                renderTable(data.messages || []);
                updatePager();
            } catch (err) {
                const p = document.createElement('p');
                p.className = 'placeholder-text';
                p.style.color = 'var(--rose)';
                p.style.padding = '18px 0';
                p.textContent = 'Failed to load messages: ' + (err && err.message ? err.message : 'Unknown error');
                tableWrap.innerHTML = '';
                tableWrap.appendChild(p);
                state.total = 0;
                updatePager();
            }
        }

        function renderTable(messages) {
            if (!messages.length) {
                tableWrap.innerHTML = '<p class="placeholder-text" style="padding:18px 0">No messages found.</p>';
                return;
            }

            const table = document.createElement('table');
            table.className = 'msg-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Date</th>
                        <th>From</th>
                        <th>Subject</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
            `;
            const tbody = document.createElement('tbody');

            messages.forEach(m => {
                const tr = document.createElement('tr');
                tr.className = m.read ? 'is-read' : 'is-unread';

                const status = document.createElement('td');
                status.innerHTML = `<span class="badge ${m.read ? 'read' : 'unread'}">${m.read ? 'Read' : 'Unread'}</span>`;
                tr.appendChild(status);

                const dt = document.createElement('td');
                dt.textContent = formatDate(m.createdAt);
                tr.appendChild(dt);

                const from = document.createElement('td');
                const fromWrap = document.createElement('div');
                fromWrap.className = 'msg-from';
                const nm = document.createElement('div');
                nm.className = 'msg-name';
                nm.textContent = snippet(m.name, 28);
                const em = document.createElement('a');
                em.className = 'msg-email';
                em.href = 'mailto:' + (m.email || '');
                em.textContent = snippet(m.email, 34);
                fromWrap.appendChild(nm);
                fromWrap.appendChild(em);
                from.appendChild(fromWrap);
                tr.appendChild(from);

                const subj = document.createElement('td');
                const subjMain = document.createElement('div');
                subjMain.className = 'msg-subj';
                subjMain.textContent = snippet(m.subject, 60);
                const snip = document.createElement('div');
                snip.className = 'msg-snippet';
                snip.textContent = snippet(m.message, 90);
                subj.appendChild(subjMain);
                subj.appendChild(snip);
                tr.appendChild(subj);

                const email = document.createElement('td');
                if (m.emailSent === true) email.innerHTML = '<span class="badge sent">Sent</span>';
                else if (m.emailSent === false) email.innerHTML = '<span class="badge failed">Failed</span>';
                else email.innerHTML = '<span class="badge pending">—</span>';
                tr.appendChild(email);

                const actions = document.createElement('td');
                actions.className = 'msg-actions';
                const viewBtn = document.createElement('button');
                viewBtn.type = 'button';
                viewBtn.className = 'btn-add';
                viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                viewBtn.title = 'View';
                viewBtn.onclick = () => openMessageModal(m);

                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'btn-add';
                toggleBtn.innerHTML = m.read ? '<i class="fas fa-envelope"></i>' : '<i class="fas fa-envelope-open"></i>';
                toggleBtn.title = m.read ? 'Mark Unread' : 'Mark Read';
                toggleBtn.onclick = async () => {
                    try {
                        const out = await apiJson('/api/messages/' + m.id + '/read', {
                            method: 'POST',
                            body: JSON.stringify({ read: !m.read })
                        });
                        if (!out.success) throw new Error(out.error || 'Failed');
                        await fetchAndRender();
                        showToast('Updated message', 'success');
                    } catch (err) {
                        showToast('Update failed: ' + err.message, 'error');
                    }
                };

                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'btn-remove';
                delBtn.innerHTML = '<i class="fas fa-trash"></i>';
                delBtn.title = 'Delete';
                delBtn.onclick = async () => {
                    if (!confirm('Delete this message?')) return;
                    try {
                        const out = await apiJson('/api/messages/' + m.id, { method: 'DELETE' });
                        if (!out.success) throw new Error(out.error || 'Failed');
                        if (state.offset >= state.total - 1) state.offset = Math.max(0, state.offset - state.limit);
                        await fetchAndRender();
                        showToast('Deleted', 'success');
                    } catch (err) {
                        showToast('Delete failed: ' + err.message, 'error');
                    }
                };

                actions.appendChild(viewBtn);
                actions.appendChild(toggleBtn);
                actions.appendChild(delBtn);
                tr.appendChild(actions);

                tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            tableWrap.innerHTML = '';
            tableWrap.appendChild(table);
        }

        let searchTimer = null;
        searchInput.oninput = () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                state.search = searchInput.value.trim();
                state.offset = 0;
                fetchAndRender();
            }, 250);
        };

        unreadOnlyInput.onchange = () => {
            state.unreadOnly = !!unreadOnlyInput.checked;
            state.offset = 0;
            fetchAndRender();
        };

        refreshBtn.onclick = () => fetchAndRender();

        prevBtn.onclick = () => {
            state.offset = Math.max(0, state.offset - state.limit);
            fetchAndRender();
        };

        nextBtn.onclick = () => {
            state.offset = state.offset + state.limit;
            fetchAndRender();
        };

        await fetchAndRender();
    }

    // ── Form Rendering ──
    function renderForm(fields, data, container) {
        container.innerHTML = '';
        fields.forEach(field => {
            if (field.type === 'array') {
                container.appendChild(renderArray(field, data));
            } else {
                container.appendChild(renderField(field, data));
            }
        });
    }

    function renderField(field, data, prefix) {
        // Handle upload fields
        if (field.type === 'image' || field.type === 'video') {
            return createUploadField(field, data[field.key] || '', (newVal) => {
                data[field.key] = newVal;
            });
        }

        const group = document.createElement('div');
        group.className = 'form-group';
        const id = (prefix || '') + field.key;

        let val = data[field.key];
        if (val === undefined || val === null) val = '';

        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = field.label;
        group.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
            input.value = val;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = val;
        }
        input.id = id;
        input.name = id;
        input.dataset.key = field.key;
        group.appendChild(input);

        if (field.hint) {
            const hint = document.createElement('div');
            hint.className = 'hint';
            hint.textContent = field.hint;
            group.appendChild(hint);
        }
        return group;
    }

    function renderArray(field, data) {
        const section = document.createElement('div');
        section.className = 'form-section';
        section.dataset.arrayKey = field.key;

        const header = document.createElement('div');
        header.className = 'array-header';
        const h4 = document.createElement('h4');
        h4.textContent = field.label;
        header.appendChild(h4);
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-add';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
        header.appendChild(addBtn);
        section.appendChild(header);

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'array-items';
        section.appendChild(itemsContainer);

        let arr = data[field.key];
        if (!Array.isArray(arr)) arr = [];

        function renderItems() {
            itemsContainer.innerHTML = '';
            arr.forEach((item, idx) => {
                itemsContainer.appendChild(renderArrayItem(field, item, idx, arr, renderItems));
            });
        }

        addBtn.onclick = () => {
            // Check if this is a simple string array
            if (field.fields.length === 1 && field.fields[0].key === '_value') {
                arr.push('');
            } else {
                const newItem = {};
                field.fields.forEach(f => {
                    if (f.type === 'array') newItem[f.key] = [];
                    else newItem[f.key] = '';
                });
                arr.push(newItem);
            }
            data[field.key] = arr;
            renderItems();
        };

        renderItems();
        return section;
    }

    function renderArrayItem(field, item, idx, arr, rerender) {
        const div = document.createElement('div');
        div.className = 'array-item';

        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';
        const num = document.createElement('span');
        num.className = 'item-num';
        num.textContent = '#' + (idx + 1);
        itemHeader.appendChild(num);
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
        removeBtn.onclick = () => { arr.splice(idx, 1); rerender(); };
        itemHeader.appendChild(removeBtn);
        div.appendChild(itemHeader);

        // Simple string array
        if (field.fields.length === 1 && field.fields[0].key === '_value') {
            const f = field.fields[0];
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = f.label;
            group.appendChild(label);
            let input;
            if (f.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
            input.value = typeof item === 'string' ? item : '';
            input.oninput = () => { arr[idx] = input.value; };
            group.appendChild(input);
            div.appendChild(group);
            return div;
        }

        // Object array
        const fieldsWrap = document.createElement('div');
        if (field.fields.length <= 3 && !field.fields.some(f => f.type === 'textarea' || f.type === 'array' || f.type === 'image' || f.type === 'video')) {
            fieldsWrap.className = 'inline-fields';
        }

        field.fields.forEach(f => {
            if (f.type === 'array') {
                // Nested array
                const nestedSection = renderArray(f, item);
                div.appendChild(nestedSection);
                return;
            }
            // Upload field inside array item
            if (f.type === 'image' || f.type === 'video') {
                const uploadGroup = createUploadField(f, item[f.key] || '', (newVal) => {
                    item[f.key] = newVal;
                });
                fieldsWrap.appendChild(uploadGroup);
                return;
            }
            const group = document.createElement('div');
            group.className = 'form-group';
            const label = document.createElement('label');
            label.textContent = f.label;
            group.appendChild(label);
            let input;
            if (f.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 2;
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
            input.value = item[f.key] !== undefined && item[f.key] !== null ? item[f.key] : '';
            input.oninput = () => { item[f.key] = input.value; };
            group.appendChild(input);
            if (f.hint) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                hint.textContent = f.hint;
                group.appendChild(hint);
            }
            fieldsWrap.appendChild(group);
        });

        div.appendChild(fieldsWrap);
        return div;
    }

    // ── Collect Form Data ──
    function collectData(fields, container, data) {
        fields.forEach(field => {
            if (field.type === 'array' || field.type === 'image' || field.type === 'video') {
                // Already mutated in-place via callbacks
                return;
            }
            const input = container.querySelector('[data-key="' + field.key + '"]');
            if (input) {
                let val = input.value;
                if (field.key === 'perPage') val = parseInt(val, 10) || val;
                data[field.key] = val;
            }
        });
        return data;
    }

    // ── Save ──
    saveBtn.onclick = async () => {
        if (!currentSection || !liveData) return;
        const schema = schemas[currentSection];
        // Collect text field values from DOM into the live data object
        // (arrays and upload fields are already mutated in-place)
        collectData(schema.fields, formArea, liveData);
        const data = deepClone(liveData);

        try {
            const res = await apiFetch('/api/content/' + currentSection, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                showToast('Saved "' + schema.label + '" successfully!', 'success');
                // Reload section to re-bind all callbacks to fresh data
                loadSection(currentSection);
            } else {
                showToast('Save failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        }
    };

    // ── Discard ──
    discardBtn.onclick = () => {
        if (currentSection) loadSection(currentSection);
    };

    // ── Init ──
    setApiBase(paramApiBase || storedApiBase || '');
    checkAuth();
})();
