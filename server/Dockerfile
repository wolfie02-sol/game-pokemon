FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY scripts ./scripts
COPY admin.html ./
ENV PORT=8787 DB_PATH=/app/data/rewards.db
VOLUME /app/data
EXPOSE 8787
CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
