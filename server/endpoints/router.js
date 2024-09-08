import { NodeSSH } from 'node-ssh';
import { getRouterConfigData, updateRouterConfig } from '../utils/router.js';
import { getAllCidrs } from '../utils/cidr.js';

export async function getRouterConfig(req, res) {
    try {
      const config = await getRouterConfigData();
      res.json(config);
    } catch (error) {
      console.error('Error reading router config:', error);
      res.status(500).json({ error: 'An error occurred while reading router config' });
    }
  }

  export async function postRouterConfig(req, res) {
    try {
      await updateRouterConfig(req.body);
      res.json({ message: 'Router config updated successfully' });
    } catch (error) {
      console.error('Error updating router config:', error);
      res.status(500).json({ error: 'An error occurred while updating router config' });
    }
  }

  export async function postApplyRedirect(req, res) {
    try {
      const routerConfig = await getRouterConfigData();
      const cidrs = await getAllCidrs();
  
      const ssh = new NodeSSH();
      await ssh.connect(routerConfig.ssh);

      const { stdout: currentRules } = await ssh.execCommand('iptables-save -t nat');

      const rulesToDelete = currentRules.split('\n')
        .filter(line => line.includes(`--to-destination ${routerConfig.redirectIp}:${routerConfig.redirectPort}`))
        .map(line => line.replace(/^-A /, '').trim());

      for (const rule of rulesToDelete) {
        const clearCommand = `iptables -t nat -D ${rule} 2>/dev/null`
        console.log(clearCommand)
        await ssh.execCommand(clearCommand);
      }

      console.log("Clear previous redirects completed...")
  
      for (const cidr of cidrs) {
        const command = `iptables -t nat -A PREROUTING -p tcp -d ${cidr} -j DNAT --to-destination ${routerConfig.redirectIp}:${routerConfig.redirectPort}`;
        console.log(command)
        await ssh.execCommand(command);
      }
  
      ssh.dispose();

      console.log('All setteled!')
  
      res.json({ message: 'Redirect rules applied successfully' });
    } catch (error) {
      console.error('Error applying redirect rules:', error);
      res.status(500).json({ error: 'An error occurred while applying redirect rules' });
    }
  }