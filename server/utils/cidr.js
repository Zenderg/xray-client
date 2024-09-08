import { CACHE_DIR } from "../constants";
import { execPromise } from "./exec-promise";
import ipaddr from 'ipaddr.js';
import path from 'path';

export async function getCIDR(ip) {
    try {
        const whoisData = await execPromise(`whois ${ip}`);
        const cidrMatch = whoisData.match(/route:\s+(\d+\.\d+\.\d+\.\d+\/\d+)/);
        if (cidrMatch) {
            return cidrMatch[1];
        }
        const inetNumMatch = whoisData.match(/inetnum:\s+(\d+\.\d+\.\d+\.\d+)\s+-\s+(\d+\.\d+\.\d+\.\d+)/);
        if (inetNumMatch) {
            const startIp = ipaddr.parse(inetNumMatch[1]);
            const endIp = ipaddr.parse(inetNumMatch[2]);
            return ipaddr.fromPrefixLen(ipaddr.parse(ip).prefixLengthFromSubnetMask(endIp.subtract(startIp).mask())).toString();
        }
        return null;
    } catch (error) {
        console.error(`Error getting CIDR for IP ${ip}:`, error);
        return null;
    }
}

export function mergeCIDRs(cidrs) {
    // Сортируем CIDR по IP-адресу
    const sortedCIDRs = cidrs.sort((a, b) => {
        const ipA = ipaddr.parse(a.split('/')[0]);
        const ipB = ipaddr.parse(b.split('/')[0]);
        for (let i = 0; i < 4; i++) {
            if (ipA.octets[i] !== ipB.octets[i]) {
                return ipA.octets[i] - ipB.octets[i];
            }
        }
        return 0;
    });

    const mergedCIDRs = [];
    
    for (const cidr of sortedCIDRs) {
        if (mergedCIDRs.length === 0) {
            mergedCIDRs.push(cidr);
            continue;
        }
        
        const lastCIDR = mergedCIDRs[mergedCIDRs.length - 1];
        const [lastIP, lastPrefix] = lastCIDR.split('/');
        const [currentIP, currentPrefix] = cidr.split('/');
        
        const lastNetwork = ipaddr.parseCIDR(lastCIDR);
        const currentNetwork = ipaddr.parseCIDR(cidr);
        
        if (ipaddr.parse(currentIP).match(lastNetwork)) {
            if (parseInt(currentPrefix) < parseInt(lastPrefix)) {
                mergedCIDRs[mergedCIDRs.length - 1] = cidr;
            }
        } else {
            mergedCIDRs.push(cidr);
        }
    }
    
    return mergedCIDRs;
}

export async function getCachedCIDRs(domain) {
    const cacheFile = path.join(CACHE_DIR, `${domain}.json`);
    try {
        const data = await fs.readFile(cacheFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

export async function saveCachedCIDRs(domain, cidrs) {
    const cacheFile = path.join(CACHE_DIR, `${domain}.json`);
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(cidrs));
}