/* ============================================================
   ARM OF GOD MINISTRIES — YOUTUBE LIVE INTEGRATION
   File: js/live.js
   ============================================================ */

'use strict';

/* ========================================
   YouTube Configuration
   ========================================
   Replace YOUR_API_KEY with your actual YouTube Data API v3 key.
   Get one at: https://console.cloud.google.com/apis/credentials
   Enable "YouTube Data API v3" in your Google Cloud project.
*/
const YOUTUBE_API_KEY    = 'AIzaSyBL0pjj7u_pbgnnV0X1vr5c81cFQBawt2w';
const YOUTUBE_CHANNEL_ID = 'UCCbO3jYriEBWOfFD70xA1rA';

/* ========================================
   Settings
   ======================================== */
const LIVE_POLL_INTERVAL_MS = 3 * 60 * 1000;  // 3 minutes between live checks
const RECENT_VIDEOS_COUNT   = 9;               // how many recent videos to show

/* ========================================
   YouTube API Base URL
   ======================================== */
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/* ========================================
   Internal State
   ======================================== */
let _currentVideoId      = null;
let _isLive              = false;
let _pollTimer           = null;
let _uploadsPlaylistId   = null;   // cached so we only fetch it once

/* ============================================================
   LIVE STATUS CHECK
   Uses: search?part=id&channelId=...&type=video&eventType=live
   This is the cheapest call (only 100 quota units, returns id only).
   eventType=live means ONLY currently-active broadcasts.
   Upcoming (eventType=upcoming) and completed are excluded.
   ============================================================ */

/**
 * Check whether the channel currently has an active live broadcast.
 * Returns an object: { isLive: bool, videoId: string|null }
 */
async function checkLiveStatus() {
  const url = new URL(`${YT_API_BASE}/search`);
  url.searchParams.set('part',       'id');
  url.searchParams.set('channelId',  YOUTUBE_CHANNEL_ID);
  url.searchParams.set('type',       'video');
  url.searchParams.set('eventType',  'live');   // ONLY active streams, not upcoming/completed
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('key',        YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errData);
  }

  const data = await response.json();
  const items = data.items || [];

  if (items.length > 0 && items[0].id && items[0].id.videoId) {
    return { isLive: true, videoId: items[0].id.videoId };
  }

  return { isLive: false, videoId: null };
}

/* ============================================================
   UPLOADS PLAYLIST
   Fetches the channel's uploads playlist ID once and caches it.
   Cost: 1 quota unit (channels?part=contentDetails)
   ============================================================ */

/**
 * Get (and cache) the channel's uploads playlist ID.
 * @returns {string} playlistId
 */
async function getUploadsPlaylistId() {
  if (_uploadsPlaylistId) return _uploadsPlaylistId;

  const url = new URL(`${YT_API_BASE}/channels`);
  url.searchParams.set('part',  'contentDetails');
  url.searchParams.set('id',    YOUTUBE_CHANNEL_ID);
  url.searchParams.set('key',   YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errData);
  }

  const data  = await response.json();
  const items = data.items || [];

  if (!items.length || !items[0].contentDetails) {
    throw new Error('Channel not found or no contentDetails returned.');
  }

  _uploadsPlaylistId = items[0].contentDetails.relatedPlaylists.uploads;
  return _uploadsPlaylistId;
}

/* ============================================================
   RECENT VIDEOS
   Uses playlistItems to retrieve recent uploads.
   Separate from live-status check to avoid wasted quota.
   ============================================================ */

/**
 * Retrieve recent uploaded videos for the channel.
 * @param {number} maxResults  Number of videos to fetch (default: RECENT_VIDEOS_COUNT)
 * @returns {Array}  Array of video item objects
 */
async function getRecentVideos(maxResults = RECENT_VIDEOS_COUNT) {
  const playlistId = await getUploadsPlaylistId();

  const url = new URL(`${YT_API_BASE}/playlistItems`);
  url.searchParams.set('part',       'snippet');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', maxResults);
  url.searchParams.set('key',        YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errData);
  }

  const data = await response.json();
  return data.items || [];
}

/* ============================================================
   RENDER — LIVE STREAM
   ============================================================ */

/**
 * Render the embedded live stream player.
 * @param {string} videoId  YouTube video ID of the active livestream
 */
function renderLiveStream(videoId) {
  const playerContainer = document.getElementById('livePlayerRatio');
  if (!playerContainer) return;

  // Build the iframe dynamically — videoId is always from the API
  const iframe = document.createElement('iframe');
  iframe.src   = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  iframe.title = 'ArmOfGodTV Live Stream';
  iframe.setAttribute('allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  );
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'eager');

  // Clear any previous player and inject
  playerContainer.innerHTML = '';
  playerContainer.appendChild(iframe);
}

/* ============================================================
   RENDER — RECENT VIDEOS GRID
   ============================================================ */

/**
 * Render the recent-videos grid from playlistItems API response.
 * @param {Array} items  Array of playlistItem objects from the API
 */
function renderVideos(items) {
  const grid = document.getElementById('videosGrid');
  if (!grid) return;

  if (!items || items.length === 0) {
    showVideosError('No videos found for this channel.');
    return;
  }

  grid.innerHTML = '';

  items.forEach((item) => {
    const snippet  = item.snippet;
    if (!snippet) return;

    const videoId  = snippet.resourceId && snippet.resourceId.videoId;
    if (!videoId) return;   // skip items without a valid video ID

    const title    = snippet.title       || 'Untitled Video';
    const thumb    = getBestThumbnail(snippet.thumbnails);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pubDate  = snippet.publishedAt ? formatDate(snippet.publishedAt) : '';

    const card = document.createElement('a');
    card.href        = videoUrl;
    card.target      = '_blank';
    card.rel         = 'noopener noreferrer';
    card.className   = 'video-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Watch: ${title}`);

    card.innerHTML = `
      <div class="video-card-thumb">
        <img src="${thumb}" alt="${escapeHtml(title)}" loading="lazy" />
        <div class="video-card-play" aria-hidden="true">
          <i class="fa-solid fa-play"></i>
        </div>
      </div>
      <div class="video-card-body">
        <h4 class="video-card-title">${escapeHtml(title)}</h4>
        ${pubDate ? `<span class="video-card-date">${pubDate}</span>` : ''}
      </div>
    `;

    grid.appendChild(card);
  });

  show('videosGrid');
  show('videosMore');
}

/* ============================================================
   UPDATE NAVBAR LIVE INDICATOR
   Updates ALL instances of the Watch Live nav item on the page.
   Called both from initLivePage() and from the navbar polling
   script included on every page.
   ============================================================ */

/**
 * Update the navbar Watch Live item to reflect current live state.
 * @param {boolean} isLive  Whether the channel is currently live
 */
function updateLiveNavbar(isLive) {
  // Desktop nav link text / dot
  const navText = document.getElementById('navLiveText');
  const navDot  = document.getElementById('navLiveDot');
  const navLink = document.getElementById('navWatchLive');

  if (navText) navText.textContent = isLive ? 'LIVE' : 'Watch Live';
  if (navDot)  navDot.classList.toggle('nav-live-dot--active', isLive);
  if (navLink) navLink.classList.toggle('nav-link--is-live', isLive);

  // Mobile drawer
  const drawerText = document.getElementById('navDrawerLiveText');
  const drawerDot  = document.getElementById('navDrawerLiveDot');
  const drawerLink = document.getElementById('navDrawerWatchLive');

  if (drawerText) drawerText.textContent = isLive ? 'LIVE' : 'Watch Live';
  if (drawerDot)  drawerDot.classList.toggle('nav-live-dot--active', isLive);
  if (drawerLink) drawerLink.classList.toggle('nav-drawer-link--is-live', isLive);
}

/* ============================================================
   PAGE INIT — LIVE PAGE
   Only runs on live.html. Checks status, renders appropriate state.
   ============================================================ */

async function initLivePage() {
  // Reset UI to loading state
  hide('liveStreamWrap');
  hide('liveNotLiveWrap');
  hide('liveApiError');
  show('liveLoading');

  try {
    const { isLive, videoId } = await checkLiveStatus();
    _isLive       = isLive;
    _currentVideoId = videoId;

    // Update navbar regardless of state
    updateLiveNavbar(isLive);

    hide('liveLoading');

    if (isLive && videoId) {
      // ── LIVE STATE ──────────────────────────────────────────
      console.log('[ArmOfGodTV] Channel is LIVE. Video ID:', videoId);
      show('liveStreamWrap');
      renderLiveStream(videoId);
    } else {
      // ── NOT LIVE STATE ──────────────────────────────────────
      console.log('[ArmOfGodTV] Channel is NOT live. Loading recent videos.');
      show('liveNotLiveWrap');
      loadRecentVideos();
    }

  } catch (err) {
    console.error('[ArmOfGodTV] Live status check failed:', err.message || err);
    hide('liveLoading');
    showPageError(friendlyError(err));
  }
}

/* ============================================================
   LOAD RECENT VIDEOS (called when not live)
   ============================================================ */

async function loadRecentVideos() {
  hide('videosGrid');
  hide('videosMore');
  hide('videosError');
  show('videosLoading');

  try {
    const items = await getRecentVideos(RECENT_VIDEOS_COUNT);
    hide('videosLoading');
    renderVideos(items);
  } catch (err) {
    console.error('[ArmOfGodTV] Failed to load recent videos:', err.message || err);
    hide('videosLoading');
    showVideosError(friendlyError(err));
  }
}

/* ============================================================
   NAVBAR-ONLY LIVE CHECK
   Used on non-live pages to keep the navbar badge up to date.
   Only updates the navbar — does NOT load videos.
   Called from the inline script added to every page's <head>.
   ============================================================ */

async function checkAndUpdateNavbar() {
  // Don't run if API key hasn't been set
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY') return;

  try {
    const { isLive } = await checkLiveStatus();
    updateLiveNavbar(isLive);
    console.log('[ArmOfGodTV] Navbar live check:', isLive ? 'LIVE' : 'not live');
  } catch (err) {
    // Silently fail on navbar-only checks — don't break the page
    console.warn('[ArmOfGodTV] Navbar live check failed:', err.message || err);
  }
}

/* ============================================================
   POLLING — AUTOMATIC LIVE STATUS REFRESH
   Polls on the live page to update the player automatically.
   On other pages, polling is done via startNavbarPolling().
   ============================================================ */

function startLivePagePolling() {
  if (_pollTimer) clearInterval(_pollTimer);

  _pollTimer = setInterval(async () => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY') return;

    try {
      const { isLive, videoId } = await checkLiveStatus();
      const wasLive = _isLive;
      _isLive = isLive;

      updateLiveNavbar(isLive);

      if (isLive && !wasLive) {
        // Channel just went LIVE — switch to player
        console.log('[ArmOfGodTV] Channel just went live! Showing player.');
        _currentVideoId = videoId;
        hide('liveNotLiveWrap');
        show('liveStreamWrap');
        renderLiveStream(videoId);
      } else if (!isLive && wasLive) {
        // Channel just ended stream — switch to recent videos
        console.log('[ArmOfGodTV] Channel went offline. Showing recent videos.');
        _currentVideoId = null;
        const playerContainer = document.getElementById('livePlayerRatio');
        if (playerContainer) playerContainer.innerHTML = '';
        hide('liveStreamWrap');
        show('liveNotLiveWrap');
        loadRecentVideos();
      }
      // else: no state change, nothing to update

    } catch (err) {
      console.warn('[ArmOfGodTV] Polling check failed:', err.message || err);
    }
  }, LIVE_POLL_INTERVAL_MS);
}

/**
 * Start navbar-only polling for non-live pages.
 * Only polls live status, does not touch page content.
 */
function startNavbarPolling() {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY') return;

  // Initial check
  checkAndUpdateNavbar();

  // Periodic poll
  setInterval(checkAndUpdateNavbar, LIVE_POLL_INTERVAL_MS);
}

/* ============================================================
   ERROR HELPERS
   ============================================================ */

class APIError extends Error {
  constructor(status, data) {
    const msg = data && data.error && data.error.message
      ? data.error.message
      : `HTTP ${status}`;
    super(msg);
    this.status  = status;
    this.apiData = data;
  }
}

/**
 * Convert API errors into user-friendly messages.
 */
function friendlyError(err) {
  if (!err) return 'An unexpected error occurred.';

  const msg = err.message || '';

  if (err.status === 403 || msg.includes('forbidden') || msg.includes('quotaExceeded')) {
    return 'The YouTube API quota has been exceeded or the API key is invalid. Please check your configuration.';
  }
  if (err.status === 400 || msg.includes('invalid')) {
    return 'Invalid API request. Please check the Channel ID and API key configuration.';
  }
  if (!navigator.onLine || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'A network error occurred. Please check your internet connection and try again.';
  }
  if (err.status >= 500) {
    return 'The YouTube API is temporarily unavailable. Please try again in a moment.';
  }

  return 'Unable to connect to YouTube. Please refresh the page or try again later.';
}

function showPageError(message) {
  const msgEl = document.getElementById('liveApiErrorMsg');
  if (msgEl) msgEl.textContent = message;
  show('liveApiError');
}

function showVideosError(message) {
  const msgEl = document.getElementById('videosErrorMsg');
  if (msgEl) msgEl.textContent = message;
  show('videosError');
}

/* ============================================================
   DOM UTILITIES
   ============================================================ */

function show(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Pick the best available thumbnail from the thumbnails object.
 * Prefers: maxres > standard > high > medium > default
 */
function getBestThumbnail(thumbnails) {
  if (!thumbnails) return 'https://i.ytimg.com/vi/default/hqdefault.jpg';
  const pref = ['maxres', 'standard', 'high', 'medium', 'default'];
  for (const size of pref) {
    if (thumbnails[size] && thumbnails[size].url) return thumbnails[size].url;
  }
  return 'https://i.ytimg.com/vi/default/hqdefault.jpg';
}

/**
 * Format an ISO date string to a readable date.
 */
function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleDateString('en-ZA', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    });
  } catch {
    return '';
  }
}

/* ============================================================
   ENTRY POINT — Run on DOMContentLoaded
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Guard: only run full live page logic if we're on live.html
  const isLivePage = !!document.getElementById('liveContent');

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY') {
    console.warn(
      '[ArmOfGodTV] YouTube API key is not set.\n' +
      'Open js/live.js and replace YOUR_API_KEY with your actual key.\n' +
      'Get a key at: https://console.cloud.google.com/apis/credentials'
    );

    if (isLivePage) {
      hide('liveLoading');
      showPageError(
        'YouTube API key is not configured. Please add your API key to js/live.js to enable live detection.'
      );
    }
    return;
  }

  if (isLivePage) {
    // Full live page: check status, render, start polling
    initLivePage().then(() => {
      startLivePagePolling();
    });
  } else {
    // All other pages: navbar-only polling
    startNavbarPolling();
  }
});
