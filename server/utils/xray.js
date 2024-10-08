import { exec } from 'child_process';
import { wss } from "../providers.js";
import { XRAY_CONFIG_FILE } from '../constants.js';

let xrayProcess = null;

export function startXray() {
    if (xrayProcess) {
        xrayProcess.kill();
    }
    xrayProcess = exec(`xray run -config ${XRAY_CONFIG_FILE}`);
    xrayProcess.stdout.on('data', (data) => {
        console.log(`Xray stdout: ${data}`);
        broadcastXrayStatus('running');
    });
    xrayProcess.stderr.on('data', (data) => {
        console.error(`Xray stderr: ${data}`);
        broadcastXrayStatus('error');
    });
    xrayProcess.on('close', (code) => {
        console.log(`Xray process exited with code ${code}`);
        broadcastXrayStatus('stopped');
    });
}

export function stopXray() {
    if (xrayProcess) {
        xrayProcess.kill();
        xrayProcess = null;
    }
    broadcastXrayStatus('stopped');
}

export function broadcastXrayStatus(status) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'xrayStatus', status }));
        }
    });
}

export function getXrayProcess() {
    return xrayProcess
}