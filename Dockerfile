FROM node:20-alpine AS deps
WORKDIR /application
COPY package*.json ./
# --include=dev so an ambient NODE_ENV=production can't strip @types/* and typescript,
# which the build stage needs. The runtime stage installs prod-only separately.
RUN npm ci --include=dev

FROM deps AS build
WORKDIR /application
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /application
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /application/dist ./dist
COPY --from=build /application/src/templates ./src/templates

EXPOSE 5008

CMD ["node", "dist/server.js"]
