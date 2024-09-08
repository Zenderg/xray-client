import express from 'express';
import { app, server } from './providers.js';
import { getDomains, postClearDomainsCache, postDomains } from './endpoints/domains.js';
import { getCidrs, postFindCidrs } from './endpoints/domain-ips.js';
import { getVpnConfig, getVpnStatus, postRestartVpn, postStartVpn, postStopVpn, postVpnConfig } from './endpoints/vpn.js';
import { startXray } from './utils/xray.js';
import { getRouterConfig, postApplyRedirect, postRouterConfig } from './endpoints/router.js';

const port = 3000;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('public'));
app.use(express.json());

app.get('/domains', getDomains);
app.post('/domains', postDomains);
app.post('/clear-cache', postClearDomainsCache);

app.post('/lookup', postFindCidrs);
app.get('/cidrs', getCidrs)

app.get('/vpn-config', getVpnConfig);
app.post('/vpn-config', postVpnConfig);

app.post('/start-vpn', postStartVpn);
app.post('/stop-vpn', postStopVpn);
app.post('/restart-vpn', postRestartVpn);

app.get('/xray-status', getVpnStatus);

app.post('/apply-redirect', postApplyRedirect);
app.get('/router-config', getRouterConfig);
app.post('/router-config', postRouterConfig);

startXray();

server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});