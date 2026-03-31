# Deploy AISafe on Railway

Step-by-step guide to deploy AISafe as a production SaaS on Railway.

## Architecture on Railway

```
Railway Project: AISafe
├── PostgreSQL (database)
├── Redis (cache)
├── Server (Node.js API)    → server/
└── Client (React static)   → client/
```

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Empty Project**
3. Name it `aisafe`

## Step 2: Add PostgreSQL

1. Click **+ New** → **Database** → **Add PostgreSQL**
2. Railway auto-creates the database and sets `DATABASE_URL`
3. No configuration needed — the server reads `DATABASE_URL` automatically

## Step 3: Add Redis

1. Click **+ New** → **Database** → **Add Redis**
2. Railway sets `REDIS_URL` automatically
3. No configuration needed

## Step 4: Deploy the Server (API)

1. Click **+ New** → **GitHub Repo** → Select your `AI-Governance` repo
2. In the service settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/start.js`

3. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(generate: `openssl rand -hex 32`)* |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | *(set after deploying client, e.g. `https://aisafe-client.up.railway.app`)* |

4. Railway auto-links `DATABASE_URL` and `REDIS_URL` from your PostgreSQL and Redis services. If not:
   - Click **Variables** → **Reference** → Select `DATABASE_URL` from PostgreSQL
   - Click **Variables** → **Reference** → Select `REDIS_URL` from Redis

5. Click **Deploy** — the server will:
   - Install dependencies
   - Run database migrations automatically
   - Seed 10 Indian regulatory frameworks (63 requirements)
   - Seed 6 policy templates + 3 assessment templates
   - Start the API

6. Note the server URL (e.g., `https://aisafe-server-production.up.railway.app`)

## Step 5: Deploy the Client (Frontend)

1. Click **+ New** → **GitHub Repo** → Select your `AI-Governance` repo again
2. In the service settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve dist -s -l $PORT`

3. Add this **Environment Variable**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-SERVER-URL.up.railway.app/api` |

4. Click **Deploy**

5. Note the client URL (e.g., `https://aisafe-client-production.up.railway.app`)

## Step 6: Update CORS

Go back to your **Server** service and update:

| Variable | Value |
|----------|-------|
| `CORS_ORIGIN` | `https://YOUR-CLIENT-URL.up.railway.app` |

Redeploy the server.

## Step 7: Verify

1. Open your client URL
2. Register a new account
3. You should see the Dashboard
4. Go to **Compliance** → Click any framework → Click **Initialize Framework**
5. Try the **AI Advisor** — ask "What is DPDP Act?"

## Custom Domain (Optional)

1. In Railway, go to your Client service → **Settings** → **Domains**
2. Click **+ Custom Domain** → Enter `app.aisafe.in` (or your domain)
3. Add the CNAME record to your DNS
4. Update `CORS_ORIGIN` on the server to match

## Environment Variables Reference

### Server (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (auto-set by Railway) | `postgresql://...` |
| `JWT_SECRET` | Secret for JWT signing | `a1b2c3d4...` (32+ chars) |
| `CORS_ORIGIN` | Frontend URL | `https://app.aisafe.in` |
| `NODE_ENV` | Environment | `production` |

### Server (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection (auto-set) | - |
| `JWT_EXPIRES_IN` | Token expiry | `24h` |
| `MAX_FILE_SIZE` | Upload limit in bytes | `10485760` |
| `EMAIL_HOST` | SMTP host | - |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP user | - |
| `EMAIL_PASS` | SMTP password | - |

### Client

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Server API URL | `https://server.up.railway.app/api` |

## Estimated Railway Cost

| Service | Estimated/month |
|---------|----------------|
| PostgreSQL | ~$5 (Hobby) |
| Redis | ~$5 (Hobby) |
| Server | ~$5 (Hobby) |
| Client | ~$5 (Hobby) |
| **Total** | **~$20/month** |

With Railway Pro plan you get $10 free credits, so effective cost is ~$10/month to start.

## Troubleshooting

**Server crashes on start**: Check `DATABASE_URL` is linked. Click server → Logs to see the error.

**CORS errors**: Make sure `CORS_ORIGIN` exactly matches your client URL (no trailing slash).

**Blank page on client**: Check `VITE_API_URL` points to your server. Must include `/api` at the end.

**Migrations fail**: Check PostgreSQL is running. Try redeploying the server.
