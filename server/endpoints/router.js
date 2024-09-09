import { NodeSSH } from 'node-ssh';
import { clearPreviousRoutes, getRouterConfigData, updateRouterConfig } from '../utils/router.js';
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

      await clearPreviousRoutes(ssh, routerConfig)

      console.log("Clear previous redirects completed...")
  
      for (const cidr of cidrs) {
        const commandTcp = `iptables -t nat -A PREROUTING -p tcp -d ${cidr} -j DNAT --to-destination ${routerConfig.redirectIp}:${routerConfig.redirectPort}`;
        const commandUdp = `iptables -t nat -A PREROUTING -p udp -d ${cidr} -j DNAT --to-destination ${routerConfig.redirectIp}:${routerConfig.redirectPort}`;
        console.log(commandTcp)
        console.log(commandUdp)
        await ssh.execCommand(commandTcp);
        await ssh.execCommand(commandUdp);
      }
  
      ssh.dispose();

      console.log('All setteled!')
  
      res.json({ message: 'Redirect rules applied successfully' });
    } catch (error) {
      console.error('Error applying redirect rules:', error);
      res.status(500).json({ error: 'An error occurred while applying redirect rules' });
    }
  }

export async function postResetRedirect(req, res) {
  try {
    const routerConfig = await getRouterConfigData();

    const ssh = new NodeSSH();
    await ssh.connect(routerConfig.ssh);

    await clearPreviousRoutes(ssh, routerConfig)

    console.log("Clear previous redirects completed")

    ssh.dispose();

    res.json({ message: 'Redirect rules reset successfully' });
  } catch (error) {
    console.error('Error reseting redirect rules:', error);
    res.status(500).json({ error: 'An error occurred while reseting redirect rules' });
  }
}