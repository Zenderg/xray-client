import { getAllCidrs, getCachedCIDRs, getCIDR, isSpecialIp, mergeCIDRs, saveCachedCIDRs } from "../utils/cidr.js";
import { execPromise } from "../utils/exec-promise.js";
import { broadcastProgress } from "../utils/progress.js";

export async function postFindCidrs(req, res) {
    const { domains, useCache } = req.body;
    let allCIDRs = [];

    try {
        const totalDomains = domains.length;
        let processedDomains = 0;

        for (const domain of domains) {
            console.log("----------");
            console.log(domain);
            console.log("----------");

            if (useCache) {
                const cachedCIDRs = await getCachedCIDRs(domain);

                if (cachedCIDRs) {
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

            let allIps = [...new Set([...ipList, ...subdomainIps.flatMap(sub => sub.ips)])];
            allIps = allIps.filter(ip => !isSpecialIp(ip))
            const cidrs = await Promise.all(allIps.map(getCIDR));
            const mergedCIDRs = mergeCIDRs(cidrs.filter(Boolean));

            allCIDRs = [...allCIDRs, ...mergedCIDRs];

            await saveCachedCIDRs(domain, mergedCIDRs);

            console.log(`ips: ${ipList.join(', ')}`)
            console.log(`cidrs: ${mergedCIDRs.join(', ')}`)
            console.log("Subdomains:")
            subdomainIps.forEach((s) => {
                console.log(`${s.subdomain}: ${s.ips.join(', ')}`)
            })

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

export async function getCidrs(req, res) {
    const allCidrs = await getAllCidrs()

    res.json(allCidrs);
}
