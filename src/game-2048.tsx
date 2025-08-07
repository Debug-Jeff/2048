"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Trophy, Settings2, Home, RotateCcw, Play, Volume2, VolumeX, Info, Github } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Game constants
const DEFAULT_GRID_SIZE = 4
const DEFAULT_CELL_SIZE = 6 // in rem
const DEFAULT_CELL_GAP = 0.5 // in rem
const DEFAULT_ANIMATION_SPEED = 150 // in ms

// Types
type Tile = {
  value: number
  id: string
  mergedFrom?: Tile[]
  justMerged?: boolean
  isNew?: boolean
  row: number
  col: number
}

type GameSettings = {
  gridSize: number
  animationSpeed: number
  soundEnabled: boolean
  darkMode: boolean
}

type GameState = "start" | "playing" | "paused" | "gameOver" | "victory"

// Main component
export default function Game2048() {
  // Game state
  const [board, setBoard] = useState<Tile[]>([])
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [moveCount, setMoveCount] = useState(0)
  const [gameState, setGameState] = useState<GameState>("start")
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [gameTime, setGameTime] = useState(0)
  const [achievements, setAchievements] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Game settings
  const [settings, setSettings] = useState<GameSettings>({
    gridSize: DEFAULT_GRID_SIZE,
    animationSpeed: DEFAULT_ANIMATION_SPEED,
    soundEnabled: true,
    darkMode: false,
  })

  // Refs
  const gameContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<boolean>(true)
  const { toast } = useToast()

  // Initialize game on component mount
  useEffect(() => {
    loadGameData()

    if (gameContainerRef.current) {
      gameContainerRef.current.focus()
    }

    // Create audio element for game sounds
    const audio = new Audio()

    return () => {}
  }, [])

  // Timer effect for game duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (gameState === "playing" && gameStartTime) {
      interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - gameStartTime) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, gameStartTime])

  // Update best score when score changes
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      saveGameData({ bestScore: score })
    }

    // Check for achievements
    checkAchievements()
  }, [score, bestScore])

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  // Load game data from localStorage
  const loadGameData = () => {
    try {
      const storedData = localStorage.getItem("game2048Data")
      if (storedData) {
        const data = JSON.parse(storedData)
        setBestScore(data.bestScore || 0)
        setSettings((prev) => ({
          ...prev,
          ...data.settings,
        }))
        setAchievements(data.achievements || [])
      }
    } catch (error) {
      console.error("Failed to load game data:", error)
    }
  }

  // Save game data to localStorage
  const saveGameData = (data: any) => {
    try {
      const currentData = localStorage.getItem("game2048Data")
      const parsedData = currentData ? JSON.parse(currentData) : {}

      localStorage.setItem(
        "game2048Data",
        JSON.stringify({
          ...parsedData,
          ...data,
          settings,
          achievements,
        }),
      )
    } catch (error) {
      console.error("Failed to save game data:", error)
    }
  }

  // Initialize game board
  const initializeGame = () => {
    const newBoard: Tile[] = []
    addNewTile(newBoard)
    addNewTile(newBoard)
    setBoard(newBoard)
    setScore(0)
    setMoveCount(0)
    setGameState("playing")
    setGameStartTime(Date.now())
    setGameTime(0)
  }

  // Add a new tile to the board
  const addNewTile = (board: Tile[]) => {
    const emptyTiles = []
    for (let row = 0; row < settings.gridSize; row++) {
      for (let col = 0; col < settings.gridSize; col++) {
        if (!board.some((tile) => tile.row === row && tile.col === col)) {
          emptyTiles.push({ row, col })
        }
      }
    }

    if (emptyTiles.length > 0) {
      const { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)]
      board.push({
        value: Math.random() < 0.9 ? 2 : 4,
        id: `${row}-${col}-${Date.now()}`,
        row,
        col,
        isNew: true,
      })
    }
  }

  // Move tiles in a direction
  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameState !== "playing") return

    let newBoard = board.map((tile) => ({ ...tile, justMerged: false, isNew: false }))
    let changed = false
    let newScore = score
    let mergeHappened = false

    const sortedTiles = [...newBoard].sort((a, b) => {
      if (direction === "up" || direction === "down") {
        return direction === "up" ? a.row - b.row : b.row - a.row
      } else {
        return direction === "left" ? a.col - b.col : b.col - a.col
      }
    })

    for (const tile of sortedTiles) {
      const { row, col } = tile
      let newRow = row
      let newCol = col

      while (true) {
        newRow += direction === "up" ? -1 : direction === "down" ? 1 : 0
        newCol += direction === "left" ? -1 : direction === "right" ? 1 : 0

        if (newRow < 0 || newRow >= settings.gridSize || newCol < 0 || newCol >= settings.gridSize) {
          newRow -= direction === "up" ? -1 : direction === "down" ? 1 : 0
          newCol -= direction === "left" ? -1 : direction === "right" ? 1 : 0
          break
        }

        const targetTile = newBoard.find((t) => t.row === newRow && t.col === newCol)
        if (targetTile) {
          if (targetTile.value === tile.value && !targetTile.justMerged) {
            newBoard = newBoard.filter((t) => t !== targetTile && t !== tile)
            newBoard.push({
              value: tile.value * 2,
              id: tile.id,
              row: newRow,
              col: newCol,
              justMerged: true,
            })
            newScore += tile.value * 2
            changed = true
            mergeHappened = true

            // Check for 2048 tile (victory condition)
            if (tile.value * 2 === 2048 && !achievements.includes("reach2048")) {
              addAchievement("reach2048")
              setGameState("victory")
            }
          } else {
            newRow -= direction === "up" ? -1 : direction === "down" ? 1 : 0
            newCol -= direction === "left" ? -1 : direction === "right" ? 1 : 0
          }
          break
        }
      }

      if (newRow !== row || newCol !== col) {
        changed = true
        tile.row = newRow
        tile.col = newCol
      }
    }

    if (changed) {
      // Play sound if enabled
      if (settings.soundEnabled && mergeHappened) {
        playSound("merge")
      } else if (settings.soundEnabled) {
        playSound("move")
      }

      addNewTile(newBoard)
      setBoard(newBoard)
      setScore(newScore)
      setMoveCount((prev) => prev + 1)

      if (isGameOverState(newBoard)) {
        setGameState("gameOver")
        saveGameData({ lastScore: newScore })

        if (settings.soundEnabled) {
          playSound("gameOver")
        }
      }
    } else if (isGameOverState(newBoard)) {
      setGameState("gameOver")
      saveGameData({ lastScore: newScore })

      if (settings.soundEnabled) {
        playSound("gameOver")
      }
    }
  }

  // Check if the game is over
  const isGameOverState = (board: Tile[]) => {
    if (board.length < settings.gridSize * settings.gridSize) return false

    for (const tile of board) {
      const { row, col, value } = tile
      if (
        (row > 0 && board.some((t) => t.row === row - 1 && t.col === col && t.value === value)) ||
        (row < settings.gridSize - 1 && board.some((t) => t.row === row + 1 && t.col === col && t.value === value)) ||
        (col > 0 && board.some((t) => t.row === row && t.col === col - 1 && t.value === value)) ||
        (col < settings.gridSize - 1 && board.some((t) => t.row === row && t.col === col + 1 && t.value === value))
      ) {
        return false
      }
    }

    return true
  }

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (gameState !== "playing") return

    switch (e.key) {
      case "ArrowUp":
        move("up")
        break
      case "ArrowDown":
        move("down")
        break
      case "ArrowLeft":
        move("left")
        break
      case "ArrowRight":
        move("right")
        break
      case "Escape":
        setGameState("paused")
        break
    }
  }

  // Get cell color based on value
  const cellColor = (value: number) => {
    const baseColors = {
      2: "bg-[#eee4da] text-[#776e65]",
      4: "bg-[#ede0c8] text-[#776e65]",
      8: "bg-[#f2b179] text-white",
      16: "bg-[#f59563] text-white",
      32: "bg-[#f67c5f] text-white",
      64: "bg-[#f65e3b] text-white",
      128: "bg-[#edcf72] text-white",
      256: "bg-[#edcc61] text-white",
      512: "bg-[#edc850] text-white",
      1024: "bg-[#edc53f] text-white",
      2048: "bg-[#edc22e] text-white",
      4096: "bg-[#3c3a32] text-white",
      8192: "bg-[#3c3a32] text-white",
    }

    return baseColors[value as keyof typeof baseColors] || "bg-[#cdc1b4]"
  }

  // Animation variants for tiles
  const tileVariants = {
    initial: { scale: 0 },
    enter: { scale: 1 },
    merged: {
      scale: [1, 1.1, 1],
      transition: { duration: settings.animationSpeed / 1000 },
    },
  }

  // Play sound effects
  const playSound = (type: "move" | "merge" | "gameOver" | "victory") => {
    if (!settings.soundEnabled || !audioRef.current) return

    // Check if we're in a browser environment
    if (typeof window === "undefined") return

    try {
      // Create a simple beep sound instead of loading external files
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Configure sound based on type
      switch (type) {
        case "move":
          oscillator.type = "sine"
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
          break
        case "merge":
          oscillator.type = "triangle"
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          break
        case "gameOver":
          oscillator.type = "sawtooth"
          oscillator.frequency.setValueAtTime(110, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          break
        case "victory":
          oscillator.type = "square"
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          break
      }

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Play sound
      oscillator.start()

      // Stop after a short duration
      const duration = type === "victory" ? 0.5 : 0.15
      oscillator.stop(audioContext.currentTime + duration)

      // Clean up
      setTimeout(() => {
        gainNode.disconnect()
        oscillator.disconnect()
      }, duration * 1000)
    } catch (error) {
      console.log("Sound playback not supported in this environment")
    }
  }

  // Check and add achievements
  const checkAchievements = () => {
    const newAchievements: string[] = []

    // Score-based achievements
    if (score >= 1000 && !achievements.includes("score1000")) {
      newAchievements.push("score1000")
    }
    if (score >= 10000 && !achievements.includes("score10000")) {
      newAchievements.push("score10000")
    }

    // Move-based achievements
    if (moveCount >= 100 && !achievements.includes("moves100")) {
      newAchievements.push("moves100")
    }

    // Tile-based achievements
    const maxTile = Math.max(...board.map((tile) => tile.value), 0)
    if (maxTile >= 512 && !achievements.includes("tile512")) {
      newAchievements.push("tile512")
    }
    if (maxTile >= 1024 && !achievements.includes("tile1024")) {
      newAchievements.push("tile1024")
    }

    if (newAchievements.length > 0) {
      addAchievements(newAchievements)
    }
  }

  // Add a single achievement
  const addAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      const newAchievements = [...achievements, achievement]
      setAchievements(newAchievements)
      saveGameData({ achievements: newAchievements })

      // Show achievement toast
      toast({
        title: "Achievement Unlocked!",
        description: getAchievementDescription(achievement),
      })

      if (settings.soundEnabled) {
        playSound("victory")
      }
    }
  }

  // Add multiple achievements
  const addAchievements = (newAchievements: string[]) => {
    const filteredAchievements = newAchievements.filter((a) => !achievements.includes(a))
    if (filteredAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...filteredAchievements]
      setAchievements(updatedAchievements)
      saveGameData({ achievements: updatedAchievements })

      // Show achievement toast for the first one
      toast({
        title: "Achievement Unlocked!",
        description: getAchievementDescription(filteredAchievements[0]),
      })

      if (settings.soundEnabled) {
        playSound("victory")
      }
    }
  }

  // Get achievement description
  const getAchievementDescription = (achievement: string) => {
    const descriptions: Record<string, string> = {
      reach2048: "Reached the 2048 tile!",
      score1000: "Scored 1,000 points",
      score10000: "Scored 10,000 points",
      moves100: "Made 100 moves in a single game",
      tile512: "Created a 512 tile",
      tile1024: "Created a 1024 tile",
    }

    return descriptions[achievement] || "New achievement unlocked!"
  }

  // Format time display (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Update game settings
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      saveGameData({ settings: updated })
      return updated
    })
  }

  // Reset game and start over
  const resetGame = () => {
    initializeGame()
  }

  // Continue playing after victory
  const continueAfterVictory = () => {
    setGameState("playing")
  }

  // Render the start screen
  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-7xl font-bold mb-4 text-[#776e65]">2048</h1>
        <p className="text-xl mb-8 text-[#776e65]">
          Join the numbers and get to the <strong>2048 tile!</strong>
        </p>

        <div className="grid gap-4 max-w-md mx-auto">
          <Button
            onClick={initializeGame}
            size="lg"
            className="bg-[#8f7a66] text-white hover:bg-[#9f8a76] h-16 text-xl"
          >
            <Play className="mr-2 h-6 w-6" /> Play Game
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setShowSettings(true)} variant="outline" className="border-[#8f7a66] text-[#8f7a66]">
              <Settings2 className="mr-2 h-4 w-4" /> Settings
            </Button>

            <Button onClick={() => setShowInfo(true)} variant="outline" className="border-[#8f7a66] text-[#8f7a66]">
              <Info className="mr-2 h-4 w-4" /> How to Play
            </Button>
          </div>
        </div>

        <div className="mt-8 text-sm text-[#776e65]">
          <p>
            Best Score: <strong>{bestScore}</strong>
          </p>
          <p className="mt-4">
            <a
              href="https://github.com/gabrielecirulli/2048"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-[#776e65] hover:underline"
            >
              <Github className="mr-1 h-4 w-4" /> Original 2048 by Gabriele Cirulli
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )

  // Render the game board
  const renderGameBoard = () => (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4"
      ref={gameContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="2048 Game Board"
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex justify-between items-center w-full mb-4">
          <h1 className="text-5xl font-bold text-[#776e65]">2048</h1>
          <div className="flex gap-2">
            <div className="bg-[#bbada0] p-2 h-14 w-16 rounded-md text-white flex flex-col items-center">
              <div className="text-xs">SCORE</div>
              <div className="font-bold">{score}</div>
            </div>
            <div className="bg-[#bbada0] h-14 w-16 rounded-md p-2 text-white flex flex-col items-center">
              <div className="text-xs">BEST</div>
              <div className="font-bold">{bestScore}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setGameState("paused")}
              size="sm"
              variant="outline"
              className="h-8 px-2 border-[#8f7a66] text-[#8f7a66]"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              onClick={resetGame}
              size="sm"
              variant="outline"
              className="h-8 px-2 border-[#8f7a66] text-[#8f7a66]"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-xs text-[#776e65]">
              <span className="mr-2">TIME: {formatTime(gameTime)}</span>
              <span>MOVES: {moveCount}</span>
            </div>
            <Button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-[#bbada0] p-2 rounded-lg w-fit">
          <div
            className="relative"
            style={{
              width: `${settings.gridSize * DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP * (settings.gridSize - 1)}rem`,
              height: `${settings.gridSize * DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP * (settings.gridSize - 1)}rem`,
            }}
          >
            {/* Background grid */}
            {Array.from({ length: settings.gridSize * settings.gridSize }).map((_, index) => (
              <div
                key={`cell-${index}`}
                className="absolute bg-[#cdc1b4] rounded-md"
                style={{
                  width: `${DEFAULT_CELL_SIZE}rem`,
                  height: `${DEFAULT_CELL_SIZE}rem`,
                  left: `${(index % settings.gridSize) * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP)}rem`,
                  top: `${Math.floor(index / settings.gridSize) * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP)}rem`,
                }}
              />
            ))}

            {/* Tiles */}
            <AnimatePresence>
              {board.map((tile) => (
                <motion.div
                  key={tile.id}
                  initial={
                    tile.isNew
                      ? {
                          scale: 0,
                          x: tile.col * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP) + "rem",
                          y: tile.row * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP) + "rem",
                        }
                      : { scale: 0 }
                  }
                  animate={{
                    scale: 1,
                    x: tile.col * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP) + "rem",
                    y: tile.row * (DEFAULT_CELL_SIZE + DEFAULT_CELL_GAP) + "rem",
                  }}
                  exit={{ scale: 0 }}
                  transition={
                    tile.isNew
                      ? { duration: settings.animationSpeed / 1000 }
                      : {
                          x: { duration: settings.animationSpeed / 1000 },
                          y: { duration: settings.animationSpeed / 1000 },
                        }
                  }
                  className={`absolute rounded-md flex items-center justify-center text-2xl font-bold ${cellColor(tile.value)}`}
                  style={{
                    width: `${DEFAULT_CELL_SIZE}rem`,
                    height: `${DEFAULT_CELL_SIZE}rem`,
                  }}
                >
                  <motion.div
                    variants={tileVariants}
                    animate={tile.justMerged ? "merged" : "enter"}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {tile.value}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 text-sm text-[#776e65]">
          <p>
            <strong>HOW TO PLAY:</strong> Use your <strong>arrow keys</strong> to move the tiles. When two tiles with
            the same number touch, they <strong>merge into one!</strong>
          </p>
        </div>
      </div>
    </div>
  )

  // Render settings dialog
  const renderSettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>Customize your 2048 game experience</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="grid-size">
              Grid Size: {settings.gridSize}x{settings.gridSize}
            </Label>
            <Select
              value={settings.gridSize.toString()}
              onValueChange={(value) => updateSettings({ gridSize: Number.parseInt(value) })}
            >
              <SelectTrigger id="grid-size">
                <SelectValue placeholder="Select grid size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3x3</SelectItem>
                <SelectItem value="4">4x4</SelectItem>
                <SelectItem value="5">5x5</SelectItem>
                <SelectItem value="6">6x6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="animation-speed">Animation Speed</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">Slow</span>
              <Slider
                id="animation-speed"
                min={50}
                max={300}
                step={50}
                value={[settings.animationSpeed]}
                onValueChange={(value) => updateSettings({ animationSpeed: value[0] })}
                className="flex-1"
              />
              <span className="text-sm">Fast</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle">Sound Effects</Label>
            <Switch
              id="sound-toggle"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
            <Switch
              id="dark-mode-toggle"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setShowSettings(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render info dialog
  const renderInfoDialog = () => (
    <Dialog open={showInfo} onOpenChange={setShowInfo}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How to Play 2048</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p>
            2048 is a sliding puzzle game. The goal is to combine tiles with the same number to create a tile with the
            value 2048.
          </p>

          <div className="space-y-2">
            <h3 className="font-semibold">Game Rules:</h3>
            <ul className="list-disc pl-5">
              <li>Use arrow keys to move all tiles in one direction.</li>
              <li>Tiles with the same number merge into one when they touch.</li>
              <li>After each move, a new tile (2 or 4) appears randomly on the board.</li>
              <li>The game is won when a 2048 tile is created.</li>
              <li>The game is over when there are no more valid moves.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Controls:</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Arrow Keys</strong>: Move tiles
              </li>
              <li>
                <strong>ESC</strong>: Pause game
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tips:</h3>
            <ul className="list-disc pl-5">
              <li>Try to keep your highest value tile in a corner.</li>
              <li>Work to maintain a clear path to your highest tile.</li>
              <li>Plan several moves ahead.</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setShowInfo(false)}>Got it!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render pause dialog
  const renderPauseDialog = () => (
    <Dialog open={gameState === "paused"} onOpenChange={(open) => !open && setGameState("playing")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Game Paused</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-xl font-bold">{score}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Time</div>
              <div className="text-xl font-bold">{formatTime(gameTime)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button onClick={() => setGameState("playing")}>Resume</Button>
            <Button variant="outline" onClick={resetGame}>
              Restart
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              setGameState("start")
              setBoard([])
            }}
          >
            Return to Menu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Render game over dialog
  const renderGameOverDialog = () => (
    <Dialog open={gameState === "gameOver"} onOpenChange={(open) => !open && setGameState("start")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game Over!</DialogTitle>
          <DialogDescription>
            Your score: {score}
            {score === bestScore && score > 0 && " (New Best!)"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Moves</div>
            <div className="text-xl font-bold">{moveCount}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="text-xl font-bold">{formatTime(gameTime)}</div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={resetGame} className="bg-[#8f7a66] text-white hover:bg-[#9f8a76]">
            Play Again
          </Button>
          <Button variant="outline" onClick={() => setGameState("start")}>
            Return to Menu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render victory dialog
  const renderVictoryDialog = () => (
    <Dialog open={gameState === "victory"} onOpenChange={(open) => !open && continueAfterVictory()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">🎉 Victory! 🎉</DialogTitle>
          <DialogDescription className="text-center">You've reached the 2048 tile!</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-md">
            <div className="text-sm text-muted-foreground">Time</div>
            <div className="text-xl font-bold">{formatTime(gameTime)}</div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={continueAfterVictory} className="bg-[#8f7a66] text-white hover:bg-[#9f8a76]">
            Keep Playing
          </Button>
          <Button variant="outline" onClick={resetGame}>
            New Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  // Render achievements tab
  const renderAchievementsTab = () => (
    <Tabs defaultValue="game" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="game">Game</TabsTrigger>
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
      </TabsList>
      <TabsContent value="game">{renderGameBoard()}</TabsContent>
      <TabsContent value="achievements">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5" /> Achievements
            </CardTitle>
            <CardDescription>You've unlocked {achievements.length} out of 6 achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                { id: "reach2048", name: "2048 Master", desc: "Reach the 2048 tile" },
                { id: "score1000", name: "Point Collector", desc: "Score 1,000 points in a single game" },
                { id: "score10000", name: "Score Champion", desc: "Score 10,000 points in a single game" },
                { id: "moves100", name: "Strategist", desc: "Make 100 moves in a single game" },
                { id: "tile512", name: "Halfway There", desc: "Create a 512 tile" },
                { id: "tile1024", name: "Almost There", desc: "Create a 1024 tile" },
              ].map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border ${
                    achievements.includes(achievement.id)
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/50 border-muted text-muted-foreground"
                  }`}
                >
                  <div className="font-medium flex items-center">
                    {achievements.includes(achievement.id) && <Trophy className="mr-2 h-4 w-4 text-primary" />}
                    {achievement.name}
                  </div>
                  <div className="text-sm">{achievement.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => setGameState("playing")}>
              Back to Game
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )

  // Main render method
  return (
    <div
      className={`min-h-screen ${settings.darkMode ? "dark bg-gray-900 text-white" : "bg-[#faf8ef] text-[#776e65]"}`}
    >
      {/* Game state rendering */}
      {gameState === "start" && renderStartScreen()}
      {gameState === "playing" && renderGameBoard()}

      {/* Dialogs */}
      {renderSettingsDialog()}
      {renderInfoDialog()}
      {renderPauseDialog()}
      {renderGameOverDialog()}
      {renderVictoryDialog()}

      {/* Hidden audio element for sound effects */}
    </div>
  )
}

