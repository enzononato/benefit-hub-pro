# 1. Constrói o site (Build)
FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# --- SUAS CHAVES DO SUPABASE (Substitua abaixo!) ---
ENV VITE_SUPABASE_URL="https://wyhlezxtfhoolrvuqhfy.supabase.co"
ENV VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aGxlenh0Zmhvb2xydnVxaGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDQ0MDIsImV4cCI6MjA4MDAyMDQwMn0.ThShgHu7Pj5BUl-quRjIgybo8k0864rT3nLW7-Tgp2I"
# ---------------------------------------------------

RUN npm run build

# 2. Serve o site (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração para React Router (não quebrar ao atualizar página)
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
