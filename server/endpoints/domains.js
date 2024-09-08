import { CACHE_DIR } from "../constants";
import { loadDomains, saveDomains } from "../utils/domains";
import fs from 'fs/promises';

export async function getDomains(req, res) {
    try {
        const domains = await loadDomains();
        res.json(domains);
    } catch (error) {
        console.error('Error loading domains:', error);
        res.status(500).json({ error: 'An error occurred while loading domains' });
    }
}

export async function postDomains (req, res) {
    const { domains } = req.body;
    try {
        await saveDomains(domains);
        res.json({ message: 'Domains saved successfully' });
    } catch (error) {
        console.error('Error saving domains:', error);
        res.status(500).json({ error: 'An error occurred while saving domains' });
    }
}

export async function postClearDomainsCache(req, res) {
    try {
        await fs.rm(CACHE_DIR, { recursive: true, force: true });
        await fs.mkdir(CACHE_DIR);
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'An error occurred while clearing cache' });
    }
}