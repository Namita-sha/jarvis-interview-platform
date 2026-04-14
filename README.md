# JARVIS — AI Interview Platform

> A cinematic, Iron Man-inspired AI interview simulator that generates questions, listens to your answers, and gives detailed performance feedback.

**Live Demo → [jarvis-interview-platform.vercel.app](https://jarvis-interview-platform.vercel.app)**

---

## What It Does

- **AI Question Generation** — Gemini AI creates role-specific interview questions based on job title, level, and tech stack
- **Voice Interview** — Speaks questions aloud and records your spoken answers via microphone
- **Performance Evaluation** — AI scores you across 5 categories with detailed written feedback
- **Session History** — All interviews and reports saved to your account
- **JARVIS Intro** — Cinematic boot sequence with speech synthesis on first visit

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + custom HUD theme |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| AI | Google Gemini API (`gemini-2.0-flash`) |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Namita-sha/jarvis-interview-platform.git
cd jarvis-interview-platform
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root folder:

```env
# Gemini AI — get free key at https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase — get from https://console.firebase.google.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Add sound files

Place these two files in `public/sounds/`:
- `jarvis-startup.mp3` — boot/activation sound
- `arc-hum.mp3` — ambient background hum

Free sounds: [freesound.org](https://freesound.org) → search "sci-fi startup" and "electric hum"

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Project Structure

```
src/
├── components/
│   ├── ArcReactor.jsx       # Animated arc reactor logo
│   ├── JarvisIntro.jsx      # Boot sequence + speech intro
│   ├── InterviewCard.jsx    # Dashboard session card
│   ├── Navbar.jsx           # Top navigation
│   └── ProgressRing.jsx     # Circular score display
├── pages/
│   ├── Landing.jsx          # Home / login page
│   ├── Dashboard.jsx        # Session history
│   ├── Setup.jsx            # Configure new interview
│   ├── Interview.jsx        # Live interview session
│   └── Feedback.jsx         # AI evaluation report
├── lib/
│   ├── firebase.js          # Firebase config
│   └── gemini.js            # Gemini AI — questions + evaluation
└── context/
    └── AuthContext.jsx      # Auth state
```

---

## How an Interview Works

```
Setup → AI generates questions → JARVIS reads each question aloud
→ You speak your answer → Mic captures response
→ End session → Gemini evaluates transcript
→ Feedback report with scores saved to Firestore
```

---

## Evaluation Categories

| Category | What's Measured |
|---|---|
| Communication Skills | Clarity and structure of answers |
| Technical Knowledge | Accuracy and depth on the tech stack |
| Problem Solving | Approach and reasoning |
| Cultural & Role Fit | Professionalism and enthusiasm |
| Confidence & Clarity | How clearly you expressed ideas |

Each scored 0–100. Overall score is the average.

---

## Known Limitations

- Gemini free tier: 15 requests/min, limited daily quota — create a new API key if you hit limits
- Speech recognition requires Chrome or Edge for best results
- Microphone permission must be granted in browser settings

---

## Deploy to Vercel

```bash
npm run build
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) and add your `.env` variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## License

MIT — feel free to use, modify, and build on this project.

---

*Built by [Namita](https://github.com/Namita-sha)*