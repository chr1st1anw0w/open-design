// @ts-nocheck
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

function resolveOverrideDir(raw, projectRoot) {
  const expanded = raw.startsWith('~/') ? path.join(homedir(), raw.slice(2)) : raw;
  return path.isAbsolute(expanded) ? expanded : path.resolve(projectRoot, expanded);
}

function envOverrideDir(envName, projectRoot) {
  const raw = process.env[envName];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? resolveOverrideDir(trimmed, projectRoot) : null;
}

function configFile(projectRoot) {
  const dir =
    envOverrideDir('OD_PROMPT_EXPERT_CONFIG_DIR', projectRoot) ??
    envOverrideDir('OD_DATA_DIR', projectRoot) ??
    path.join(projectRoot, '.od');
  return path.join(dir, 'prompt-expert-config.json');
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanBool(value, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

async function readStored(projectRoot) {
  try {
    const raw = await readFile(configFile(projectRoot), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    if (err && err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeStored(projectRoot, config) {
  const file = configFile(projectRoot);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(config, null, 2), 'utf8');
}

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function maskSecret(value, exposeTail = true) {
  if (!value) return { configured: false, tail: '' };
  return { configured: true, tail: exposeTail ? value.slice(-4) : '' };
}

export async function resolvePromptExpertConfig(projectRoot) {
  const stored = await readStored(projectRoot);
  const preferEnv = cleanBool(stored.preferEnv, true);
  const envApiKey = readEnv('THESYS_API_KEY') || readEnv('OD_THESYS_API_KEY');
  const envIdentitySecret =
    readEnv('THESYS_IDENTITY_SECRET') || readEnv('OD_THESYS_IDENTITY_SECRET');
  const apiKey = preferEnv
    ? envApiKey || cleanString(stored.apiKey)
    : cleanString(stored.apiKey) || envApiKey;
  const identitySecret = preferEnv
    ? envIdentitySecret || cleanString(stored.identitySecret)
    : cleanString(stored.identitySecret) || envIdentitySecret;
  return {
    apiKey,
    identitySecret,
    publicAgentUrl:
      cleanString(stored.publicAgentUrl) ||
      'https://console.thesys.dev/app/AWD-o9TAHu4nNnLqVFp7W',
    preferEnv,
    apiKeySource: apiKey
      ? apiKey === envApiKey
        ? 'env'
        : 'stored'
      : 'unset',
    identitySecretSource: identitySecret
      ? identitySecret === envIdentitySecret
        ? 'env'
        : 'stored'
      : 'unset',
  };
}

export async function readMaskedPromptExpertConfig(projectRoot) {
  const stored = await readStored(projectRoot);
  const resolved = await resolvePromptExpertConfig(projectRoot);
  const storedApi = cleanString(stored.apiKey);
  const storedSecret = cleanString(stored.identitySecret);
  return {
    provider: 'thesys-c1',
    apiKey: {
      ...maskSecret(resolved.apiKey, resolved.apiKeySource === 'stored'),
      source: resolved.apiKeySource,
      storedTail: storedApi ? storedApi.slice(-4) : '',
    },
    identitySecret: {
      ...maskSecret(resolved.identitySecret, resolved.identitySecretSource === 'stored'),
      source: resolved.identitySecretSource,
      storedTail: storedSecret ? storedSecret.slice(-4) : '',
    },
    publicAgentUrl: resolved.publicAgentUrl,
    preferEnv: resolved.preferEnv,
  };
}

export async function writePromptExpertConfig(projectRoot, input) {
  const prev = await readStored(projectRoot);
  const next = {
    apiKey: cleanString(input?.apiKey) || cleanString(prev.apiKey),
    identitySecret:
      cleanString(input?.identitySecret) || cleanString(prev.identitySecret),
    publicAgentUrl:
      cleanString(input?.publicAgentUrl) ||
      cleanString(prev.publicAgentUrl) ||
      'https://console.thesys.dev/app/AWD-o9TAHu4nNnLqVFp7W',
    preferEnv: cleanBool(input?.preferEnv, cleanBool(prev.preferEnv, true)),
  };
  if (input?.clearApiKey) next.apiKey = '';
  if (input?.clearIdentitySecret) next.identitySecret = '';
  await writeStored(projectRoot, next);
  return readMaskedPromptExpertConfig(projectRoot);
}
