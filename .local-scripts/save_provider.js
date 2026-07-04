const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const GEMINI_DIR = '.gemini';
const home = os.homedir();
const dir = path.join(home, GEMINI_DIR);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const settingsPath = path.join(dir, 'settings.json');
let current = {};
try {
  if (fs.existsSync(settingsPath)) {
    current = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }
} catch (e) {
  // ignore parse errors and start fresh
}

current.openaiCompatibleProviders = current.openaiCompatibleProviders || {};
current.openaiCompatibleProviders.local = { baseUrl: 'http://localhost:3001', defaultModel: 'auto' };
fs.writeFileSync(settingsPath, JSON.stringify(current, null, 2), 'utf8');
console.log('Wrote settings to', settingsPath);

// FileKeychain write
const service = 'gemini-cli';
function sanitize(s) {
  return s.replace(/[^a-zA-Z0-9-_.]/g, '_');
}
const account = `openai-compatible:${sanitize('http://localhost:3001')}`;
const tokenFilePath = path.join(dir, 'gemini-credentials.json');
const salt = `${os.hostname()}-${os.userInfo().username}-gemini-cli`;
const encryptionKey = crypto.scryptSync('gemini-cli-oauth', salt, 32);
const data = {};
data[service] = {};
data[service][account] = 'freellmapi-5a99344e472b1664845bd9ebec55d21409771f4626af2b5ctest';
const json = JSON.stringify(data, null, 2);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
let encrypted = cipher.update(json, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag().toString('hex');
const out = iv.toString('hex') + ':' + authTag + ':' + encrypted;
fs.writeFileSync(tokenFilePath, out, { mode: 0o600 });
console.log('Stored API key in', tokenFilePath);
