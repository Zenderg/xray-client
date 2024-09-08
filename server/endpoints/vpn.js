import { XRAY_CONFIG_FILE } from "../constants.js";
import { getXrayProcess, startXray, stopXray } from "../utils/xray.js";
import fs from 'fs/promises';

export async function getVpnConfig(req, res) {
    try {
        const config = await fs.readFile(XRAY_CONFIG_FILE, 'utf8');
        res.json(JSON.parse(config));
    } catch (error) {
        console.error('Error reading VPN config:', error);
        if (error.code === 'ENOENT') {
            // Если файл не существует, возвращаем пустую конфигурацию
            res.json({});
        } else {
            res.status(500).json({ error: 'An error occurred while reading VPN config' });
        }
    }
};

export async function postStartVpn(req, res) {
    try {
        startXray();
        res.json({ message: 'VPN started successfully' });
    } catch (error) {
        console.error('Error starting VPN:', error);
        res.status(500).json({ error: 'An error occurred while starting VPN' });
    }
};

export async function postStopVpn(req, res) {
    try {
        stopXray();
        res.json({ message: 'VPN stopped successfully' });
    } catch (error) {
        console.error('Error stopping VPN:', error);
        res.status(500).json({ error: 'An error occurred while stopping VPN' });
    }
};

export async function postVpnConfig(req, res) {
    try {
        const config = JSON.stringify(req.body, null, 2);
        await fs.writeFile(XRAY_CONFIG_FILE, config);
        stopXray();
        startXray();
        res.json({ message: 'VPN config updated successfully' });
    } catch (error) {
        console.error('Error updating VPN config:', error);
        res.status(500).json({ error: 'An error occurred while updating VPN config' });
    }
};

export async function getVpnStatus(req, res) {
    res.json({ status: getXrayProcess() ? 'running' : 'stopped' });
};

export async function postRestartVpn(req, res) {
    try {
        stopXray();
        startXray();
        res.json({ message: 'VPN restarted successfully' });
    } catch (error) {
        console.error('Error restarting VPN:', error);
        res.status(500).json({ error: 'An error occurred while restarting VPN' });
    }
};