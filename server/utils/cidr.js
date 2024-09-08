import { CACHE_DIR } from "../constants.js";
import { execPromise } from "./exec-promise.js";
import ipaddr from 'ipaddr.js';
import path from 'path';
import fs from 'fs/promises';
import { loadDomains } from "./domains.js";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getCIDR(ip) {
    const maxRetries = 3;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await delay(baseDelay * Math.pow(2, attempt));

            const whoisData = await execPromise(`whois ${ip}`, { encoding: 'utf8', timeout: 10000 });
            
            const cidrMatch = whoisData.match(/(?:CIDR|route):\s*(\d+\.\d+\.\d+\.\d+\/\d+)/i);
            if (cidrMatch) {
                return cidrMatch[1];
            }
            
            const rangeMatch = whoisData.match(/(?:inetnum|NetRange):\s*(\d+\.\d+\.\d+\.\d+)\s*-\s*(\d+\.\d+\.\d+\.\d+)/i);
            if (rangeMatch) {
                const startIp = ipaddr.parse(rangeMatch[1]);
                const endIp = ipaddr.parse(rangeMatch[2]);
                return calculateCIDR(startIp, endIp);
            }
            
            return getConservativeCIDR(ip);
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed for IP ${ip}:`, error);
            if (attempt === maxRetries - 1) {
                console.error(`All attempts failed for IP ${ip}. Using conservative approach.`);
                return getConservativeCIDR(ip);
            }
        }
    }
}

function calculateCIDR(startIp, endIp) {
    const diffBits = ipaddr.parse(startIp).toByteArray().map((byte, i) => byte ^ endIp.toByteArray()[i]);
    const prefixLength = 32 - Math.ceil(Math.log2(diffBits.reduce((a, b) => a + b + 1, 0)));
    return `${startIp.toString()}/${prefixLength}`;
}

function getConservativeCIDR(ip) {
    const parsedIp = ipaddr.parse(ip);
    const octets = parsedIp.toByteArray();
    
    if (octets[0] >= 1 && octets[0] <= 126) return `${octets[0]}.0.0.0/8`;  // Class A
    if (octets[0] >= 128 && octets[0] <= 191) return `${octets[0]}.${octets[1]}.0.0/16`;  // Class B
    if (octets[0] >= 192 && octets[0] <= 223) return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;  // Class C
    
    return `${ip}/32`;  // Если не попадает в известные классы, возвращаем /32
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

export function isSpecialIp(ip) {
    const specialRanges = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./
    ];

    return specialRanges.some(range => range.test(ip));
}

export async function getAllCidrs(req, res) {
    const domains = await loadDomains();    
    const cidrs = await Promise.all(domains.map(getCachedCIDRs))

    return [...new Set(cidrs.flat())];
}