# Mind Matters - Mental Health Week Activity Hub

An interactive, accessible web platform built for **Mental Health Week** to foster mental wellbeing awareness, vocabulary, and healthy habits through engaging puzzles, habit matching, and evidence-based myth-buster quizzes.

---

## 🌐 Live Public Access

* **Public Web Link**: [https://saad-ibra.github.io/mental-health-week/](https://saad-ibra.github.io/mental-health-week/)
* **Organiser Admin Portal**: [https://saad-ibra.github.io/mental-health-week/admin.html](https://saad-ibra.github.io/mental-health-week/admin.html) *(Restricted access)*

### 📱 Scan to Play on Mobile

Scan this QR code with any smartphone camera to open the activity hub directly:

<div align="center">
  <img src="qr-code.png" alt="Mental Health Week Activity QR Code" width="220" height="220" />
  <p><b>Scan with phone camera to participate</b></p>
</div>

---

## 🌟 Key Features & Modules

### 1. Participant Experience (`index.html`)
* **Demographic Intake**: Simple name, course/department, and optional contact registration.
* **Activity Hub**: Live score tracker, completion badges, and flexible activity selection.
* **Activity 1: Mind Matters Crossword**: 10 clues covering stress, empathy, resilience, and balance with clue-level Lucide icons, hint penalty system, and timer.
* **Activity 2: Mind Matters Match-Up**: Dual-column game pairing 8 daily wellbeing habits (sleep, movement, breathing, screen breaks, etc.) with actionable scientific takeaways.
* **Activity 3: Wellbeing Myth-Buster Quiz**: 8 multiple-choice questions exploring sleep debt, active listening, and stress biology with immediate explanatory insights.
* **Celebration & Support Resources**: Displays score breakdown alongside trusted mental health support hotlines (Campus Counseling, Tele-MANAS, Vandrevala Foundation, KIRAN).

### 2. Organiser Admin Dashboard (`admin.html`)
* **Passcode Protected**: Secure admin authentication with custom password management.
* **KPI Metrics**: Real-time counter of total participants, average score, top score, and completion rate.
* **Champion Spotlight**: Highlights the #1 ranked participant with course and activity breakdown.
* **Category Leaderboards**: Top scorers in Crossword, Match-Up, and Quiz.
* **Filterable Leaderboard Table**: Live search bar (by participant name or course) and department filter.
* **1-Click CSV Export**: Formatted for Excel / Google Sheets.
* **Printable QR Code Flyer**: Generates high-res QR code for classroom/hall posters.
* **Multi-Device Cloud Sync**: Webhook integration with Google Sheets for automatic multi-phone synchronization.

---

## 🛠️ Project Structure

```
mental-health-week/
├── index.html              # Main participant experience
├── admin.html              # Organiser dashboard & leaderboard
├── qr-code.png             # Public access QR code image
├── README.md               # Documentation & deployment guide
├── css/
│   ├── design-tokens.css   # Calming Teal/Emerald palette & dark/light theme tokens
│   ├── base.css            # Base layout, typography, navigation, footer
│   ├── components.css      # Glassmorphic cards, buttons, badges, tables, modals
│   └── games.css           # Crossword grid, Match-Up board, Quiz card layouts
└── js/
    ├── app.js              # Application coordinator & routing
    ├── admin.js            # Leaderboard logic, CSV export, QR generator
    ├── crossword.js        # Crossword puzzle engine
    ├── matchup.js          # Match-Up game engine
    ├── quiz.js             # Wellbeing quiz engine
    ├── data.js             # Word lists, matching pairs, quiz questions & explanations
    └── state.js            # Session state, localStorage, and webhook sync
```

---

## 🚀 Local Development

To run the project locally with the included native Node.js static server:

```powershell
node server.cjs
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
