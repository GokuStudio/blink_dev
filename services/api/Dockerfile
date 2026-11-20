FROM node:22-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY services/api/package.json services/api/package.json
COPY apps/blink-companion/package.json apps/blink-companion/package.json
RUN npm ci
COPY packages/contracts packages/contracts
COPY services/api services/api
RUN npm run build --workspace=@blink/contracts && npm run build --workspace=@blink/api

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /workspace
COPY --from=build /workspace /workspace
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace=@blink/api"]
