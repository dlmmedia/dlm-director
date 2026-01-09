# Product Requirements Document (PRD)

## Product Name
**DLM Director (Advanced Edition)**  
Elite AI Cinematic Video Agent

---

## 1. Vision & Goals

DLM Director evolves from a basic video stitching tool into a **professional, cinematic-grade AI video direction system**—closer to a virtual film director + cinematographer + editor.

### Core Goals
- Full creative control over **image → scene → sequence → video** generation
- Cinematic consistency (characters, lighting, locations, visual grammar)
- Professional camera, lens, and movement simulation
- Seamless scene stitching (no abrupt cuts)
- Optional narrated / voiceover-driven video creation
- Studio-grade UI/UX with motion, polish, and clarity
- Persistent session-based asset storage (images, videos, scripts)

---

## 2. Target Users

1. **Filmmakers & Cinematic Creators**
2. **Music Video Directors / Labels**
3. **Documentary Creators**
4. **Marketing & Ad Studios**
5. **YouTube / Short-form Content Creators**
6. **AI-first creative studios**

---

## 3. High-Level Architecture

### Pipeline Overview

```
Concept → Script → Scene Graph → Image Generation → Scene Refinement
→ Motion Planning → Video Assembly → Audio / VO → Final Render
```

### Core Engines
- **Image Generation Engine** (Nano Banana)
- **Scene Intelligence Engine** (consistency, relationships)
- **Cinematography Engine** (camera, lens, movement)
- **Video Assembly Engine** (stitching, transitions)
- **Audio / Voice Engine** (Gemini Voices)
- **Storage & Session Engine** (Vercel Blob)

---

## 4. Expanded Creative Configuration System

### 4.1 Project Presets (Expanded)

- Cinematic Trailer
- Feature Film Scene
- Music Video
- Documentary
- Commercial / Ad
- Fashion Film
- Vertical Short / Reel
- Explainer / Voiceover Video
- Experimental / Art Film

Each preset preloads recommended camera, pacing, transitions, and shot grammar.

---

## 5. Advanced Image Generation Controls (Nano Banana)

### 5.1 Scene-Based Image Generation

Instead of single prompts:
- Project → Scenes → Shots → Variations

Each **Scene** maintains:
- Characters
- Location
- Lighting state
- Time of day
- Color palette

Each **Shot** derives from scene memory.

---

### 5.2 Camera & Lens Controls

#### Camera Bodies (Simulation)
- ARRI Alexa Mini / LF
- RED Komodo / V-Raptor
- Sony Venice
- Blackmagic URSA Mini Pro
- IMAX-style Large Format (simulated)

#### Lens Types
- Spherical Prime
- Anamorphic (2x, 1.8x squeeze)
- Vintage Cine Lenses (Cooke-style)
- Modern Ultra-Sharp (Zeiss-style)

#### Focal Lengths
- Ultra-wide: 14mm, 18mm
- Wide: 24mm, 28mm
- Standard: 35mm, 50mm
- Portrait: 85mm
- Telephoto: 135mm, 200mm

#### Depth of Field
- Extremely shallow (f/1.4 look)
- Cinematic shallow
- Deep focus

---

### 5.3 Camera Angles

- Eye-level
- Low-angle (hero)
- High-angle (vulnerable)
- Bird’s-eye / top-down
- Dutch tilt
- Over-the-shoulder
- POV

---

### 5.4 Camera Movements

- Locked-off tripod
- Slow push-in
- Slow pull-out
- Pan (left/right)
- Tilt (up/down)
- Handheld (controlled shake)
- Steadicam-style float
- Dolly-in / dolly-out
- Crane / jib motion
- Orbit / parallax

Movement metadata is used later by video assembly.

---

### 5.5 Lighting Control

- High-key
- Low-key
- Chiaroscuro
- Soft diffused
- Hard directional
- Practical lights visible
- Rim lighting
- Motivated lighting

Light sources:
- Tungsten
- Daylight
- Neon
- Candle / fire

---

## 6. Scene Intelligence & Consistency Engine

### 6.1 Character Consistency

- Persistent character embeddings
- Outfit locking per scene
- Facial feature consistency
- Aging / emotion progression

### 6.2 Location Continuity

- Establishing shot → medium → close-up logic
- Reusable location memory

### 6.3 Shot Relationship Logic

Example flow:
1. Wide establishing shot
2. Medium interaction shot
3. Close-up emotional shot
4. Reverse angle
5. Detail cutaway

AI automatically proposes logical next shots.

---

## 7. Video Assembly & Stitching Engine

### 7.1 Scene-to-Scene Transitions

- Match cut
- L-cut / J-cut
- Cross dissolve
- Whip pan transition
- Light-based transition
- Motion-matched cut

### 7.2 Temporal Smoothing

- Optical flow blending
- Motion interpolation
- Shot overlap buffers

### 7.3 Cinematic Timing

- Shot duration curves
- Music-beat alignment
- Emotional pacing profiles

---

## 8. Audio & Voiceover System

### 8.1 Voiceover Modes

- No voice (music-only)
- Narrated documentary
- Commercial VO
- Story-driven narration

### 8.2 Script-to-Voice Pipeline

1. Script generated or uploaded
2. Voice selection (Gemini Voices)
3. Emotion & pacing control
4. Timeline alignment with visuals

### 8.3 Audio Layers

- Voiceover
- Music
- Ambient sound
- Foley (future)

---

## 9. UI / UX Overhaul

### 9.1 Design Language

- Dark cinematic studio aesthetic
- Gold / neutral accent system
- Clear hierarchy
- Minimal but powerful controls

### 9.2 Motion & Interactions

- GSAP animations
- Framer Motion for micro-interactions
- Smooth step transitions
- Animated progress timelines
- Scene timeline scrubber

### 9.3 Visual Tools

- Shot timeline
- Scene graph view
- Camera path preview
- Before/after comparison

---

## 10. Technical Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- Framer Motion
- GSAP

### Backend
- Serverless Functions (Vercel)
- AI Orchestration Layer
- Session State Manager

### Storage
- **Vercel Blob**
  - Session-based folders
  - Images
  - Videos
  - Audio
  - Metadata JSON

---

## 11. Session & Asset Management

### Session Lifecycle

- New Project → New Session ID
- Auto-create Vercel Blob folder
- Persist:
  - Prompts
  - Scene graphs
  - Images
  - Intermediate videos
  - Final renders

### CLI Workflow

- Use Vercel CLI to initialize project
- Auto-bind blob storage
- Environment-based session isolation

---

## 12. Export & Delivery

- MP4 / WebM
- 4K / 1080p
- Aspect ratio aware exports
- Platform presets (YouTube, Instagram, Cinema)

---

## 13. Future Extensions

- Multi-character dialogue scenes
- AI director feedback loop
- Manual shot overrides
- Live collaboration
- Film grammar learning mode

---

## 14. Success Metrics

- Visual consistency score
- Stitch smoothness score
- Time-to-final-video
- User control satisfaction
- Professional adoption rate

---

## 15. Positioning Statement

**DLM Director is not a video generator.**  
It is an **AI film director, cinematographer, and editor combined into one professional system.**

