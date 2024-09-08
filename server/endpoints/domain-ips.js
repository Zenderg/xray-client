import { getCachedCIDRs, mergeCIDRs, saveCachedCIDRs } from "../utils/cidr";
import { execPromise } from "../utils/exec-promise";
import { broadcastProgress } from "../utils/progress";

export async function postFindCidrs(req, res) {
    const { domains, useCache } = req.body;
    const results = {};
    let allCIDRs = [];

    try {
        const totalDomains = domains.length;
        let processedDomains = 0;

        for (const domain of domains) {
            if (useCache) {
                const cachedCIDRs = await getCachedCIDRs(domain);
                if (cachedCIDRs) {
                    results[domain] = cachedCIDRs;
                    allCIDRs = [...allCIDRs, ...cachedCIDRs];
                    processedDomains++;
                    broadcastProgress(processedDomains, totalDomains);
                    continue;
                }
            }

            const ips = await execPromise(`dig +short ${domain}`);
            const ipList = ips.split('\n').filter(ip => ip && !ip.endsWith('.'));

            const subdomains = await execPromise(`subfinder -d ${domain} -silent`);

            const subdomainIps = await Promise.all(
                subdomains.split('\n').filter(Boolean).map(async (subdomain) => {
                    const subIps = await execPromise(`dig +short ${subdomain}`);
                    return { subdomain, ips: subIps.split('\n').filter(ip => ip && !ip.endsWith('.')) };
                })
            );

            const allIps = [...new Set([...ipList, ...subdomainIps.flatMap(sub => sub.ips)])];
            const cidrs = await Promise.all(allIps.map(getCIDR));
            const mergedCIDRs = mergeCIDRs(cidrs.filter(Boolean));

            const result = {
                ips: ipList,
                cidrs: mergedCIDRs,
                subdomains: subdomainIps
            };

            allCIDRs = [...allCIDRs, ...mergedCIDRs];

            results[domain] = result;
            await saveCachedCIDRs(domain, result);

            processedDomains++;
            broadcastProgress(processedDomains, totalDomains);
        }

        const uniqueCIDRs = [...new Set(allCIDRs)];
        res.json(uniqueCIDRs);
    } catch (error) {
        console.error('Error during lookup:', error);
        res.status(500).json({ error: 'An error occurred during lookup' });
    }
};
