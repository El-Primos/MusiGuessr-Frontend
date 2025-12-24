Frontend application for MusiGuessr - A song guessing game where players guess songs from short previews and compete on leaderboards.

## Tech Stack

- **React 19**
- **Next.js 15**
- **TailwindCSS 4**

---

## How to Run the Project

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/El-Primos/MusiGuessr-Frontend.git
cd MusiGuessr-Frontend/musiguessr-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

The application will start at: `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
npm start
# or
yarn build
yarn start
```

### 6. Run Linter
```bash
npm run lint
# or
yarn lint
```

---

## Git Workflow & Best Practices

### Branch Types

- **`main`** - Production-ready code (protected, no direct commits)
- **`develop`** - Integration branch for features
- **`feature/*`** - New features (e.g., `feature/game-interface`)
- **`bugfix/*`** - Bug fixes (e.g., `bugfix/audio-player`)
- **`hotfix/*`** - Urgent production fixes

### Basic Git Workflow

#### 1. Create a New Branch
Always create a branch from `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

#### 2. Branch Naming Convention
Use descriptive names with prefixes:
```bash
feature/leaderboard-ui
feature/song-player
bugfix/responsive-layout
bugfix/audio-playback
hotfix/critical-ui-issue
```

#### 3. Make Changes and Commit
```bash
# Stage your changes
git add .

# Commit with a clear message
git commit -m "Add game interface component"
```

#### 4. Push Your Branch
```bash
git push origin feature/your-feature-name
```

#### 5. Create a Pull Request (PR)
1. Go to GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Set base branch: `develop`, compare branch: `feature/your-feature-name`
4. Add a clear title and description
5. Request review from team members
6. Wait for approval before merging

#### 6. Switch Between Branches
```bash
# View all branches
git branch -a

# Switch to existing branch
git checkout develop
git checkout feature/another-feature

# Switch and pull latest changes
git checkout develop
git pull origin develop
```

#### 7. Keep Your Branch Updated
```bash
# While on your feature branch
git checkout feature/your-feature-name
git pull origin develop
```

### Quick Command Reference

```bash
# Check current branch and status
git status

# See commit history
git log --oneline

# Discard local changes (careful!)
git checkout -- .

# Delete local branch (after merge)
git branch -d feature/your-feature-name

# Delete remote branch
git push origin --delete feature/your-feature-name
```

### PR Review Checklist

Before creating a PR, make sure:
- [ ] Code builds without errors (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Components render correctly
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Commit messages are clear
- [ ] No sensitive data (API keys, tokens) committed

---

## Project Structure

```
musiguessr-frontend/
├── src/
│   ├──app/                 # Next.js App Router pages
│      ├── layout.tsx      # Root layout
│      ├── page.tsx        # Home page
│      └── ...
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...
├── public/             # Static assets
├── .env.local          # Environment variables
├── next.config.js      # Next.js configuration
└── package.json        # Dependencies
```

---

## Troubleshooting

**Port 3000 already in use:**
```bash
# Run on different port
PORT=3001 npm run dev
```

**API connection error:**
- Check backend is running on `http://localhost:8080`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

**Build errors:**
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Check Node.js version: `node -v` (should be 18+)

**Styling issues:**
- Clear browser cache
- Check TailwindCSS classes are correct
- Verify `tailwind.config.js` configuration
