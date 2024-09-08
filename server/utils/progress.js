import { wss } from "../providers";

export function broadcastProgress(current, total) {
    const progress = Math.round((current / total) * 100);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'progress', progress }));
        }
    });
}