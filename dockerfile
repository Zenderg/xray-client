FROM node:16 AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:16
WORKDIR /app

RUN apt-get update && apt-get install -y dnsutils whois ipcalc iprange wget unzip

RUN wget -O xray.zip https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip && \
    unzip xray.zip && \
    mv xray /usr/local/bin/ && \
    chmod +x /usr/local/bin/xray && \
    rm xray.zip

RUN wget -O subfinder.zip https://github.com/projectdiscovery/subfinder/releases/download/v2.6.6/subfinder_2.6.6_linux_amd64.zip && \
    unzip subfinder.zip && \
    mv subfinder /usr/local/bin/ && \
    chmod +x /usr/local/bin/subfinder && \
    rm subfinder.zip

COPY server/package*.json ./
RUN npm install
COPY server/ ./

COPY --from=client-builder /app/client/dist ./public

ENV CONFIG_DIR=/app/config

EXPOSE 3000
EXPOSE 12345

CMD ["node", "app.js"]
