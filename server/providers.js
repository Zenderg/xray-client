import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

export const app = express();
export const server = http.createServer(app);
export const wss = new WebSocketServer({ server });