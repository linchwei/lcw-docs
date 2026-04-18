FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/react/package.json ./packages/react/
COPY packages/shadcn/package.json ./packages/shadcn/
COPY packages/shadcn-shared-ui/package.json ./packages/shadcn-shared-ui/
COPY apps/server/package.json ./apps/server/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY . .
RUN pnpm --filter @lcw-doc/core build
RUN cd apps/server && rm -rf dist && npx tsc -p tsconfig.build.json --incremental false

FROM base AS production
WORKDIR /app
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/packages/core/build ./packages/core/build
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production
WORKDIR /app/apps/server
EXPOSE 8082
CMD ["node", "dist/main.js"]
