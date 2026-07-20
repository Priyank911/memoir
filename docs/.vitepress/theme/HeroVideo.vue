<script setup lang="ts">
import { ref } from 'vue'

const isPlaying = ref(false)

function playVideo() {
  isPlaying.value = true
}
</script>

<template>
  <div class="hero-video-card">
    <div class="video-terminal-header">
      <div class="terminal-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="video-title">SHOWCASE_DEMO.MP4</div>
    </div>
    
    <div class="video-container">
      <div v-if="!isPlaying" class="video-cover" @click="playVideo">
        <img 
          src="https://img.youtube.com/vi/c60GPODuHI4/maxresdefault.jpg" 
          alt="Memoir Video Cover" 
          class="cover-image"
          @error="(e) => { 
            // Fallback to standard quality if maxres isn't available
            (e.target as HTMLImageElement).src = 'https://img.youtube.com/vi/c60GPODuHI4/0.jpg' 
          }"
        />
        <div class="play-overlay">
          <div class="play-button">
            <span class="play-icon">►</span>
          </div>
          <span class="play-text">PLAY SHOWCASE</span>
        </div>
      </div>
      <iframe
        v-else
        class="video-iframe"
        src="https://www.youtube.com/embed/c60GPODuHI4?autoplay=1"
        title="Memoir SDK Showcase"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.hero-video-card {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  border: 2px solid var(--vp-c-text-1);
  box-shadow: 6px 6px 0px 0px var(--vp-c-divider);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background-color: var(--vp-c-bg-elv);
}

.hero-video-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0px 0px var(--vp-c-text-1);
}

.video-terminal-header {
  background-color: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Pixelify Sans', sans-serif;
  font-size: 13px;
  font-weight: bold;
  border-bottom: 2px solid var(--vp-c-text-1);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-bg);
}

.dot.red { background-color: #ff5f56; }
.dot.yellow { background-color: #ffbd2e; }
.dot.green { background-color: #27c93f; }

.video-title {
  margin: 0;
  flex-grow: 1;
  text-align: center;
  letter-spacing: 0.05em;
}

.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}

.video-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.75;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.video-cover:hover .cover-image {
  transform: scale(1.03);
  opacity: 0.9;
}

.play-overlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #fff;
  z-index: 2;
}

.play-button {
  width: 60px;
  height: 60px;
  background-color: rgba(0, 0, 0, 0.75);
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.video-cover:hover .play-button {
  background-color: var(--vp-c-text-1);
  transform: scale(1.1);
  border-color: var(--vp-c-text-1);
}

.play-icon {
  font-size: 24px;
  margin-left: 4px;
  color: #fff;
}

.play-text {
  font-family: 'Pixelify Sans', sans-serif;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.video-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
