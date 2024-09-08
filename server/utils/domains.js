import { DOMAINS_FILE } from "../constants";
import fs from 'fs/promises';

export async function saveDomains(domains) {
    await fs.writeFile(DOMAINS_FILE, domains.join('\n'));
}

export async function loadDomains() {
    try {
        const data = await fs.readFile(DOMAINS_FILE, 'utf8');
        return data.split('\n').filter(domain => domain.trim());
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}