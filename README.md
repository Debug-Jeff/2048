# 2048 Game

A modern implementation of the classic 2048 game with enhanced features and a polished user interface.

## Features

- **Interactive Game Board**: Smooth animations and responsive design
- **Start Screen**: Welcoming interface with game options
- **Game Settings**: Customize grid size, animation speed, sound effects, and dark mode
- **Achievement System**: Unlock achievements as you play and improve
- **Game Statistics**: Track score, time, and moves
- **Responsive Design**: Works on desktop and mobile devices
- **Sound Effects**: Optional audio feedback for game actions
- **Pause & Resume**: Take a break and continue your game later
- **Victory & Game Over Screens**: Celebrate wins and track performance

## Implementation Details

### File Structure

- `game-2048.tsx`: Main game component with all game logic and UI
- `app/page.tsx`: Next.js page that renders the game component
- `app/globals.css`: Global styles including Tailwind CSS configuration

### Key Components

1. **Game State Management**
   - Uses React's useState to track board state, score, and game progress
   - Implements game initialization, tile movement, and merging logic
   - Handles keyboard input for game controls

2. **UI Components**
   - Start Screen: Welcome screen with play button and options
   - Game Board: Interactive grid with animated tiles
   - Settings Dialog: Customization options for the game
   - Info Dialog: Game rules and instructions
   - Pause/Game Over/Victory Dialogs: Game state notifications

3. **Game Logic**
   - Board representation as an array of tile objects
   - Movement and merging algorithms for all four directions
   - Random tile generation after each move
   - Game over and victory condition detection

4. **Features**
   - **Local Storage**: Persists best score and game settings
   - **Achievements**: Tracks player progress and unlocks achievements
   - **Animation**: Uses Framer Motion for smooth tile animations
   - **Sound Effects**: Optional audio feedback for game actions
   - **Dark Mode**: Toggle between light and dark themes
   - **Responsive Design**: Adapts to different screen sizes

### Technologies Used

- **React**: For UI components and state management
- **Next.js**: Application framework
- **Framer Motion**: Animation library
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI component library
- **Lucide React**: Icon library

## Game Flow

1. User starts at the welcome screen
2. User can start a new game, adjust settings, or view instructions
3. During gameplay, tiles move and merge based on arrow key input
4. Score increases when tiles merge
5. Game ends when no more moves are possible
6. User can restart, return to menu, or continue playing after reaching 2048

## Customization Options

- **Grid Size**: 3x3, 4x4, 5x5, or 6x6
- **Animation Speed**: Adjust the speed of tile movements
- **Sound Effects**: Toggle game sounds on/off
- **Dark Mode**: Switch between light and dark themes

## Achievements

The game includes several achievements to unlock:
- Reach the 2048 tile
- Score 1,000 points
- Score 10,000 points
- Make 100 moves in a single game
- Create a 512 tile
- Create a 1024 tile

## Future Improvements

Potential enhancements for future versions:
- Online leaderboards
- Additional game modes (timed, challenge)
- More customization options
- Touch/swipe support for mobile
- Undo move functionality

