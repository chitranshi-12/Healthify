# Healthify 🌿

Healthify is a full-stack medicine reminder and chronic condition wellness web application. It combines doctor-aligned medicine scheduling, interactive in-app alarms, biometric tracking, and personalized diet & exercise plans tailored to conditions like Diabetes, Hypertension, PCOS, Thyroid disorders, High Cholesterol, Asthma, and more.

## Features

1. **Authentication & User Management**
   - Live form validation: email format, password strength (>=8 characters with letters & numbers), password confirmation, duplicate email detection.
   - Secure passwords hashed with `bcryptjs`.
   - JWT tokens with HTTP-only cookies and `Authorization: Bearer` support.
   - Remember Me (30-day session) and automatic 401 token expiration handling.
   - Rate limiting on login attempts to thwart brute force attacks.
   - Forgot & Reset Password flows (with dev token display and server link printing).
   - Profile management: update name, change password, and complete cascading account deletion.

2. **Core Medicine Reminders**
   - Comprehensive schedules: dose, form (tablet, capsule, syrup, injection, drops, inhaler), times per day (clock HH:MM), meal timing (before food, after food, empty stomach), and days of week.
   - Today's interactive timeline with Taken, Skip, and Snooze (+10m) buttons.
   - Overdue dosage warning indicators.
   - In-app alarm popup with Web Audio synthetic harmonic chime and browser desktop notifications.
   - Stock level tracking with low-stock refill warnings (≤5 pills).
   - Prescription OCR scanner using Gemini (`gemini-3.8-flash`) with mandatory patient verification of every field before saving.
   - Condition-based care checklists (blood sugar checks, foot inspection, morning/evening BP, inhaler checks).

3. **Condition-Based Diet Plans**
   - Clinical knowledge base covering DASH, Low GI, anti-inflammatory, and high soluble fiber rules.
   - Multi-condition merging (e.g., Diabetes + Hypertension).
   - Renal safety guardrail: automatically routes kidney conditions to physician consultation rather than automated advice.
   - 7-day meal plan with breakfast, mid-morning snack, lunch, evening snack, and dinner, with calories, macros, and clinical reasoning.
   - Daily meal checklist, 1-tap meal swaps, and a weekly grocery list with checklist.
   - AI generation via Gemini with robust fallback templates from the knowledge base.

4. **Condition-Based Exercise Plans**
   - Customized to user goals, fitness level, time available, and diagnosed conditions.
   - Physiologist cautions: prevents heavy Valsalva maneuvers for hypertension/cardiac; enforces pre/post glucose checks for diabetes; includes rescue inhaler reminders for asthma.
   - Guided Workout Player with active timer, rest countdowns, next exercise preview, form how-tos, common mistakes to avoid, easier options, and celebratory confetti upon completion.

5. **Biometrics & Vitals Tracking**
   - Blood Pressure (systolic/diastolic), Blood Sugar (mg/dL + timing), Body Weight (kg), and Resting Pulse (bpm).
   - Clinical range evaluation (Normal, Elevated, High, Critical, Low) with emergency red flag alerts.
   - Historical trend sparkline charts and searchable reading logs.

6. **Dashboard & Habit Tracking**
   - Daily progress ring, next dose countdown, 8-glass water tracker with quick +250ml logging, adherence streaks, daily health tips, and emergency red flag symptom guidance.

---

## Environment Variables

Configure your environment in `.env` (refer to `.env.example`):

```bash
# GEMINI_API_KEY: Required for Gemini AI generation & prescription scanning.
# AI Studio automatically injects this from user secrets at runtime.
GEMINI_API_KEY="your-gemini-api-key"

# JWT_SECRET: Secret key for signing JSON Web Tokens
JWT_SECRET="your-secure-jwt-secret-key"

# APP_URL: The URL where this applet is hosted
APP_URL="http://localhost:3000"

PORT=3000
```

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The Express server boots at `http://localhost:3000`, mounting SQLite and the Vite client.

3. **Production build:**
   ```bash
   npm run build
   npm start
   ```

---

## Pre-seeded Demo Credentials

You can test the application immediately using the pre-seeded demo account:

- **Email:** `demo@healthify.app`
- **Password:** `Demo@1234`
- Pre-loaded with:
  - Conditions: Diabetes Type 2 & Hypertension
  - Active medicines: Metformin 500mg, Telmisartan 40mg (low-stock alert test), Omega-3
  - Care checklists: Fasting blood glucose, morning BP cuff check, evening foot inspection
  - Historical vitals (BP, glucose, weight, pulse)
