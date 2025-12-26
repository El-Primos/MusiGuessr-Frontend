
# ========================
#  Build Stage
# ========================
FROM node:20 AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
ENV NEXT_PUBLIC_API_BASE="https://backend:8080"
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build

# ========================
#  Runtime Stage
# ========================
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
RUN npm install -g pnpm && pnpm install --prod
EXPOSE 3000
CMD ["pnpm", "start"]
