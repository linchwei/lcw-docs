FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/shadcn/package.json ./packages/shadcn/
COPY packages/shadcn-shared-ui/package.json ./packages/shadcn-shared-ui/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @lcw-doc/core build
RUN cd apps/server && rm -rf dist && npx tsc -p tsconfig.build.json --incremental false
RUN pnpm deploy --filter @lcw-doc/server --prod --legacy /app/deploy

FROM node:20-alpine AS production
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build /app/deploy .
ENV NODE_ENV=production
EXPOSE 8082
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
