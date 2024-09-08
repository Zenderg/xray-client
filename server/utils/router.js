import fs from 'fs/promises';
import { ROUTER_CONFIG_FILE } from '../constants.js';

export async function getRouterConfigData() {
    const data = await fs.readFile(ROUTER_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  }
  
export async function updateRouterConfig(newConfig) {
    await fs.writeFile(ROUTER_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  }