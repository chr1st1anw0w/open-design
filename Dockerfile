# syntax=docker/dockerfile:1

FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm --filter @open-design/daemon build

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV OD_DATA_DIR=/app/data
ENV OD_PORT=7456
ENV OD_BIND_HOST=0.0.0.0

# Install dependencies needed for some skills or agents if any
# For now, just node is enough as we focus on the daemon + web

COPY --from=build /app/package.json /app/
COPY --from=build /app/pnpm-workspace.yaml /app/
COPY --from=build /app/apps/daemon/package.json /app/apps/daemon/
COPY --from=build /app/apps/daemon/dist /app/apps/daemon/dist
COPY --from=build /app/apps/web/out /app/apps/web/out
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/daemon/node_modules /app/apps/daemon/node_modules

# Copy skills and design-systems as they are needed by the daemon
COPY --from=build /app/skills /app/skills
COPY --from=build /app/design-systems /app/design-systems

EXPOSE 7456

CMD ["node", "apps/daemon/dist/cli.js", "--no-open", "--port", "7456", "--host", "0.0.0.0"]
