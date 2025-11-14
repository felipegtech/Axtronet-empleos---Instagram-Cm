# Quick Start Guide

## Get Started in 5 Minutes

### 1. Installation

```bash
# Clone repository
git clone https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm.git
cd Axtronet-empleos---Instagram-Cm

# Install dependencies
npm install
```

### 2. Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Instagram credentials:
```env
INSTAGRAM_ACCESS_TOKEN=your_token_here
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_VERIFY_TOKEN=your_verify_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
PORT=3000
NODE_ENV=development
AUTO_INVITE_ENABLED=true
MIN_ENGAGEMENT_SCORE=7
```

### 3. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 4. Test the Application

```bash
# Run all tests
npm test

# Run linter
npm run lint
```

### 5. Verify It's Working

Open another terminal and test the health endpoint:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","timestamp":"..."}
```

## Using the System

### Testing Webhook Locally

For local development, you need to expose your localhost to the internet. Use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose local port 3000
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and use it in Facebook App webhook settings.

### API Examples

**Get all candidates:**
```bash
curl http://localhost:3000/api/candidates
```

**Get engagement statistics:**
```bash
curl http://localhost:3000/api/stats/engagement
```

**Manually invite a candidate:**
```bash
curl -X POST http://localhost:3000/api/candidates/CANDIDATE_ID/invite
```

**Post a job offer:**
```bash
curl -X POST http://localhost:3000/api/jobs/post \
  -H "Content-Type: application/json" \
  -d '{"message": "Buscamos desarrollador Full Stack. Envía DM!", "imageUrl": "https://example.com/job.jpg"}'
```

## How It Works

1. **User Comments on Instagram** → Webhook receives event
2. **NLP Analyzes Comment** → Detects sentiment and intent
3. **System Responds** → Sends automatic reply
4. **Tracks Engagement** → Updates candidate score
5. **Auto-Invites** → Sends invitation if score ≥ threshold

## Engagement Scoring

Each interaction adds points:
- Comment: 2 points (+1 if positive sentiment)
- Mention: 3 points (+2 if job-related keywords)
- DM: 4 points (+3 if shows interest)
- Story view: 1 point

When a candidate reaches 7+ points (configurable), they're automatically invited!

## Next Steps

1. Review the [API Documentation](docs/API.md)
2. Follow the [Deployment Guide](docs/DEPLOYMENT.md) for production
3. Customize response templates in `src/services/responseService.js`
4. Adjust NLP keywords in `src/services/nlpService.js`

## Common Issues

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**Webhook not receiving events:**
- Ensure your server is publicly accessible (use ngrok for local dev)
- Verify Instagram webhook subscription is active
- Check that verify token matches

**Tests failing:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

## Support

- 📖 [README.md](README.md) - Full documentation
- 🔌 [API.md](docs/API.md) - API reference
- 🚀 [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
- 💬 [Issues](https://github.com/felipegtech/Axtronet-empleos---Instagram-Cm/issues) - Report bugs

---

**Happy Recruiting! 🎉**
