# Deployment Guide

## Prerequisites

- Node.js 14+ installed
- Instagram Business Account
- Facebook Developer App with Instagram Graph API access
- HTTPS-enabled domain (for webhook verification)

## Instagram Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Graph API product
4. Configure Instagram Basic Display

### 2. Get Access Token

1. In your Facebook App, go to Instagram > Basic Display
2. Generate a long-lived access token
3. Save this token - you'll need it for `INSTAGRAM_ACCESS_TOKEN`

### 3. Get Business Account ID

1. Make a request to the Graph API:
```bash
curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_ACCESS_TOKEN"
```
2. Find your Instagram Business Account ID in the response

### 4. Configure Webhooks

1. In Facebook App settings, go to Webhooks
2. Add a new webhook subscription
3. Set callback URL: `https://yourdomain.com/webhook`
4. Set verify token: A secure random string (save for `INSTAGRAM_VERIFY_TOKEN`)
5. Subscribe to fields:
   - `comments`
   - `mentions`
   - `story_insights`
   - `messages`

## Server Deployment

### Option 1: Traditional VPS (DigitalOcean, Linode, etc.)

1. Clone the repository:
```bash
git clone https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm.git
cd Axtronet-empleos---Instagram-Cm
```

2. Install dependencies:
```bash
npm install --production
```

3. Create `.env` file:
```bash
cp .env.example .env
nano .env
```

4. Configure environment variables:
```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_VERIFY_TOKEN=your_secure_random_string
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
PORT=3000
NODE_ENV=production
AUTO_INVITE_ENABLED=true
MIN_ENGAGEMENT_SCORE=7
```

5. Install PM2 for process management:
```bash
npm install -g pm2
```

6. Start the application:
```bash
pm2 start src/index.js --name instagram-cm
pm2 save
pm2 startup
```

7. Configure Nginx as reverse proxy:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. Enable HTTPS with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  instagram-cm:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./data:/app/data
```

3. Deploy:
```bash
docker-compose up -d
```

### Option 3: Heroku

1. Install Heroku CLI
2. Create Heroku app:
```bash
heroku create axtronet-instagram-cm
```

3. Set environment variables:
```bash
heroku config:set INSTAGRAM_ACCESS_TOKEN=your_token
heroku config:set INSTAGRAM_APP_SECRET=your_secret
heroku config:set INSTAGRAM_VERIFY_TOKEN=your_verify_token
heroku config:set INSTAGRAM_BUSINESS_ACCOUNT_ID=your_id
```

4. Deploy:
```bash
git push heroku main
```

### Option 4: Vercel/Netlify (Serverless)

Note: This application is designed for persistent server deployment. For serverless, you'll need to:
- Convert to serverless functions
- Use external database instead of file storage
- Handle webhook retry logic

## Post-Deployment

### 1. Verify Webhook

Test that your webhook is accessible:
```bash
curl "https://yourdomain.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test"
```

Should return: `test`

### 2. Test Health Endpoint

```bash
curl https://yourdomain.com/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Monitor Logs

**PM2:**
```bash
pm2 logs instagram-cm
```

**Docker:**
```bash
docker-compose logs -f
```

**Heroku:**
```bash
heroku logs --tail
```

## Monitoring & Maintenance

### Application Monitoring

1. Set up monitoring with PM2:
```bash
pm2 install pm2-logrotate
```

2. Configure alerts for crashes

### Database Backup

Regularly backup `data/candidates.json`:
```bash
# Add to cron
0 0 * * * cp /path/to/data/candidates.json /path/to/backups/candidates-$(date +\%Y\%m\%d).json
```

### Token Refresh

Instagram access tokens expire. Set up automatic refresh:
1. Use refresh token to get new access token
2. Update environment variable
3. Restart application

### Scaling

For high traffic:
1. Migrate to PostgreSQL/MongoDB for data storage
2. Add Redis for caching
3. Use load balancer for multiple instances
4. Implement rate limiting

## Troubleshooting

### Webhook Not Receiving Events

1. Check Facebook App webhook subscription is active
2. Verify callback URL is HTTPS
3. Check verify token matches
4. Review server logs for errors

### Access Token Expired

1. Generate new long-lived token
2. Update `INSTAGRAM_ACCESS_TOKEN` in `.env`
3. Restart application

### Rate Limiting

Instagram has rate limits:
- Be respectful with API calls
- Implement exponential backoff
- Cache responses when possible

## Security Best Practices

1. Never commit `.env` file
2. Use strong verify token
3. Validate webhook signatures
4. Implement rate limiting
5. Keep dependencies updated
6. Use HTTPS only
7. Restrict API access with authentication
