import express from 'express';
import { app, server } from './providers';
import { getDomains, postClearDomainsCache, postDomains } from './endpoints/domains';
import { postFindCidrs } from './endpoints/domain-ips';
import { getVpnConfig, getVpnStatus, postRestartVpn, postStartVpn, postStopVpn, postVpnConfig } from './endpoints/vpn';

const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/domains', getDomains);
app.post('/domains', postDomains);
app.post('/clear-cache', postClearDomainsCache);

app.post('/lookup', postFindCidrs);

app.get('/vpn-config', getVpnConfig);
app.post('/vpn-config', postVpnConfig);

app.post('/start-vpn', postStartVpn);
app.post('/stop-vpn', postStopVpn);
app.post('/restart-vpn', postRestartVpn);

app.get('/xray-status', getVpnStatus);

startXray();

server.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});