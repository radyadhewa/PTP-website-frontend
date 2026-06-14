# Daily Reader - A Reading Habit Platform

A modern Next.js web application that helps users build a daily reading habit through streak tracking and passage visualization.

## Features

✨ **Daily Streak Tracking** - Track consecutive days of reading with a beautiful flame counter
📊 **Passage Visualization** - Understand passages better with word count stats and key points extraction
📚 **Daily Passages** - Pre-loaded sample passages to read each day
📈 **Progress Stats** - View your current streak, best streak, and total passages read
💾 **Local Storage** - Your progress is saved automatically in your browser

## Getting Started

### Prerequisites

Make sure you have **Node.js** installed on your computer. Download it from https://nodejs.org/ (LTS version recommended).

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
   This will install Next.js and all required packages.

2. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will start at `http://localhost:3000`

3. **Open in your browser**
   Navigate to `http://localhost:3000` and start reading!

## How to Use

### Daily Reading
1. Visit the app each day
2. Read the displayed passage
3. Click "Help Visualize" button if you want statistics about the passage (word count, key points, understanding tips)
4. Click "Mark as Read" to complete your daily reading and maintain your streak
5. Come back tomorrow to continue your streak!

### Features Explained

- **🔥 Streak Counter**: Shows your current consecutive reading days
- **📊 Help Visualize**: Opens a modal with:
  - Word and sentence statistics
  - Extracted key points from the passage
  - Tips for better understanding
- **📚 Load Another Passage**: Get a different passage to read instead
- **📈 Stats Dashboard**: See your progress at a glance
- **🔄 Reset Progress**: Start fresh (warning: cannot be undone)

## Project Structure

```
PTP-website-frontend/
├── components/
│   ├── StreakCounter.js        # Displays current and best streak
│   ├── ReadingPassage.js       # Shows the daily passage
│   └── VisualizationModal.js   # Modal for passage analysis
├── pages/
│   ├── _app.js                 # App wrapper for styling
│   └── index.js                # Main home page
├── styles/
│   ├── globals.css             # Global styles
│   └── Home.module.css         # Component styles
├── package.json                # Project dependencies
├── next.config.js              # Next.js configuration
└── jsconfig.json               # JavaScript path aliases
```

## Available Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run ESLint to check code quality
npm run lint
```

## How Data is Saved

Your reading progress is automatically saved to your browser's local storage:
- **Current streak** - consecutive days of reading
- **Best streak** - your highest streak
- **Total passages read** - total count
- **Last read date** - date when you last read

Data persists across browser sessions but is device/browser specific. If you clear your browser data, your progress will be reset.

## Adding Your Own Passages

To add more passages, edit `pages/index.js` and add more strings to the `SAMPLE_PASSAGES` array:

```javascript
const SAMPLE_PASSAGES = [
  "Your first passage here...",
  "Your second passage here...",
  // Add more passages as needed
];
```

## Customization

### Change Colors
Edit `styles/Home.module.css` to customize the purple gradient and button colors.

### Change the Title
Edit `pages/index.js` and modify the `<h1>` and metadata in the `<Head>` section.

### Adjust Styling
All styles are in `styles/Home.module.css`. Modify them to match your design preferences.

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Tips for Best Experience

1. **Set a daily reminder** - Schedule a specific time to read each day
2. **Read consistently** - Even small daily reading builds the habit
3. **Use Visualize** - When confused, use the visualization feature to better understand passages
4. **Track progress** - Watch your streak grow and celebrate milestones!

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```
Replace `3001` with any available port number.

**Changes not appearing?**
Hard refresh your browser (Ctrl+Shift+R on Windows/Linux or Cmd+Shift+R on Mac)

**Data not saving?**
Make sure your browser allows local storage. Check privacy settings and disable any extensions that block storage.

## Future Enhancement Ideas

- User authentication
- Cloud sync across devices
- Custom passages upload
- Community challenges
- Reading recommendations
- Time tracking
- Difficulty levels
- Mobile app version

## License

MIT License - Feel free to use this for personal or commercial projects!

## Questions or Feedback?

Feel free to modify and enhance this project to suit your needs!

Happy reading! 📖
