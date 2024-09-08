import fs from 'fs/promises';
import { CONFIG_DIR, ROUTER_CONFIG_FILE, XRAY_CONFIG_FILE } from "../constants.js";

async function ensureDir(dirPath) {
    try {
        await fs.access(dirPath);
    } catch (error) {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

async function ensureFile(filePath, defaultContent) {
    try {
        await fs.access(filePath);
    } catch (error) {
        await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
    }
}

export async function initConfigFiles() {
    await ensureDir(CONFIG_DIR);

    const defaultRouterConfig = {
        "ssh": {
          host: "192.168.1.1",
          username: "admin",
          password: "password"
        },
        redirectIp: "192.168.1.100",
        redirectPort: 8080
      }

    const defaultXrayConfig = {
        inbounds: [
            {
                port: 10808,
                protocol: "socks",
                settings: {
                    auth: "noauth",
                    udp: true
                }
            }
        ],
        outbounds: [
            {
                protocol: "freedom"
            }
        ]
    };

    await ensureFile(ROUTER_CONFIG_FILE, defaultRouterConfig);
    await ensureFile(XRAY_CONFIG_FILE, defaultXrayConfig);
}
