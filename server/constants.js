import path from 'path';
import fs from 'fs/promises';

export const CONFIG_DIR = process.env.CONFIG_DIR || path.join(process.cwd(), 'config');

fs.mkdir(CONFIG_DIR, { recursive: true }).catch(console.error);

export const CACHE_DIR = path.join(CONFIG_DIR, 'cache');
export const DOMAINS_FILE = path.join(CONFIG_DIR, 'domains.txt');
export const XRAY_CONFIG_FILE = path.join(CONFIG_DIR, 'xray-config.json');
export const ROUTER_CONFIG_FILE = path.join(CONFIG_DIR, 'router-config.json');
