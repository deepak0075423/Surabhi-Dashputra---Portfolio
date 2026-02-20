const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON, messagesPath } = require('./json-store');

async function loadStore() {
    const data = await readJSON(messagesPath());
    if (data && Array.isArray(data.messages)) return data;
    return { messages: [] };
}

async function saveStore(store) {
    await writeJSON(messagesPath(), store);
}

function normalizeBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === '1' || s === 'true' || s === 'yes') return true;
        if (s === '0' || s === 'false' || s === 'no') return false;
    }
    return null;
}

function matchSearch(message, search) {
    if (!search) return true;
    const s = search.toLowerCase();
    return [
        message.name,
        message.email,
        message.subject,
        message.message,
        message.ip,
        message.userAgent
    ].some(v => String(v || '').toLowerCase().includes(s));
}

async function getStats() {
    const store = await loadStore();
    const total = store.messages.length;
    const unread = store.messages.filter(m => !m.read).length;
    const latestAt = store.messages.reduce((acc, m) => {
        const dt = m && m.createdAt ? new Date(m.createdAt).getTime() : 0;
        return dt > acc ? dt : acc;
    }, 0);
    return { total, unread, latestAt: latestAt ? new Date(latestAt).toISOString() : null };
}

async function listMessages({ limit = 50, offset = 0, unreadOnly = false, search = '' } = {}) {
    const store = await loadStore();
    const sorted = [...store.messages].sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const filtered = sorted.filter(m => {
        if (unreadOnly && m.read) return false;
        return matchSearch(m, search);
    });

    return {
        total: filtered.length,
        messages: filtered.slice(offset, offset + limit)
    };
}

async function addContactMessage({ name, email, subject, message, ip, userAgent }) {
    const store = await loadStore();
    const now = new Date().toISOString();
    const entry = {
        id: uuidv4(),
        name,
        email,
        subject,
        message,
        ip: ip || null,
        userAgent: userAgent || null,
        emailSent: null,
        emailError: null,
        read: false,
        createdAt: now,
        updatedAt: now
    };
    store.messages.unshift(entry);
    if (store.messages.length > 2000) store.messages = store.messages.slice(0, 2000);
    await saveStore(store);
    return entry;
}

async function updateMessage(id, updates) {
    const store = await loadStore();
    const msg = store.messages.find(m => m.id === id);
    if (!msg) return null;
    Object.assign(msg, updates || {});
    msg.updatedAt = new Date().toISOString();
    await saveStore(store);
    return msg;
}

async function setRead(id, read) {
    return updateMessage(id, { read: !!read });
}

async function setEmailStatus(id, { emailSent, emailError }) {
    return updateMessage(id, { emailSent: !!emailSent, emailError: emailError || null });
}

async function deleteMessage(id) {
    const store = await loadStore();
    const before = store.messages.length;
    store.messages = store.messages.filter(m => m.id !== id);
    if (store.messages.length === before) return false;
    await saveStore(store);
    return true;
}

module.exports = {
    loadStore,
    saveStore,
    normalizeBool,
    getStats,
    listMessages,
    addContactMessage,
    updateMessage,
    setRead,
    setEmailStatus,
    deleteMessage
};
