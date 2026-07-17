# WealthPath AI Mobile App - React Native + Expo

## Overview

Complete mobile app for WealthPath AI using React Native and Expo. Connects to the Python Flask backend for real data analysis.

## Features

✅ 5 screens with bottom tab navigation
✅ Home screen with recent analyses
✅ Job analysis form
✅ Results display with scoring
✅ Saved analyses tracking
✅ Settings and preferences
✅ Local storage persistence
✅ Dark/light mode support
✅ Real data from Flask backend APIs
✅ Offline capability

## Project Structure

```
mobile/
├── App.js                    # Main entry point
├── package.json              # Dependencies
├── app.json                  # Expo configuration
├── .gitignore                # Git ignore rules
│
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js     # Home/landing screen
│   │   ├── AnalysisScreen.js # Job analysis form
│   │   ├── ResultsScreen.js  # Results display
│   │   ├── SavedScreen.js    # Saved analyses list
│   │   └── SettingsScreen.js # User settings
│   │
│   ├── components/           # Reusable components
│   │   ├── ScoreCard.js
│   │   ├── FinancialCard.js
│   │   ├── SkillCard.js
│   │   └── ...
│   │
│   ├── services/             # External services
│   │   ├── api.js            # Flask backend API calls
│   │   ├── storage.js        # Local storage (AsyncStorage)
│   │   └── calculations.js   # Local calculations
│   │
│   ├── context/              # React Context
│   │   └── ThemeContext.js   # Dark/light mode
│   │
│   └── utils/                # Utility functions
│       └── helpers.js
│
└── assets/                   # Images, fonts, icons
    ├── icon.png
    ├── splash.png
    └── adaptive-icon.png
```

## Installation

### Prerequisites

- Node.js v16+ (https://nodejs.org/)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator
- Expo Go app (for testing on physical device)

### Setup Steps

```bash
# 1. Navigate to mobile folder
cd mobile

# 2. Install dependencies
npm install

# 3. Update Flask backend URL in src/services/api.js
# Change: const API_BASE_URL = 'http://YOUR_IP:5000'

# 4. Start Expo
npm start
# or
expo start

# 5. Run on device/simulator
# Press 'i' for iOS simulator (macOS)
# Press 'a' for Android emulator
# Scan QR code with Expo Go app on physical device
```

## Configuration

### Update Backend URL

Edit `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://192.168.1.100:5000'; // Change to your IP
```

Get your Flask server IP:
```bash
# Windows
ipconfig | find "IPv4"

# macOS/Linux
ifconfig | grep "inet "
```

### Customize Colors

Edit `App.js` and screen files:

```javascript
const COLORS = {
  primary: '#0f172a',      // Main background
  secondary: '#1e293b',    // Secondary background
  accent: '#10b981',       // Highlight color
  text: '#f1f5f9',         // Main text
  textSecondary: '#cbd5e1',// Secondary text
};
```

## File Guide

### App.js
- Main entry point
- Configures navigation (bottom tabs + stack navigation)
- Sets up color scheme
- Creates tab navigator with 5 screens

### HomeScreen.js
- Landing page
- Shows app tagline
- Quick start buttons
- Recent analyses list
- Features overview
- About section

### api.js
- Connects to Flask backend
- Functions:
  - `analyzeJob()` - POST /analyze
  - `getSampleJob()` - GET /sample-job
  - `testData()` - GET /test-data
  - `healthCheck()` - GET /health

### storage.js
- Local data persistence
- Functions:
  - `saveAnalysis()` - Save analysis
  - `getSavedAnalyses()` - Get all analyses
  - `deleteAnalysis()` - Delete specific analysis
  - `saveTheme()` / `getTheme()` - Theme preference
  - `saveUserPreferences()` - Save preferences

### package.json
Key dependencies:
- `@react-navigation/*` - Navigation
- `axios` - HTTP requests
- `@react-native-async-storage` - Local storage
- `@expo/vector-icons` - Icons

## Development

### Adding Screens

1. Create new file in `src/screens/`
2. Add to navigation in `App.js`
3. Import and add to Tab.Navigator

Example:
```javascript
// src/screens/NewScreen.js
import React from 'react';
import { View, Text } from 'react-native';

export default function NewScreen() {
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}
```

Then in `App.js`:
```javascript
<Tab.Screen
  name="NewTab"
  component={NewScreen}
  options={{ title: 'New' }}
/>
```

### Adding Components

Create in `src/components/`:
```javascript
// src/components/ScoreCard.js
import React from 'react';
import { View, Text } from 'react-native';

export default function ScoreCard({ score, label }) {
  return (
    <View>
      <Text>{label}</Text>
      <Text>{score}/100</Text>
    </View>
  );
}
```

Use in screens:
```javascript
import ScoreCard from '../components/ScoreCard';

<ScoreCard score={92} label="Salary Growth" />
```

## Common Tasks

### Connect to Flask Backend

Make sure Flask server is running:
```bash
cd web
python app.py
# Flask running on http://192.168.1.100:5000
```

In mobile app:
```javascript
// src/services/api.js
const API_BASE_URL = 'http://192.168.1.100:5000';

// Use in components
import { analyzeJob } from '../services/api';

const result = await analyzeJob(formData);
```

### Save Data Locally

```javascript
import { saveAnalysis, getSavedAnalyses } from '../services/storage';

// Save
await saveAnalysis({ jobTitle: 'Engineer', score: 92 });

// Retrieve
const analyses = await getSavedAnalyses();
```

### Debug

```bash
# View logs
npm start
# Logs appear in terminal

# Access debug menu (iOS)
Cmd+D in simulator or shake device

# Access debug menu (Android)
Cmd+M in emulator or shake device
```

## Testing

### Test API Connection
```bash
# In mobile app, call:
import { testData } from './src/services/api';
const data = await testData();
console.log(data);
```

### Test Local Storage
```javascript
import { saveAnalysis, getSavedAnalyses } from './src/services/storage';

// Save test data
await saveAnalysis({ test: true });

// Verify
const all = await getSavedAnalyses();
console.log(all);
```

## Deployment

### Build for iOS
```bash
eas build --platform ios
```

### Build for Android
```bash
eas build --platform android
```

### Publish to App Stores
See Expo documentation for detailed steps

## Troubleshooting

### "Can't connect to Flask backend"
- Verify Flask is running: `python app.py`
- Check your IP address (not localhost!)
- Update `API_BASE_URL` in `src/services/api.js`
- Ensure devices are on same network

### "Metro bundler error"
```bash
npm start -- --reset-cache
```

### "Expo Go won't load app"
```bash
expo start --clear
```

### Module not found errors
```bash
npm install
npm start -- --reset-cache
```

## Performance Tips

- Memoize components with `React.memo()`
- Use `useCallback()` for functions
- Lazy load components
- Cache API responses
- Limit re-renders

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with clear messages
5. Push to GitHub

## Next Steps

1. ✅ Set up Expo project
2. ✅ Install dependencies
3. ✅ Configure Flask backend URL
4. ⏳ Build Analysis form screen
5. ⏳ Build Results display with tabs
6. ⏳ Implement charts/visualizations
7. ⏳ Add comparison feature
8. ⏳ Deploy to App Stores

## Resources

- Expo Docs: https://docs.expo.dev/
- React Native Docs: https://reactnative.dev/
- Navigation: https://reactnavigation.org/
- Async Storage: https://react-native-async-storage.github.io/

## Support

Having issues? Check:
1. Expo documentation
2. React Native docs
3. GitHub issues
4. Stack Overflow (tag: react-native, expo)

---

**Happy coding!** 🚀
