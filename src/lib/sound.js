// Utility for playing timer sounds (beeps)
// Uses Web Audio API for low latency, fallback vibration for mobile

let sharedCtx = null

function getCtx() {
  if (sharedCtx) return sharedCtx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  sharedCtx = new AC()
  return sharedCtx
}

function playTone(freq = 880, duration = 0.15, gain = 0.3) {
  const ctx = getCtx()
  if (!ctx) return
  try {
    // Resume if suspended (iOS/Safari requires user gesture first)
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = 'sine'
    g.gain.setValueAtTime(gain, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch { /* ignore */ }
}

// Short high beep for last-seconds countdown (3, 2, 1)
export function beepCountdown() {
  playTone(660, 0.12, 0.25)
}

// Long low beep for "GO" / end of rest
export function beepGo() {
  playTone(440, 0.5, 0.35)
}

// Medium beep for mid-event (round start in EMOM, work/rest switch in Tabata)
export function beepTransition() {
  playTone(880, 0.25, 0.3)
}

export function vibrateShort() {
  if (navigator.vibrate) navigator.vibrate(80)
}

export function vibrateLong() {
  if (navigator.vibrate) navigator.vibrate([200, 80, 200])
}

// Called at every second of countdown — triggers beep on 3/2/1 and GO at 0
// Returns true if a sound was played
export function handleCountdownTick(remaining, settings = { sound: true, vibration: true }) {
  if (remaining === 0) {
    if (settings.sound) beepGo()
    if (settings.vibration) vibrateLong()
    return true
  }
  if (remaining >= 1 && remaining <= 3) {
    if (settings.sound) beepCountdown()
    if (settings.vibration) vibrateShort()
    return true
  }
  return false
}
