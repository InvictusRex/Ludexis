# The build stages run on the CI machine's own architecture: building Next.js under arm64 emulation crashes
# (SIGILL) and is slow. The output is plain JavaScript, so only the runtime stage is per platform.
# (The traced sharp binary matches the build machine, but sharp never loads: images are unoptimized.)
FROM --platform=$BUILDPLATFORM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Build tooling (Tailwind, TypeScript) is needed to build; only the standalone output reaches the runtime image.
RUN npm ci

FROM --platform=$BUILDPLATFORM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Relative URLs: the bundled proxy serves the API and the web app on one origin, so one image fits any host.
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_MEDIA_URL=/media
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
