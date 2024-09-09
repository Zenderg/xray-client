import fs from 'fs/promises';
import { ROUTER_CONFIG_FILE } from '../constants.js';

export async function getRouterConfigData() {
    const data = await fs.readFile(ROUTER_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  }
  
export async function updateRouterConfig(newConfig) {
    await fs.writeFile(ROUTER_CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  }

export async function clearPreviousRoutes(ssh, routerConfig) {
  const { stdout: currentRules } = await ssh.execCommand('iptables-save -t nat');

  const rulesToDelete = currentRules.split('\n')
  .filter(line => line.includes(`--to-destination ${routerConfig.redirectIp}:${routerConfig.redirectPort}`))
  .map(line => line.replace(/^-A /, '').trim());

  for (const rule of rulesToDelete) {
    const clearCommand = `iptables -t nat -D ${rule} 2>/dev/null`
    console.log(clearCommand)
    await ssh.execCommand(clearCommand);
  }
}