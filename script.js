// Game configuration
const GAME_DURATION = 60; // in seconds
const COLORS = [
  { name: 'RED', hex: '#e74c3c' },
  { name: 'BLUE', hex: '#3498db' },
  { name: 'GREEN', hex: '#2ecc71' },
  { name: 'YELLOW', hex: '#f1c40f' },
  { name: 'PURPLE', hex: '#9b59b6' },
  { name: 'ORANGE', hex: '#e67e22' }
];

// Game state
let score = 0;
let timeLeft = GAME_DURATION;
let timer;
let currentWord;
let currentWordColor;
let isGameRunning = false;
let soundEnabled = true;
let tickSoundPlayed = false;
let urgencyLevel = 0;

// DOM elements
const timeElement = document.getElementById('time');
const scoreElement = document.getElementById('score');
const colorWordElement = document.getElementById('color-word');
const colorOptionsElement = document.getElementById('color-options');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const performanceMessageElement = document.getElementById('performance-message');
const toggleSoundButton = document.getElementById('toggle-sound');

// Audio elements
const correctSound = document.getElementById('correct-sound');
const wrongSound = document.getElementById('wrong-sound');
const gameStartSound = document.getElementById('game-start-sound');
const gameOverSound = document.getElementById('game-over-sound');
const tickSound = document.getElementById('tick-sound');

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);
toggleSoundButton.addEventListener('click', toggleSound);

// Initialize the game
function initGame() {
  // Create color options
  COLORS.forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.style.backgroundColor = color.hex;
    colorOption.dataset.color = color.name;
    colorOption.addEventListener('click', () => handleColorClick(color.name));
    colorOptionsElement.appendChild(colorOption);
  });
  
  // Set initial UI state
  updateScore(0);
  updateTimeLeft(GAME_DURATION);
  colorWordElement.style.color = '#333';
  colorWordElement.textContent = 'Ready?';
}

// Toggle sound on/off
function toggleSound() {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    toggleSoundButton.textContent = '🔊';
    toggleSoundButton.classList.remove('sound-off');
    toggleSoundButton.classList.add('sound-on');
  } else {
    toggleSoundButton.textContent = '🔇';
    toggleSoundButton.classList.remove('sound-on');
    toggleSoundButton.classList.add('sound-off');
  }
}

// Play sound if enabled
function playSound(audioElement) {
  if (soundEnabled) {
    audioElement.currentTime = 0;
    audioElement.play().catch(error => {
      console.log('Audio playback error:', error);
    });
  }
}

// Start the game
function startGame() {
  isGameRunning = true;
  score = 0;
  timeLeft = GAME_DURATION;
  tickSoundPlayed = false;
  urgencyLevel = 0;
  
  updateScore(0);
  updateTimeLeft(GAME_DURATION);
  
  startButton.disabled = true;
  restartButton.disabled = false;
  gameOverElement.classList.add('hidden');
  
  // Play start sound
  playSound(gameStartSound);
  
  // Start the timer
  timer = setInterval(() => {
    timeLeft--;
    updateTimeLeft(timeLeft);
    
    // Determine urgency level based on time left
    if (timeLeft <= 20 && timeLeft > 10) {
      if (urgencyLevel < 1) {
        urgencyLevel = 1;
        document.body.classList.add('urgency-low');
      }
    } else if (timeLeft <= 10 && timeLeft > 5) {
      if (urgencyLevel < 2) {
        urgencyLevel = 2;
        document.body.classList.remove('urgency-low');
        document.body.classList.add('urgency-medium');
      }
    } else if (timeLeft <= 5) {
      if (urgencyLevel < 3) {
        urgencyLevel = 3;
        document.body.classList.remove('urgency-medium');
        document.body.classList.add('urgency-high');
      }
    }
    
    // Play tick sound when time is running low (last 10 seconds)
    if (timeLeft <= 10 && timeLeft > 0 && !tickSoundPlayed) {
      playSound(tickSound);
      tickSoundPlayed = true;
      
      // Reset the flag after a shorter delay as time decreases
      const delay = timeLeft <= 5 ? 400 : 600;
      setTimeout(() => {
        tickSoundPlayed = false;
      }, delay);
    }
    
    if (timeLeft <= 0) {
      document.body.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
      endGame();
    }
  }, 1000);
  
  // Generate the first color challenge
  generateNewChallenge();
}

// End the game
function endGame() {
  isGameRunning = false;
  clearInterval(timer);
  
  startButton.disabled = true;
  restartButton.disabled = false;
  
  // Play game over sound
  playSound(gameOverSound);
  
  // Show game over screen
  finalScoreElement.textContent = score;
  
  // Generate performance message
  let performanceMessage = '';
  if (score >= 200) {
    performanceMessage = 'Amazing! You have lightning-fast color recognition!';
  } else if (score >= 150) {
    performanceMessage = 'Great job! Your color perception is excellent!';
  } else if (score >= 100) {
    performanceMessage = 'Good work! You have solid color recognition skills.';
  } else if (score >= 50) {
    performanceMessage = 'Nice effort! Keep practicing to improve.';
  } else {
    performanceMessage = 'Good try! With practice, you\'ll get better at this.';
  }
  
  performanceMessageElement.textContent = performanceMessage;
  gameOverElement.classList.remove('hidden');
}

// Restart the game
function restartGame() {
  clearInterval(timer);
  document.body.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
  startGame();
}

// Generate a new color challenge
function generateNewChallenge() {
  // Select a random color name
  const wordIndex = Math.floor(Math.random() * COLORS.length);
  currentWord = COLORS[wordIndex].name;
  
  // Select a random color for the text (potentially different from the word)
  let colorIndex;
  do {
    colorIndex = Math.floor(Math.random() * COLORS.length);
  } while (colorIndex === wordIndex && COLORS.length > 1); // Ensure different colors when possible
  
  currentWordColor = COLORS[colorIndex].hex;
  
  // Update the UI
  colorWordElement.textContent = currentWord;
  colorWordElement.style.color = currentWordColor;
}

// Handle color option click
function handleColorClick(selectedColor) {
  if (!isGameRunning) return;
  
  // Check if the selected color matches the word (not the display color)
  if (selectedColor === currentWord) {
    // Correct answer
    updateScore(score + 10);
    showFeedback(true);
    playSound(correctSound);
  } else {
    // Incorrect answer
    updateScore(Math.max(0, score - 5)); // Prevent negative scores
    showFeedback(false);
    playSound(wrongSound);
  }
  
  // Generate a new challenge
  generateNewChallenge();
}

// Show visual feedback for correct/incorrect answers
function showFeedback(isCorrect) {
  const feedbackClass = isCorrect ? 'correct-answer' : 'wrong-answer';
  colorWordElement.classList.add(feedbackClass);
  
  setTimeout(() => {
    colorWordElement.classList.remove(feedbackClass);
  }, 300);
}

// Update the score display
function updateScore(newScore) {
  score = newScore;
  scoreElement.textContent = score;
}

// Update the time display
function updateTimeLeft(seconds) {
  timeElement.textContent = seconds;
  
  // Visual indication when time is running low
  if (seconds <= 10) {
    timeElement.style.color = '#e74c3c';
  } else {
    timeElement.style.color = 'white';
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);