const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const CONTENT_DIR = path.join(DATA_DIR, 'content');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function readJSON(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
    }
}

async function writeJSON(filePath, data) {
    await ensureDir(path.dirname(filePath));
    const json = JSON.stringify(data, null, 2) + '\n';
    const tmpPath = filePath + '.tmp';
    await fs.writeFile(tmpPath, json, 'utf8');
    await fs.rename(tmpPath, filePath);
}

async function backupJSON(filePath) {
    try {
        await fs.access(filePath);
    } catch {
        return; // nothing to back up
    }
    await ensureDir(BACKUP_DIR);
    const basename = path.basename(filePath, '.json');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(BACKUP_DIR, `${basename}_${timestamp}.json`);
    await fs.copyFile(filePath, dest);
}

function contentPath(section) {
    return path.join(CONTENT_DIR, `${section}.json`);
}

function adminPath() {
    return path.join(DATA_DIR, 'admin.json');
}

function resetTokensPath() {
    return path.join(DATA_DIR, 'reset-tokens.json');
}

function messagesPath() {
    return path.join(DATA_DIR, 'messages.json');
}

module.exports = {
    DATA_DIR,
    CONTENT_DIR,
    BACKUP_DIR,
    readJSON,
    writeJSON,
    backupJSON,
    contentPath,
    adminPath,
    resetTokensPath,
    messagesPath,
    ensureDir
};
