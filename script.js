import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector(".space-canvas");
const timeline = document.querySelector(".timeline");
const slider = document.querySelector("#yearSlider");
const output = document.querySelector(".year-output");
const stepper = document.querySelector(".stepper");
const previousYearButton = document.querySelector(".year-step-previous");
const nextYearButton = document.querySelector(".year-step-next");
const sliderControl = document.querySelector(".slider-control");
const timelineMin = document.querySelector(".timeline-min");
const timelineMax = document.querySelector(".timeline-max");
const learnOpen = document.querySelector(".learn-open");
const learnOverlay = document.querySelector(".learn-overlay");
const learnDialog = document.querySelector(".learn-dialog");
const learnClose = document.querySelector(".learn-close");
const movieDetailOverlay = document.querySelector(".movie-detail-overlay");
const movieDetailContent = document.querySelector(".movie-detail-content");
const movieDetailPanel = document.querySelector(".movie-detail-panel");
const movieDetailClose = document.querySelector(".movie-detail-close");
const movieDetailShare = document.querySelector(".movie-detail-share");
const movieDetailPoster = document.querySelector(".movie-detail-poster");
const movieDetailPosterFallback = document.querySelector(".movie-detail-poster-fallback");
const movieDetailPosterFallbackTitle = document.querySelector(".movie-detail-poster-fallback-title");
const movieDetailPosterFallbackYear = document.querySelector(".movie-detail-poster-fallback-year");
const movieDetailTitle = document.querySelector("#movieDetailTitle");
const movieDetailRating = document.querySelector(".movie-detail-rating");
const movieDetailYear = document.querySelector(".movie-detail-year");
const movieDetailOverview = document.querySelector(".movie-detail-overview");
const movieDetailGenres = document.querySelector(".movie-detail-genres");
const movieDetailDirector = document.querySelector(".movie-detail-director");
const movieDetailCast = document.querySelector(".movie-detail-cast");
const movieDetailAwards = document.querySelector(".movie-detail-awards");
const movieRelatedList = document.querySelector(".movie-related-list");
const personFilter = document.querySelector(".person-filter");
const personFilterLabel = document.querySelector(".person-filter-label");
const personFilterClear = document.querySelector(".person-filter-clear");
const movieFocusFilter = document.querySelector(".movie-focus-filter");
const movieFocusLabel = document.querySelector(".movie-focus-label");
const movieFocusClear = document.querySelector(".movie-focus-clear");
const filterOpen = document.querySelector(".filter-open");
const filterOverlay = document.querySelector(".filter-overlay");
const filterDialog = document.querySelector(".filter-dialog");
const filterClose = document.querySelector(".filter-close");
const filterClear = document.querySelector(".filter-clear");
const filterCount = document.querySelector(".filter-count");
const genreInputs = document.querySelectorAll('input[name="genre"]');
const durationInputs = document.querySelectorAll('input[name="duration"]');
const awardInputs = document.querySelectorAll('input[name="award"]');
const regionInputs = document.querySelectorAll('input[name="region"]');
const themeToggle = document.querySelector(".theme-toggle");
const dataStatus = document.querySelector(".data-status");
const ratingFilterPopover = document.querySelector(".rating-filter-popover");
const ratingFilterClose = document.querySelector(".rating-filter-close");
const ratingFilterClear = document.querySelector(".rating-filter-clear");
const ratingMinInput = document.querySelector("#ratingMin");
const ratingMaxInput = document.querySelector("#ratingMax");
const ratingMinOutput = document.querySelector(".rating-min-output");
const ratingMaxOutput = document.querySelector(".rating-max-output");
const ratingFilterResult = document.querySelector(".rating-filter-result");
const stage = document.querySelector(".movie-space");
const movieSearch = document.querySelector(".movie-search");
const searchOpen = document.querySelector(".search-open");
const searchPanel = document.querySelector(".search-panel");
const searchInput = document.querySelector(".search-input");
const searchResults = document.querySelector(".search-results");
const searchEmpty = document.querySelector(".search-empty");
const searchStatus = document.querySelector(".search-status");
const mapModeControls = document.querySelectorAll(".map-mode-control");
const topbar = document.querySelector(".topbar");
const activeFilterChips = document.querySelector(".active-filter-chips");
const selectedFilterChips = document.querySelector(".selected-filter-chips");
const emotionStage = document.querySelector(".emotion-stage");
const emotionMapShell = document.querySelector(".emotion-map-shell");
const emotionCanvas = document.querySelector(".emotion-canvas");
const emotionContext = emotionCanvas.getContext("2d");
const emotionAnchorLayer = document.querySelector(".emotion-anchor-layer");
const emotionStatus = document.querySelector(".emotion-status");
const emotionTooltip = document.querySelector(".emotion-tooltip");
const emotionLegend = document.querySelector(".emotion-legend");
const emotionZoomIn = document.querySelector(".emotion-zoom-in");
const emotionZoomOut = document.querySelector(".emotion-zoom-out");
const movieEmotionProfile = document.querySelector(".movie-emotion-profile");
const movieEmotionConfidence = document.querySelector(".movie-emotion-confidence");
const movieEmotionBars = document.querySelector(".movie-emotion-bars");
const movieEmotionNote = document.querySelector(".movie-emotion-note");

let emotionLedger = {};

// A compact visual vocabulary for the twelve emotional lenses. These are
// deliberately line-only glyphs so the legend reads like a film interface,
// not a row of generic color swatches or emoji.
const EMOTION_ICON_PATHS = Object.freeze({
  love: '<path d="M8 13.2 2.8 8.3A3.2 3.2 0 0 1 7.4 3.9L8 4.6l.6-.7a3.2 3.2 0 0 1 4.6 4.4Z"/>',
  humor: '<circle cx="8" cy="8" r="5.7"/><path d="M5.2 9.2c.8 1.4 1.7 2 2.8 2s2-.6 2.8-2M5.5 6.3h.1M10.4 6.3h.1"/>',
  uplift: '<path d="M8 13V3M4.2 6.8 8 3l3.8 3.8M3.5 13h9"/>',
  wonder: '<path d="m8 2 .8 3.2L12 6l-3.2.8L8 10l-.8-3.2L4 6l3.2-.8Z"/><path d="m12.7 10.5.4 1.3 1.3.4-1.3.4-.4 1.3-.4-1.3-1.3-.4 1.3-.4Z"/>',
  tenderness: '<path d="M8 13.2 2.8 8.3A3.2 3.2 0 0 1 7.4 3.9L8 4.6l.6-.7a3.2 3.2 0 0 1 4.6 4.4Z"/><path d="M5.2 7.8h.1M10.7 7.8h.1"/>',
  excitement: '<path d="M8 2v3M8 11v3M2 8h3M11 8h3M3.8 3.8l2.1 2.1M10.1 10.1l2.1 2.1M12.2 3.8l-2.1 2.1M5.9 10.1l-2.1 2.1"/>',
  intrigue: '<circle cx="8" cy="8" r="5.7"/><path d="M6.3 6.2a1.9 1.9 0 1 1 3.3 1.3c-.9.8-1.6 1.1-1.6 2.2M8 12h.1"/>',
  tension: '<path d="M3 5.2 5.5 3l2.5 2.2L10.5 3 13 5.2M3 10.8 5.5 13 8 10.8l2.5 2.2 2.5-2.2"/>',
  frustration: '<path d="m3 3 10 10M13 3 3 13"/><path d="M8 2v2M8 12v2"/>',
  sorrow: '<path d="M8 2.3c2.8 3.2 4.3 5.3 4.3 7.2a4.3 4.3 0 1 1-8.6 0C3.7 7.6 5.2 5.5 8 2.3Z"/><path d="M6.1 10.1c.4 1 1 1.5 1.9 1.7"/>',
  aversion: '<circle cx="8" cy="8" r="5.7"/><path d="m5.5 5.5 5 5M10.5 5.5l-5 5"/>',
  neutrality: '<circle cx="8" cy="8" r="5.7"/><path d="M5.2 9h5.6"/>',
});

function createEmotionIcon(emotion) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  icon.classList.add("emotion-legend-icon");
  icon.style.setProperty("--emotion-color", emotionColor(emotion));
  icon.innerHTML = EMOTION_ICON_PATHS[emotion] || EMOTION_ICON_PATHS.neutrality;
  icon.querySelectorAll("path, circle").forEach((shape) => {
    shape.setAttribute("fill", "none");
    shape.setAttribute("stroke", "currentColor");
    shape.setAttribute("stroke-width", "1.35");
    shape.setAttribute("stroke-linecap", "round");
    shape.setAttribute("stroke-linejoin", "round");
  });
  icon.style.color = emotionColor(emotion);
  return icon;
}

function emotionPalette(emotion) {
  const config = emotionLedger[emotion];
  const fallback = config?.color || "#7a858a";
  return {
    deep: config?.palette?.deep || fallback,
    mid: config?.palette?.mid || fallback,
    flare: config?.palette?.flare || fallback,
  };
}

function emotionColor(emotion) {
  return emotionPalette(emotion).flare;
}

function mixEmotionColors(first, second, amount) {
  const start = hexToRgb(first);
  const end = hexToRgb(second);
  const t = clamp(amount, 0, 1);
  return `rgb(${Math.round(start.r + (end.r - start.r) * t)}, ${Math.round(start.g + (end.g - start.g) * t)}, ${Math.round(start.b + (end.b - start.b) * t)})`;
}

function emotionEdgeColor(emotion, intensity = 0) {
  const palette = emotionPalette(emotion);
  return mixEmotionColors(palette.flare, palette.mid, clamp(intensity, 0, 1) * 0.7);
}

function movieEmotionIntensity(movie, emotion = movie?.emotionProfile?.dominantEmotion) {
  if (!emotion) return 0;
  const profile = movie?.emotionProfile;
  return clamp(
    Number(profile?.displayWeights?.[emotion] ?? profile?.emotionScores?.[emotion]) || 0,
    0,
    1,
  );
}

function emotionLabel(emotion) {
  return emotionLedger[emotion]?.label || emotion;
}

function emotionAnchor(emotion) {
  return emotionLedger[emotion]?.anchor;
}

const WORLD = {
  maxRadius: 115,
  minRadius: 4,
  zScale: 0.45,
  cardWidth: 5.4,
  cardHeight: 7.2,
};

let movies = [];
let movieGroup;
let camera;
let controls;
let renderer;
let scene;
let availableYears = [];
let movieRenderFrame = null;
let selectedMovieYear = null;
const ratingLabels = [];
const ratingRings = [];
let imdbMarker = null;
let minimumRating = 1;
let maximumRating = 10;
let labelsInspectMode = null;
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
textureLoader.setCrossOrigin("anonymous");
const posterTextureRecords = new Map();
const posterTextureQueue = [];
const MAX_CONCURRENT_POSTER_LOADS = 8;
let activePosterTextureLoads = 0;
let hoveredCard = null;
let pointerDownPosition = null;
let movieDetailCloseTimer = null;
let activeDetailMovie = null;
let activePersonFilter = null;
let activeSearchResult = -1;
let searchFocusMovie = null;
let cameraTravelFrame = null;
let movieFocusOpenTimer = null;
let orbitFocusMovie = null;
let filterCloseTimer = null;
let learnCloseTimer = null;
let searchCloseTimer = null;
let emotionalMode = false;
let emotionalData = null;
let emotionalProfiles = new Map();
let emotionalMovies = [];
let emotionRenderedMovies = [];
let emotionHoveredMovie = null;
let emotionHoverProgress = 0;
let emotionHoverTarget = 0;
let emotionHoverAnimationFrame = null;
let emotionHoverLastTime = 0;
let emotionSelectedMovie = null;
let activeEmotionFilter = null;
let emotionPointerDown = null;
let emotionHasDragged = false;
const emotionPointers = new Map();
let emotionPinch = null;
const emotionView = { zoom: 1, offsetX: 0, offsetY: 0 };
let emotionCloudRevision = 0;
let emotionCloudCache = { key: "", canvas: null };
let emotionConstellationCache = { key: "", edges: [] };
let emotionViewportCache = null;
let emotionInteractionActive = false;
let emotionInteractionEndTimer = null;
const dialogReturnFocus = new WeakMap();
const controlLockingOverlays = new WeakSet();
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileViewportQuery = window.matchMedia("(max-width: 720px)");
const EMOTION_FILTER_THRESHOLD = 0.15;

function usesOverlappingLenses() {
  return emotionalData?.taxonomyVersion === 3;
}

function movieMatchesEmotionFilter(movie) {
  if (!activeEmotionFilter) return true;
  const profile = movie.emotionProfile;
  if (usesOverlappingLenses()) {
    return (profile?.emotionScores?.[activeEmotionFilter] || 0) >= EMOTION_FILTER_THRESHOLD;
  }
  return profile?.dominantEmotion === activeEmotionFilter;
}

function updateLayoutOffsets() {
  stage.style.setProperty("--header-height", `${Math.ceil(topbar.getBoundingClientRect().height)}px`);
  stage.style.setProperty("--filter-chips-height", `${Math.ceil(activeFilterChips.getBoundingClientRect().height)}px`);
  if (stage.classList.contains("filters-open") && !filterOverlay.hidden) {
    stage.style.setProperty("--filter-subbar-height", `${Math.ceil(filterDialog.getBoundingClientRect().height)}px`);
  }
}

const headerObserver = new ResizeObserver(updateLayoutOffsets);
headerObserver.observe(topbar);
headerObserver.observe(activeFilterChips);
updateLayoutOffsets();

// The filter ribbon changes the Galaxy's available height without firing a
// window resize. Keep the canvas drawing buffer matched to its CSS box so
// Safari never stretches a stale frame or displays a duplicated map.
const emotionLayoutObserver = new ResizeObserver(() => {
  if (emotionalMode && !emotionStage.hidden) resizeEmotionCanvas();
});
emotionLayoutObserver.observe(emotionMapShell);

function updateMapModeControls(mode) {
  mapModeControls.forEach((control) => {
    const isActive = control.getAttribute("href") === (mode === "emotional" ? "#emotional-map" : "#rating-map");
    control.classList.toggle("is-active", isActive);
    if (isActive) control.setAttribute("aria-current", "page");
    else control.removeAttribute("aria-current");
  });
}

updateMapModeControls(window.location.hash === "#emotional-map" ? "emotional" : "rating");

function getFocusableElements(container) {
  return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hidden && element.getClientRects().length);
}

function openAccessibleDialog(overlay, dialog, initialFocus, fallbackFocus, { disableControls = true } = {}) {
  if (overlay.hidden) {
    dialogReturnFocus.set(overlay, document.activeElement instanceof HTMLElement ? document.activeElement : fallbackFocus);
  }
  overlay.hidden = false;
  if (disableControls) {
    controlLockingOverlays.add(overlay);
    controls.enabled = false;
  }
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    initialFocus.focus();
  });
}

function closeAccessibleDialog(overlay, fallbackFocus, delay, { restoreFocus = true, returnFocus: requestedReturnFocus, onComplete } = {}) {
  overlay.classList.remove("is-visible");
  return window.setTimeout(() => {
    overlay.hidden = true;
    if (controlLockingOverlays.has(overlay)) {
      controlLockingOverlays.delete(overlay);
      controls.enabled = true;
    }
    const returnFocus = requestedReturnFocus || dialogReturnFocus.get(overlay) || fallbackFocus;
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    onComplete?.();
  }, reducedMotionQuery.matches ? 0 : delay);
}

function trapDialogFocus(event, overlay, dialog) {
  if (event.key !== "Tab" || overlay.hidden) return;
  const focusable = getFocusableElements(dialog);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function colorFromString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return new THREE.Color(`hsl(${Math.abs(hash) % 360}, 58%, 48%)`);
}

function cleanMovie(movie) {
  const title = String(movie.title || "").trim();
  const year = Number(movie.year);
  const imdbRating = Number(movie.imdbRating);

  if (!title || !Number.isFinite(year) || !Number.isFinite(imdbRating)) {
    return null;
  }

  return {
    ...movie,
    title,
    year,
    imdbRating: clamp(imdbRating, 1, 10),
    posterUrl: movie.posterUrl || movie.cover || movie.poster || movie.poster_path || null,
    color: colorFromString(movie.genres || title),
  };
}

function movieShareKey(movie) {
  if (movie.imdbId) return String(movie.imdbId);
  const slug = movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${movie.year}-${slug}`;
}

function movieShareUrl(movie) {
  const url = new URL(window.location.href);
  url.searchParams.set("movie", movieShareKey(movie));
  return url.href;
}

function movieFromSharedUrl() {
  const key = new URLSearchParams(window.location.search).get("movie");
  return key ? movies.find((movie) => movieShareKey(movie) === key) || null : null;
}

function getRadiusFromRating(
  rating,
  minRadius = WORLD.minRadius,
  maxRadius = WORLD.maxRadius,
) {
  const clampedRating = clamp(Number(rating), 1, 10);
  return minRadius + ((10 - clampedRating) / 9) * (maxRadius - minRadius);
}

function makeLine(points, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Line(geometry, material);
}

function createEllipseRing(radius, color = 0xf7f7f2, opacity = 0.24) {
  const points = [];
  const segments = 240;

  for (let index = 0; index <= segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius * WORLD.zScale,
      ),
    );
  }

  return makeLine(points, color, opacity);
}

function createTextTexture(text, options = {}) {
  const {
    width = 256,
    height = 96,
    font = "700 38px Arial",
    color = "#e4ce00",
    background = "transparent",
    border = null,
    shadow = false,
    shape = "rect",
  } = options;
  const canvasElement = document.createElement("canvas");
  canvasElement.width = width;
  canvasElement.height = height;
  const context = canvasElement.getContext("2d");

  context.clearRect(0, 0, width, height);
  if (background !== "transparent") {
    context.fillStyle = background;
    if (shape === "circle") {
      context.beginPath();
      context.arc(width / 2, height / 2, Math.min(width, height) / 2 - 5, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(0, 0, width, height);
    }
  }

  if (border) {
    context.strokeStyle = border;
    context.lineWidth = 6;
    if (shape === "circle") {
      context.beginPath();
      context.arc(width / 2, height / 2, Math.min(width, height) / 2 - 6, 0, Math.PI * 2);
      context.stroke();
    } else {
      context.strokeRect(3, 3, width - 6, height - 6);
    }
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = font;
  context.fillStyle = color;
  if (shadow) {
    context.shadowColor = "rgba(255,255,255,0.55)";
    context.shadowBlur = 12;
  }
  context.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createTextSprite(text, options = {}) {
  const texture = createTextTexture(text, options);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: options.depthTest ?? true,
    depthWrite: options.depthWrite ?? true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(options.worldWidth ?? 12, options.worldHeight ?? 4, 1);
  sprite.renderOrder = options.renderOrder ?? 0;
  return sprite;
}

function createMovieCard(movie) {
  const fallbackTexture = createFallbackPosterTexture(movie);
  const material = new THREE.SpriteMaterial({
    map: fallbackTexture,
    transparent: true,
    depthTest: true,
  });
  material.userData.posterCancelled = false;
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(WORLD.cardWidth, WORLD.cardHeight, 1);
  sprite.renderOrder = 100;
  sprite.userData.movie = movie;
  sprite.userData.targetScale = 1;

  if (movie.posterUrl) {
    const fullPosterUrl = String(movie.posterUrl).trim();
    loadMoviePosterTexture(orbitPosterPreviewUrl(fullPosterUrl), material, () => {
      if (!material.userData.posterCancelled) {
        loadMoviePosterTexture(fullPosterUrl, material, null, true);
      }
    });
  }

  return sprite;
}

function orbitPosterPreviewUrl(url) {
  // Show a lightweight preview promptly, then replace it with the original
  // w500 texture. The preview prevents an initials card during the full load;
  // it is not the final Orbit artwork.
  return String(url || "").replace("/t/p/w500/", "/t/p/w185/");
}

function applyPosterTexture(material, posterTexture) {
  if (material.userData.posterCancelled) return;
  const previousTexture = material.map;
  material.map = posterTexture;
  material.needsUpdate = true;
  if (previousTexture?.isCanvasTexture && previousTexture !== posterTexture) {
    previousTexture.dispose();
  }
}

function pumpPosterTextureQueue() {
  while (activePosterTextureLoads < MAX_CONCURRENT_POSTER_LOADS && posterTextureQueue.length) {
    const record = posterTextureQueue.shift();
    if (!record || record.status !== "queued") continue;
    record.status = "loading";
    activePosterTextureLoads += 1;
    textureLoader.load(
      record.url,
      (posterTexture) => {
        activePosterTextureLoads -= 1;
        posterTexture.colorSpace = THREE.SRGBColorSpace;
        posterTexture.minFilter = THREE.LinearFilter;
        posterTexture.magFilter = THREE.LinearFilter;
        record.status = "loaded";
        record.texture = posterTexture;
        record.materials.forEach((material) => applyPosterTexture(material, posterTexture));
        record.materials.clear();
        record.completions.forEach((completion) => completion(true));
        record.completions.clear();
        pumpPosterTextureQueue();
      },
      undefined,
      () => {
        activePosterTextureLoads -= 1;
        record.attempts += 1;
        if (record.attempts < 4) {
          record.status = "waiting";
          window.setTimeout(() => {
            record.status = "queued";
            if (record.lowPriority) posterTextureQueue.push(record);
            else posterTextureQueue.unshift(record);
            pumpPosterTextureQueue();
          }, 700 * record.attempts);
        } else {
          record.status = "failed";
          record.materials.clear();
          record.completions.forEach((completion) => completion(false));
          record.completions.clear();
        }
        pumpPosterTextureQueue();
      },
    );
  }
}

function loadMoviePosterTexture(url, material, onComplete = null, lowPriority = false) {
  const normalizedUrl = String(url || "").trim();
  if (!normalizedUrl) return;
  const existing = posterTextureRecords.get(normalizedUrl);
  if (existing?.status === "loaded") {
    applyPosterTexture(material, existing.texture);
    onComplete?.(true);
    return;
  }
  if (existing && existing.status !== "failed") {
    existing.materials.add(material);
    if (onComplete) existing.completions.add(onComplete);
    return;
  }

  const record = {
    url: normalizedUrl,
    status: "queued",
    attempts: 0,
    texture: null,
    lowPriority,
    materials: new Set([material]),
    completions: new Set(onComplete ? [onComplete] : []),
  };
  posterTextureRecords.set(normalizedUrl, record);
  // Visible previews go first; full-resolution upgrades wait behind them so
  // every card gets artwork before bandwidth is spent sharpening it.
  if (lowPriority) posterTextureQueue.push(record);
  else posterTextureQueue.unshift(record);
  pumpPosterTextureQueue();
}

function createFallbackPosterTexture(movie) {
  const color = `#${movie.color.getHexString()}`;
  const darker = movie.color.clone().multiplyScalar(0.28);
  return createTextTexture(movie.title.slice(0, 2).toUpperCase(), {
    width: 180,
    height: 240,
    font: "800 54px Arial",
    color: "rgba(255,255,255,0.9)",
    background: darker.getStyle(),
    border: color,
    shadow: true,
  });
}

function placeMovie(movie, index, total, angleOffset = 0) {
  const radius = getRadiusFromRating(movie.imdbRating);
  const angle = (index / total) * Math.PI * 2 + angleOffset;
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    2.2,
    Math.sin(angle) * radius * WORLD.zScale,
  );
}

function findBestAngleOffset(ratingMovies, occupiedPositions) {
  const candidateCount = 180;
  let bestOffset = 0;
  let bestMinimumDistance = -1;

  for (let candidate = 0; candidate < candidateCount; candidate += 1) {
    const offset = (candidate / candidateCount) * Math.PI * 2;
    const candidatePositions = ratingMovies.map((movie, index) =>
      placeMovie(movie, index, ratingMovies.length, offset),
    );
    let minimumDistance = Infinity;

    candidatePositions.forEach((position, index) => {
      occupiedPositions.forEach((occupiedPosition) => {
        minimumDistance = Math.min(
          minimumDistance,
          position.distanceToSquared(occupiedPosition),
        );
      });

      for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
        minimumDistance = Math.min(
          minimumDistance,
          position.distanceToSquared(candidatePositions[otherIndex]),
        );
      }
    });

    if (minimumDistance > bestMinimumDistance) {
      bestMinimumDistance = minimumDistance;
      bestOffset = offset;
    }
  }

  return bestOffset;
}

function buildRatingSurface() {
  const surface = new THREE.Group();

  for (let rating = 10; rating >= 1; rating -= 1) {
    const ring = createEllipseRing(getRadiusFromRating(rating));
    ratingRings.push(ring);
    surface.add(ring);
  }

  const axis = makeLine(
    [new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(WORLD.maxRadius, 0.08, 0)],
    0xe4ce00,
    1,
  );
  surface.add(axis);

  for (let rating = 10; rating >= 1; rating -= 1) {
    const label = createTextSprite(rating.toFixed(1), {
      width: 180,
      height: 90,
      worldWidth: 10,
      worldHeight: 4,
      font: "800 42px Arial",
      color: "#e4ce00",
      depthTest: false,
      depthWrite: false,
      renderOrder: 1000,
    });
    label.position.set(getRadiusFromRating(rating), 1.4, 0);
    ratingLabels.push(label);
    surface.add(label);
  }

  const imdb = createTextSprite("IMDb", {
    width: 144,
    height: 144,
    worldWidth: 7,
    worldHeight: 7,
    font: "900 34px Arial",
    color: "#111",
    background: "#e4ce00",
    border: "rgba(17, 17, 17, 0.65)",
    shape: "circle",
    depthTest: false,
    depthWrite: false,
    renderOrder: 1000,
  });
  imdb.position.set(WORLD.maxRadius + 12, 1.5, 0);
  imdbMarker = imdb;
  ratingLabels.push(imdb);
  surface.add(imdb);

  return surface;
}

function movieMatchesFilters(movie) {
  if (movie.imdbRating < minimumRating || movie.imdbRating > maximumRating) return false;
  const selectedGenres = new Set(
    [...genreInputs].filter((input) => input.checked).map((input) => input.value),
  );
  const selectedDurations = new Set(
    [...durationInputs].filter((input) => input.checked).map((input) => input.value),
  );
  const selectedAwards = new Set(
    [...awardInputs].filter((input) => input.checked).map((input) => input.value),
  );
  const selectedRegions = new Set(
    [...regionInputs].filter((input) => input.checked).map((input) => input.value),
  );

  if (selectedGenres.size) {
    const movieGenres = new Set(String(movie.genres || "").split("|"));
    if (![...selectedGenres].some((genre) => movieGenres.has(genre))) return false;
  }

  if (selectedDurations.size) {
    const runtime = Number(movie.runtimeMinutes);
    if (!Number.isFinite(runtime) || runtime <= 0) return false;
    const durationMatches =
      (selectedDurations.has("under90") && runtime < 90) ||
      (selectedDurations.has("90to150") && runtime >= 90 && runtime <= 150) ||
      (selectedDurations.has("over150") && runtime > 150);
    if (!durationMatches) return false;
  }

  if (selectedAwards.size) {
    const awardMatches =
      (selectedAwards.has("oscar") && movie.oscarWinner === true) ||
      (selectedAwards.has("festival") && movie.festivalWinner === true);
    if (!awardMatches) return false;
  }

  if (selectedRegions.size) {
    const movieRegions = new Set(movie.regions || []);
    const regionMatches =
      (selectedRegions.has("hollywood") && movie.hollywood === true) ||
      (selectedRegions.has("independent") && movie.independent === true) ||
      [...selectedRegions].some((region) => movieRegions.has(region));
    if (!regionMatches) return false;
  }

  return true;
}

function movieMatchesPerson(movie) {
  if (!activePersonFilter) return true;
  const names = activePersonFilter.role === "director" ? movie.directors || [] : movie.cast || [];
  return names.includes(activePersonFilter.name);
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function emotionViewport() {
  if (!emotionViewportCache) emotionViewportCache = emotionCanvas.getBoundingClientRect();
  return emotionViewportCache;
}

function emotionScales(bounds = emotionViewport()) {
  const horizontalPadding = clamp(bounds.width * 0.045, 42, 78);
  const verticalPadding = clamp(bounds.height * 0.075, 38, 62);
  return {
    x: ((bounds.width - horizontalPadding * 2) / 2) * emotionView.zoom,
    y: ((bounds.height - verticalPadding * 2) / 2) * emotionView.zoom,
    horizontalPadding,
    verticalPadding,
  };
}

function emotionToScreen(profile, bounds = emotionViewport()) {
  const scales = emotionScales(bounds);
  const hasAxisCoordinates = Number.isFinite(profile.axisX) && Number.isFinite(profile.axisY);
  const mapX = hasAxisCoordinates
    ? profile.axisX
    : Number.isFinite(profile.mapX)
      ? clamp(profile.mapX, -1, 1)
      : Number.isFinite(profile.valence)
        ? clamp(profile.valence, -1, 1)
        : 0;
  const mapY = hasAxisCoordinates
    ? profile.axisY
    : Number.isFinite(profile.mapY)
      ? clamp(profile.mapY, -1, 1)
      : Number.isFinite(profile.arousal)
        ? clamp((profile.arousal - 0.5) * 2, -1, 1)
        : 0;
  return {
    x: bounds.width / 2 + mapX * scales.x + emotionView.offsetX,
    y: bounds.height / 2 - mapY * scales.y + emotionView.offsetY,
  };
}

function zoomEmotionAt(targetZoom, screenX, screenY) {
  const bounds = emotionCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const oldScales = emotionScales();
  const worldX = (screenX - bounds.width / 2 - emotionView.offsetX) / oldScales.x;
  const worldY = -(screenY - bounds.height / 2 - emotionView.offsetY) / oldScales.y;
  emotionView.zoom = clamp(targetZoom, 0.7, 5);
  const newScales = emotionScales();
  emotionView.offsetX = screenX - bounds.width / 2 - worldX * newScales.x;
  emotionView.offsetY = screenY - bounds.height / 2 + worldY * newScales.y;
  scheduleEmotionDraw();
}

function zoomEmotionAroundCenter(factor) {
  const bounds = emotionCanvas.getBoundingClientRect();
  zoomEmotionAt(emotionView.zoom * factor, bounds.width / 2, bounds.height / 2);
}

function emotionProfileCoordinates(profile) {
  return {
    x: Number.isFinite(profile?.mapX)
      ? clamp(profile.mapX, -1, 1)
      : Number.isFinite(profile?.valence)
        ? clamp(profile.valence, -1, 1)
        : 0,
    y: Number.isFinite(profile?.mapY)
      ? clamp(profile.mapY, -1, 1)
      : Number.isFinite(profile?.arousal)
        ? clamp((profile.arousal - 0.5) * 2, -1, 1)
        : 0,
  };
}

function emotionNodeRadius(movie) {
  const profile = movie.emotionProfile || {};
  const reviews = Math.max(1, profile.reviewCount || 1);
  const reviewSignal = clamp((reviews - 1) / 24, 0, 1);
  const confidenceSignal = profile.confidenceTier === "high" ? 1 : profile.confidenceTier === "medium" ? 0.5 : 0;
  const zoomGrowth = clamp(Math.sqrt(emotionView.zoom), 0.9, 1.8);
  const evidenceRadius = 1.35 + Math.pow(reviewSignal, 0.68) * 4.9 + confidenceSignal * 0.55;
  return clamp(evidenceRadius, 1.35, 6.8) * zoomGrowth;
}

function getEmotionRenderMovies(bounds, activeMovie) {
  const minimumGap = clamp(26 / Math.sqrt(emotionView.zoom), 7, 26);
  const cellSize = minimumGap;
  const occupied = new Map();
  const rendered = [];

  const addToGrid = (movie, point) => {
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    const key = `${cellX}:${cellY}`;
    const entries = occupied.get(key) || [];
    entries.push({ movie, point });
    occupied.set(key, entries);
  };

  for (let index = emotionalMovies.length - 1; index >= 0; index -= 1) {
    const movie = emotionalMovies[index];
    const point = emotionToScreen(movie.emotionProfile);
    if (point.x < -20 || point.x > bounds.width + 20 || point.y < -20 || point.y > bounds.height + 20) continue;
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    let overlaps = false;

    for (let offsetX = -1; offsetX <= 1 && !overlaps; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1 && !overlaps; offsetY += 1) {
        const nearby = occupied.get(`${cellX + offsetX}:${cellY + offsetY}`) || [];
        overlaps = nearby.some(({ point: otherPoint }) =>
          Math.hypot(point.x - otherPoint.x, point.y - otherPoint.y) < minimumGap,
        );
      }
    }

    if (!overlaps) {
      rendered.push(movie);
      addToGrid(movie, point);
    }
  }

  if (activePersonFilter) {
    emotionalMovies.filter(movieMatchesPerson).forEach((movie) => {
      if (rendered.includes(movie)) return;
      const point = emotionToScreen(movie.emotionProfile);
      if (point.x < -20 || point.x > bounds.width + 20 || point.y < -20 || point.y > bounds.height + 20) return;
      rendered.push(movie);
    });
  }

  if (activeMovie && !rendered.includes(activeMovie)) rendered.push(activeMovie);
  return rendered.sort((first, second) =>
    first.emotionProfile.reviewCount - second.emotionProfile.reviewCount,
  );
}

function prepareEmotionalMovies() {
  emotionalMovies = movies
    .filter((movie) => movie.emotionProfile?.reviewCount > 0)
    .filter(movieMatchesEmotionFilter)
    .filter(movieMatchesFilters)
    .sort((a, b) => a.emotionProfile.reviewCount - b.emotionProfile.reviewCount);
  if (emotionSelectedMovie && !emotionalMovies.includes(emotionSelectedMovie)) {
    emotionSelectedMovie = null;
  }
  if (emotionHoveredMovie && !emotionalMovies.includes(emotionHoveredMovie)) {
    clearEmotionHoverImmediately();
    emotionTooltip.hidden = true;
  }
  emotionCloudRevision += 1;
  emotionCloudCache = { key: "", canvas: null };
  emotionConstellationCache = { key: "", edges: [] };
}

function setEmotionFilter(emotion) {
  activeEmotionFilter = activeEmotionFilter === emotion ? null : emotion;
  emotionLegend.classList.toggle("has-active-filter", Boolean(activeEmotionFilter));
  emotionLegend.querySelectorAll(".emotion-legend-item").forEach((item) => {
    const isActive = item.dataset.emotion === activeEmotionFilter;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
  emotionAnchorLayer?.querySelectorAll(".emotion-anchor").forEach((item) => {
    const isActive = item.dataset.emotion === activeEmotionFilter;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
  prepareEmotionalMovies();
  updateFilterCount();
  scheduleEmotionDraw();
}

function visibleEmotionCounts() {
  const counts = Object.fromEntries((emotionalData?.emotions || []).map((emotion) => [emotion, 0]));
  emotionalMovies.forEach((movie) => {
    const emotion = movie.emotionProfile?.dominantEmotion;
    if (emotion in counts) counts[emotion] += 1;
  });
  return counts;
}

function updateEmotionAnchors() {
  if (!emotionAnchorLayer || !emotionalData) return;
  const bounds = emotionCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const counts = visibleEmotionCounts();
  const countValues = Object.values(counts);
  const maximumCount = Math.max(...countValues, 1);
  emotionAnchorLayer.querySelectorAll(".emotion-anchor").forEach((button) => {
    const emotion = button.dataset.emotion;
    const anchor = emotionAnchor(emotion);
    if (!anchor) {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    const count = counts[emotion] || 0;
    const mass = Math.sqrt(count / maximumCount);
    const size = 36 + mass * 12;
    button.style.setProperty("--planet-size", `${size.toFixed(1)}px`);
    button.style.setProperty("--planet-icon-size", `${(20 + mass * 8).toFixed(1)}px`);
    button.dataset.visibleCount = String(count);
    button.setAttribute(
      "aria-label",
      `${emotionLabel(emotion)}: ${count} visible ${count === 1 ? "movie" : "movies"}. Activate to filter.`,
    );
    const point = emotionToScreen({ axisX: anchor[0], axisY: anchor[1] });
    const halfWidth = Math.max(button.offsetWidth, 36) / 2;
    const halfHeight = Math.max(button.offsetHeight, 36) / 2;
    const x = clamp(point.x, halfWidth + 4, bounds.width - halfWidth - 4);
    const y = clamp(point.y, halfHeight + 4, bounds.height - halfHeight - 4);
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
  });
}

function createEmotionAnchors() {
  if (!emotionAnchorLayer || !emotionalData) return;
  emotionAnchorLayer.replaceChildren(
    ...emotionalData.emotions.map((emotion, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emotion-anchor";
      button.dataset.emotion = emotion;
      button.setAttribute("aria-pressed", String(activeEmotionFilter === emotion));
      button.setAttribute(
        "aria-label",
        usesOverlappingLenses()
          ? `Show movies with a strong relative ${emotionLabel(emotion)} signal`
          : `Show only ${emotionLabel(emotion)} movies`,
      );
      button.style.setProperty("--emotion-color", emotionColor(emotion));
      button.style.setProperty("--anchor-phase", `${(-index * 1.15).toFixed(2)}s`);
      const icon = createEmotionIcon(emotion);
      icon.setAttribute("width", "32");
      icon.setAttribute("height", "32");
      icon.classList.add("emotion-anchor-icon");
      const label = document.createElement("span");
      label.className = "emotion-anchor-label";
      label.textContent = emotionLabel(emotion);
      button.append(icon, label);
      button.addEventListener("pointerdown", (event) => event.stopPropagation());
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        setEmotionFilter(emotion);
      });
      const clearMovieTooltip = () => {
        setEmotionHoverMovie(null);
        emotionTooltip.hidden = true;
      };
      button.addEventListener("pointerenter", clearMovieTooltip);
      button.addEventListener("focus", clearMovieTooltip);
      return button;
    }),
  );
  updateEmotionAnchors();
}

let emotionDrawFrame = null;
function scheduleEmotionDraw() {
  if (emotionDrawFrame !== null) return;
  emotionDrawFrame = requestAnimationFrame(() => {
    drawEmotionalMap();
    emotionDrawFrame = null;
  });
}

function resizeEmotionCanvas() {
  const bounds = emotionCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  emotionViewportCache = bounds;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.round(bounds.width * pixelRatio);
  const targetHeight = Math.round(bounds.height * pixelRatio);
  if (emotionCanvas.width === targetWidth && emotionCanvas.height === targetHeight) {
    scheduleEmotionDraw();
    return;
  }
  emotionCanvas.width = targetWidth;
  emotionCanvas.height = targetHeight;
  emotionContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  emotionCloudCache = { key: "", canvas: null };
  emotionConstellationCache = { key: "", edges: [] };
  scheduleEmotionDraw();
}

function drawEmotionDensityCloud(width, height, isLight) {
  if (!emotionalMovies.length) return;
  // Rebuilding the twelve-channel density field is the most expensive Galaxy
  // operation. Keep its last frame while the pointer is moving and rebuild it
  // once the gesture ends instead of blocking every drag/zoom event.
  if (emotionInteractionActive && emotionCloudCache.canvas) {
    emotionContext.drawImage(emotionCloudCache.canvas, 0, 0, width, height);
    return;
  }
  const cacheKey = [
    width,
    height,
    (Math.round(emotionView.zoom * 50) / 50).toFixed(2),
    Math.round(emotionView.offsetX / 12) * 12,
    Math.round(emotionView.offsetY / 12) * 12,
    emotionCloudRevision,
    isLight ? "light" : "dark",
  ].join(":");
  if (emotionCloudCache.key === cacheKey && emotionCloudCache.canvas) {
    emotionContext.drawImage(emotionCloudCache.canvas, 0, 0, width, height);
    return;
  }

  const cloud = document.createElement("canvas");
  // The field is blurred before display, so computing it at one fifth of the
  // visible resolution retains its appearance while cutting pixel work by
  // roughly two thirds compared with the previous one-third-size buffer.
  cloud.width = Math.max(120, Math.round(width / 5));
  cloud.height = Math.max(80, Math.round(height / 5));
  const context = cloud.getContext("2d");
  const scaleX = cloud.width / width;
  const scaleY = cloud.height / height;
  const emotions = emotionalData.emotions;
  const channels = emotions.map(() => new Float32Array(cloud.width * cloud.height));
  const colors = emotions.map((emotion) => hexToRgb(emotionPalette(emotion).mid));
  let maxDensity = 0;
  emotionalMovies.forEach((movie) => {
    const profile = movie.emotionProfile;
    const weights = profile?.displayWeights || profile?.emotionScores;
    if (!weights) return;
    const point = emotionToScreen(profile);
    const cx = point.x * scaleX;
    const cy = point.y * scaleY;
    const reviewWeight = 0.72 + Math.min(0.78, Math.log1p(profile.reviewCount || 0) / 7);
    const confidence = clamp(Number(profile.confidence) || 0.45, 0.3, 1);
    // Keep the low-resolution kernels broad enough for nearby profiles to merge
    // into a continuous field instead of reading as isolated halos.
    const radius = clamp((11 + Math.sqrt(profile.reviewCount || 1) * 1.2) * (scaleX + scaleY) * 0.5, 4.5, 13);
    const minX = Math.max(0, Math.floor(cx - radius * 2.2));
    const maxX = Math.min(cloud.width - 1, Math.ceil(cx + radius * 2.2));
    const minY = Math.max(0, Math.floor(cy - radius * 2.2));
    const maxY = Math.min(cloud.height - 1, Math.ceil(cy + radius * 2.2));
    for (let index = 0; index < emotions.length; index += 1) {
      const amount = Math.pow(clamp(Number(weights[emotions[index]]) || 0, 0, 1), 1.18) * confidence * reviewWeight;
      if (amount < 0.006) continue;
      const channel = channels[index];
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const dx = x - cx;
          const dy = y - cy;
          const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius));
          channel[y * cloud.width + x] += amount * falloff;
        }
      }
    }
  });
  channels.forEach((channel) => channel.forEach((value) => { if (value > maxDensity) maxDensity = value; }));
  const image = context.createImageData(cloud.width, cloud.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const pixel = i / 4;
    let total = 0;
    let rawTotal = 0;
    let red = 0;
    let green = 0;
    let blue = 0;
    channels.forEach((channel, index) => {
      const value = channel[pixel];
      rawTotal += value;
      // Powering each channel before chromatic mixing prevents dense overlaps
      // from collapsing toward gray while alpha still reflects raw density.
      const chromaticValue = Math.pow(value, 1.35);
      total += chromaticValue;
      red += colors[index].r * chromaticValue;
      green += colors[index].g * chromaticValue;
      blue += colors[index].b * chromaticValue;
    });
    if (!total) continue;
    red /= total; green /= total; blue /= total;
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    const chroma = isLight ? 1.12 : 1.05;
    red = clamp(luminance + (red - luminance) * chroma, 0, 255);
    green = clamp(luminance + (green - luminance) * chroma, 0, 255);
    blue = clamp(luminance + (blue - luminance) * chroma, 0, 255);
    const density = clamp(rawTotal / Math.max(maxDensity, 0.001), 0, 1);
    const alpha = (isLight ? 0.11 : 0.28) * Math.pow(density, 0.58);
    image.data[i] = red; image.data[i + 1] = green; image.data[i + 2] = blue; image.data[i + 3] = alpha * 255;
  }
  context.putImageData(image, 0, 0);
  // Blur the composed field once offscreen. This preserves the channel-derived
  // hues while smoothing the low-res density into soft transition clouds.
  const blurred = document.createElement("canvas");
  blurred.width = cloud.width;
  blurred.height = cloud.height;
  const blurredContext = blurred.getContext("2d");
  blurredContext.filter = `blur(11px) saturate(${isLight ? 1 : 1.04})`;
  blurredContext.globalAlpha = isLight ? 0.58 : 0.82;
  blurredContext.drawImage(cloud, 0, 0);
  context.clearRect(0, 0, cloud.width, cloud.height);
  context.drawImage(blurred, 0, 0);
  emotionCloudCache = { key: cacheKey, canvas: cloud };
  emotionContext.drawImage(cloud, 0, 0, width, height);
}

function drawEmotionBackground(width, height) {
  const isLight = stage.classList.contains("light");
  const scales = emotionScales();
  if (isLight) {
    const daylight = emotionContext.createLinearGradient(0, height, width, 0);
    daylight.addColorStop(0, "#e9e7e1");
    daylight.addColorStop(0.48, "#f2efe7");
    daylight.addColorStop(1, "#f3ead7");
    emotionContext.fillStyle = daylight;
    emotionContext.fillRect(0, 0, width, height);

    const sunlight = emotionContext.createRadialGradient(
      width * 0.82,
      height * 0.16,
      0,
      width * 0.82,
      height * 0.16,
      Math.max(width, height) * 0.54,
    );
    sunlight.addColorStop(0, "rgba(226, 183, 73, 0.19)");
    sunlight.addColorStop(0.24, "rgba(235, 204, 132, 0.075)");
    sunlight.addColorStop(0.58, "rgba(244, 226, 189, 0.025)");
    sunlight.addColorStop(1, "rgba(255, 255, 255, 0)");
    emotionContext.fillStyle = sunlight;
    emotionContext.fillRect(0, 0, width, height);

    const daylightNebula = emotionContext.createRadialGradient(
      width * 0.25,
      height * 0.62,
      0,
      width * 0.25,
      height * 0.62,
      Math.max(width, height) * 0.6,
    );
    daylightNebula.addColorStop(0, "rgba(82, 86, 84, 0.075)");
    daylightNebula.addColorStop(0.34, "rgba(104, 104, 98, 0.03)");
    daylightNebula.addColorStop(1, "rgba(255, 255, 255, 0)");
    emotionContext.fillStyle = daylightNebula;
    emotionContext.fillRect(0, 0, width, height);

    emotionContext.save();
    emotionContext.strokeStyle = "rgba(65, 78, 89, 0.09)";
    emotionContext.lineWidth = 1;
    emotionContext.beginPath();
    emotionContext.ellipse(width * 0.82, height * 0.16, width * 0.22, height * 0.095, -0.16, 0, Math.PI * 2);
    emotionContext.stroke();
    emotionContext.restore();
  } else {
    emotionContext.fillStyle = "#020407";
    emotionContext.fillRect(0, 0, width, height);

    emotionContext.save();
    emotionContext.translate(width * 0.52, height * 0.48);
    emotionContext.rotate(-0.16);
    emotionContext.scale(1, 0.24);
    const milkyWay = emotionContext.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.72);
    milkyWay.addColorStop(0, "rgba(132, 146, 158, 0.115)");
    milkyWay.addColorStop(0.28, "rgba(83, 101, 119, 0.07)");
    milkyWay.addColorStop(0.68, "rgba(28, 42, 56, 0.025)");
    milkyWay.addColorStop(1, "rgba(2, 4, 7, 0)");
    emotionContext.fillStyle = milkyWay;
    emotionContext.fillRect(-width, -height, width * 2, height * 2);
    emotionContext.restore();
  }
  // The chromatic atmosphere is generated only from visible review profiles.
  // This keeps the Milky Way field honest when filters remove a lens entirely.
  drawEmotionDensityCloud(width, height, isLight);

  emotionContext.save();
  emotionContext.setLineDash([2, 8]);
  emotionContext.lineWidth = 1;
  emotionContext.strokeStyle = isLight ? "rgba(49, 59, 67, 0.24)" : "rgba(178, 194, 199, 0.17)";
  emotionContext.beginPath();
  emotionContext.moveTo(scales.horizontalPadding, scales.verticalPadding);
  emotionContext.lineTo(width - scales.horizontalPadding, scales.verticalPadding);
  emotionContext.moveTo(scales.horizontalPadding, height - scales.verticalPadding);
  emotionContext.lineTo(width - scales.horizontalPadding, height - scales.verticalPadding);
  emotionContext.moveTo(scales.horizontalPadding, scales.verticalPadding);
  emotionContext.lineTo(scales.horizontalPadding, height - scales.verticalPadding);
  emotionContext.stroke();
  emotionContext.restore();

  const axisColor = isLight ? "rgba(35, 45, 52, 0.9)" : "rgba(185, 198, 202, 0.68)";
  emotionContext.save();
  emotionContext.fillStyle = axisColor;
  emotionContext.font = "10px Ubuntu, Arial, sans-serif";
  emotionContext.textBaseline = "middle";
  emotionContext.letterSpacing = "0.16em";
  emotionContext.textAlign = "left";
  emotionContext.fillText("HIGH", 14, scales.verticalPadding);
  emotionContext.fillText("LOW", 14, height - scales.verticalPadding);
  emotionContext.fillText("NEGATIVE", scales.horizontalPadding, height - 17);
  emotionContext.textAlign = "right";
  emotionContext.fillText("POSITIVE", width - scales.horizontalPadding, height - 17);
  emotionContext.textAlign = "center";
  emotionContext.fillText("←  VALENCE  →", width / 2, height - 17);
  emotionContext.save();
  emotionContext.translate(17, height / 2);
  emotionContext.rotate(-Math.PI / 2);
  emotionContext.fillText("←  AROUSAL  →", 0, 0);
  emotionContext.restore();
  emotionContext.restore();

  if (!usesOverlappingLenses()) {
  emotionContext.save();
  emotionContext.font = `11px Ubuntu, Arial, sans-serif`;
  emotionContext.textAlign = "center";
  emotionContext.textBaseline = "middle";
  const occupiedLabels = [];
  Object.entries(anchors).forEach(([emotion, [mapX, mapY]]) => {
    const point = emotionToScreen({ axisX: mapX, axisY: mapY });
    const color = emotionColor(emotion);
    emotionContext.beginPath();
    emotionContext.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    emotionContext.fillStyle = color;
    emotionContext.globalAlpha = 0.8;
    emotionContext.fill();
    emotionContext.globalAlpha = 1;
    emotionContext.fillStyle = isLight ? "rgba(56, 64, 78, 0.68)" : "rgba(242, 244, 240, 0.58)";
    const text = emotionLabel(emotion).toUpperCase();
    const labelWidth = emotionContext.measureText(text).width + 8;
    const labelHeight = 14;
    const candidates = [
      { x: point.x - labelWidth / 2, y: point.y - 23 },
      { x: point.x - labelWidth / 2, y: point.y + 10 },
      { x: point.x + 10, y: point.y - labelHeight / 2 },
      { x: point.x - labelWidth - 10, y: point.y - labelHeight / 2 },
    ].map((candidate) => ({ ...candidate, width: labelWidth, height: labelHeight }));
    const inBounds = candidates.filter(
      (candidate) =>
        candidate.x >= 4 &&
        candidate.y >= 4 &&
        candidate.x + candidate.width <= width - 4 &&
        candidate.y + candidate.height <= height - 24,
    );
    const label =
      inBounds.find(
        (candidate) => !occupiedLabels.some((other) => rectanglesOverlap(candidate, other, 5)),
      ) || inBounds[0] || candidates[0];
    occupiedLabels.push(label);
    const labelX = label.x + label.width / 2;
    const labelY = label.y + label.height / 2;
    if (Math.hypot(labelX - point.x, labelY - point.y) > 18) {
      emotionContext.beginPath();
      emotionContext.moveTo(point.x, point.y);
      emotionContext.lineTo(labelX, labelY);
      emotionContext.strokeStyle = color;
      emotionContext.globalAlpha = 0.35;
      emotionContext.lineWidth = 0.7;
      emotionContext.stroke();
      emotionContext.globalAlpha = 1;
    }
    emotionContext.fillText(text, labelX, labelY);
  });
  emotionContext.restore();
  }
}

function getEmotionMix(movie) {
  return Object.entries(movie?.emotionProfile?.emotionScores || {})
    .filter(([emotion, value]) => emotionLedger[emotion] && value > 0)
    .sort(([, first], [, second]) => second - first);
}

function drawEmotionConnections(movie, intensity = 1) {
  if (!movie?.emotionProfile?.emotionScores) return;
  const moviePoint = emotionToScreen(movie.emotionProfile);

  getEmotionMix(movie).forEach(([emotion, value], index) => {
    const anchor = emotionAnchor(emotion);
    if (!anchor) return;
    const anchorPoint = emotionToScreen({ axisX: anchor[0], axisY: anchor[1] });
    const color = emotionEdgeColor(emotion, value);
    const midpointX = (moviePoint.x + anchorPoint.x) / 2;
    const midpointY = (moviePoint.y + anchorPoint.y) / 2;
    const dx = anchorPoint.x - moviePoint.x;
    const dy = anchorPoint.y - moviePoint.y;
    const bend = (index - 3) * 2.1;

    emotionContext.save();
    emotionContext.beginPath();
    emotionContext.moveTo(moviePoint.x, moviePoint.y);
    emotionContext.quadraticCurveTo(
      midpointX - dy * 0.06 + bend,
      midpointY + dx * 0.06 + bend,
      anchorPoint.x,
      anchorPoint.y,
    );
    emotionContext.strokeStyle = color;
    emotionContext.globalAlpha = (0.18 + Math.sqrt(value) * 0.72) * intensity;
    emotionContext.lineWidth = 0.65 + value * 6;
    emotionContext.shadowColor = color;
    emotionContext.shadowBlur = value > 0.12 ? 9 : 3;
    emotionContext.stroke();
    emotionContext.restore();

    if (value >= 0.035) {
      emotionContext.save();
      emotionContext.globalAlpha = intensity;
      emotionContext.font = "10px Ubuntu, Arial, sans-serif";
      emotionContext.textAlign = "center";
      emotionContext.textBaseline = "top";
      emotionContext.fillStyle = color;
      emotionContext.fillText(`${Math.round(value * 100)}%`, anchorPoint.x, anchorPoint.y + 10);
      emotionContext.restore();
    }
  });
}

function getEmotionConstellationEdges(renderedMovies, bounds) {
  const signature = renderedMovies.map((movie) => movie.imdbId || `${movie.year}-${movie.title}`).join(",");
  const key = [
    emotionCloudRevision,
    Math.round(bounds.width),
    Math.round(bounds.height),
    (Math.round(emotionView.zoom * 50) / 50).toFixed(2),
    Math.round(emotionView.offsetX / 12) * 12,
    Math.round(emotionView.offsetY / 12) * 12,
    signature,
  ].join(":");
  if (emotionConstellationCache.key === key) return emotionConstellationCache.edges;

  const cellSize = 0.065;
  const maximumDistanceSquared = cellSize * cellSize;
  const maximumEdges = Math.min(96, Math.max(18, Math.round(renderedMovies.length * 0.28)));
  const grid = new Map();
  const edges = [];
  const candidates = renderedMovies
    .filter((movie) => (movie.emotionProfile?.reviewCount || 0) >= 5)
    .filter((movie) => !activePersonFilter || movieMatchesPerson(movie))
    .sort((first, second) =>
      second.emotionProfile.reviewCount - first.emotionProfile.reviewCount ||
      String(first.imdbId || first.title).localeCompare(String(second.imdbId || second.title)),
    );

  candidates.forEach((movie) => {
    const point = emotionProfileCoordinates(movie.emotionProfile);
    const cellX = Math.floor(point.x / cellSize);
    const cellY = Math.floor(point.y / cellSize);
    let nearest = null;
    let nearestDistanceSquared = maximumDistanceSquared;
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const nearby = grid.get(`${cellX + offsetX}:${cellY + offsetY}`) || [];
        nearby.forEach((candidate) => {
          const dx = candidate.point.x - point.x;
          const dy = candidate.point.y - point.y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > 0.000001 && distanceSquared < nearestDistanceSquared) {
            nearest = candidate.movie;
            nearestDistanceSquared = distanceSquared;
          }
        });
      }
    }
    if (nearest && edges.length < maximumEdges) edges.push([movie, nearest]);
    const cellKey = `${cellX}:${cellY}`;
    const entries = grid.get(cellKey) || [];
    entries.push({ movie, point });
    grid.set(cellKey, entries);
  });

  emotionConstellationCache = { key, edges };
  return edges;
}

function drawEmotionConstellationLinks(renderedMovies, bounds, isLight) {
  const edges = getEmotionConstellationEdges(renderedMovies, bounds);
  if (!edges.length) return;
  emotionContext.save();
  emotionContext.lineCap = "round";
  emotionContext.strokeStyle = isLight ? "rgba(70, 65, 57, 0.17)" : "rgba(151, 162, 166, 0.1)";
  edges.forEach(([source, target]) => {
    const sourcePoint = emotionToScreen(source.emotionProfile);
    const targetPoint = emotionToScreen(target.emotionProfile);
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;
    const evidence = Math.min(source.emotionProfile.reviewCount, target.emotionProfile.reviewCount);
    emotionContext.beginPath();
    emotionContext.moveTo(sourcePoint.x, sourcePoint.y);
    emotionContext.quadraticCurveTo(
      (sourcePoint.x + targetPoint.x) / 2 - dy * 0.035,
      (sourcePoint.y + targetPoint.y) / 2 + dx * 0.035,
      targetPoint.x,
      targetPoint.y,
    );
    emotionContext.globalAlpha = 0.52 + Math.min(0.38, Math.log1p(evidence) / 9);
    emotionContext.lineWidth = 0.55 + Math.min(0.35, Math.log1p(evidence) / 12);
    emotionContext.stroke();
  });
  emotionContext.restore();
}

function emotionPlanetGradient(point, radius, emotion, intensity, isLight = false) {
  const palette = emotionPalette(emotion);
  const body = mixEmotionColors(
    palette.flare,
    palette.mid,
    isLight ? 0.18 + intensity * 0.25 : 0.32 + intensity * 0.6,
  );
  const core = mixEmotionColors(
    palette.mid,
    palette.deep,
    isLight ? 0.25 + intensity * 0.22 : intensity,
  );
  const rim = isLight
    ? mixEmotionColors(palette.mid, palette.deep, 0.42 + intensity * 0.16)
    : palette.deep;
  const gradient = emotionContext.createRadialGradient(
    point.x - radius * 0.35,
    point.y - radius * 0.38,
    Math.max(0.5, radius * 0.04),
    point.x,
    point.y,
    Math.max(1, radius * 1.16),
  );
  gradient.addColorStop(0, palette.flare);
  gradient.addColorStop(0.2, body);
  gradient.addColorStop(0.68, core);
  gradient.addColorStop(1, rim);
  return gradient;
}

function rectanglesOverlap(first, second, gap = 3) {
  return !(
    first.x + first.width + gap <= second.x ||
    second.x + second.width + gap <= first.x ||
    first.y + first.height + gap <= second.y ||
    second.y + second.height + gap <= first.y
  );
}

function drawPersonSpotlightLabels(spotlightMovies, bounds, isLight) {
  if (!spotlightMovies.length) return;
  const occupied = [];
  const paddingX = 4;
  const labelHeight = 17;
  const edgePadding = 6;

  emotionContext.save();
  emotionContext.font = "11px Ubuntu, Arial, sans-serif";
  emotionContext.textAlign = "center";
  emotionContext.textBaseline = "middle";

  [...spotlightMovies]
    .sort(
      (first, second) =>
        second.emotionProfile.reviewCount - first.emotionProfile.reviewCount,
    )
    .forEach((movie) => {
      const point = emotionToScreen(movie.emotionProfile);
      const radius = emotionNodeRadius(movie) + 2.2;
      const labelWidth = Math.ceil(emotionContext.measureText(movie.title).width) + paddingX * 2;
      const candidates = [
        { x: point.x - labelWidth / 2, y: point.y - radius - labelHeight - 5 },
        { x: point.x - labelWidth / 2, y: point.y + radius + 5 },
        { x: point.x + radius + 6, y: point.y - labelHeight / 2 },
        { x: point.x - radius - labelWidth - 6, y: point.y - labelHeight / 2 },
        { x: point.x + radius + 4, y: point.y - radius - labelHeight - 2 },
        { x: point.x - radius - labelWidth - 4, y: point.y - radius - labelHeight - 2 },
        { x: point.x + radius + 4, y: point.y + radius + 2 },
        { x: point.x - radius - labelWidth - 4, y: point.y + radius + 2 },
      ].map((candidate) => ({ ...candidate, width: labelWidth, height: labelHeight }));

      const inBounds = candidates.filter(
        (candidate) =>
          candidate.x >= edgePadding &&
          candidate.y >= edgePadding &&
          candidate.x + candidate.width <= bounds.width - edgePadding &&
          candidate.y + candidate.height <= bounds.height - edgePadding,
      );
      const available = inBounds.find(
        (candidate) => !occupied.some((other) => rectanglesOverlap(candidate, other)),
      );
      const label = available || inBounds[0] || candidates[0];
      occupied.push(label);

      emotionContext.fillStyle = isLight
        ? "rgba(247, 247, 244, 0.88)"
        : "rgba(9, 17, 20, 0.82)";
      emotionContext.fillRect(label.x, label.y, label.width, label.height);
      emotionContext.fillStyle = isLight ? "#20272d" : "#ffffff";
      emotionContext.fillText(
        movie.title,
        label.x + label.width / 2,
        label.y + label.height / 2,
      );
    });

  emotionContext.restore();
}

function drawEmotionalMap() {
  if (!emotionalMode || !emotionalData) return;
  const bounds = emotionCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  // All point projection in this frame shares one geometry snapshot. Calling
  // getBoundingClientRect for every movie forces repeated synchronous layout.
  emotionViewportCache = bounds;
  emotionContext.clearRect(0, 0, bounds.width, bounds.height);
  drawEmotionBackground(bounds.width, bounds.height);
  updateEmotionAnchors();
  const isLight = stage.classList.contains("light");

  const activeMovie = emotionHoveredMovie || emotionSelectedMovie;
  const activeIntensity = emotionHoveredMovie ? emotionHoverProgress : activeMovie ? 1 : 0;
  emotionRenderedMovies = getEmotionRenderMovies(bounds, activeMovie);
  drawEmotionConstellationLinks(emotionRenderedMovies, bounds, isLight);
  if (activeMovie) drawEmotionConnections(activeMovie, activeIntensity);

  emotionRenderedMovies.forEach((movie) => {
    const profile = movie.emotionProfile;
    const point = emotionToScreen(profile);
    const radius = emotionNodeRadius(movie);
    if (point.x < -20 || point.x > bounds.width + 20 || point.y < -20 || point.y > bounds.height + 20) return;
    const emotion = profile.dominantEmotion;
    const palette = emotionPalette(emotion);
    const color = palette.flare;
    const emotionIntensity = movieEmotionIntensity(movie, emotion);
    const selected = movie === emotionSelectedMovie;
    const hovered = movie === emotionHoveredMovie;
    const personMatch = movieMatchesPerson(movie);
    const isPersonSpotlight = Boolean(activePersonFilter);
    const baseOpacity = isLight
      ? profile.confidenceTier === "high" ? 0.9 : profile.confidenceTier === "medium" ? 0.66 : 0.36
      : profile.confidenceTier === "high" ? 0.58 : profile.confidenceTier === "medium" ? 0.34 : 0.16;
    const targetOpacity = isPersonSpotlight
      ? personMatch
        ? Math.max(0.86, baseOpacity)
        : 0.035
      : activeMovie && movie !== activeMovie
        ? 0.055
        : baseOpacity;
    const opacity = activeMovie
      ? baseOpacity + (targetOpacity - baseOpacity) * activeIntensity
      : baseOpacity;
    const spotlightGrowth = isPersonSpotlight && personMatch ? 2.2 : 0;
    const nodeRadius = radius + spotlightGrowth + (selected ? 3 : hovered ? 2 * activeIntensity : 0);

    emotionContext.beginPath();
    emotionContext.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
    emotionContext.fillStyle = emotionPlanetGradient(point, nodeRadius, emotion, emotionIntensity, isLight);
    emotionContext.globalAlpha = selected
      ? 1
      : hovered
        ? opacity + (1 - opacity) * activeIntensity
        : opacity;
    emotionContext.shadowColor = isLight ? palette.mid : color;
    emotionContext.shadowBlur = isLight
      ? selected
        ? 5
        : hovered || (isPersonSpotlight && personMatch)
          ? 3
          : profile.reviewCount >= 10
            ? 1
            : 0
      : selected
        ? 9
        : hovered || (isPersonSpotlight && personMatch)
          ? 6
          : profile.reviewCount >= 10
            ? 3
            : 0;
    emotionContext.fill();
    emotionContext.shadowBlur = 0;
    emotionContext.globalAlpha = 1;

    if (isLight) {
      emotionContext.beginPath();
      emotionContext.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
      emotionContext.strokeStyle = emotionEdgeColor(emotion, emotionIntensity);
      emotionContext.globalAlpha = selected || hovered ? 0.72 : 0.32;
      emotionContext.lineWidth = selected || hovered ? 0.95 : 0.55;
      emotionContext.stroke();
      emotionContext.globalAlpha = 1;
    }

    if (profile.reviewCount >= 12 || selected || hovered) {
      const glint = Math.max(1.3, Math.min(3.4, radius * 0.72));
      emotionContext.save();
      emotionContext.strokeStyle = "rgba(255, 251, 226, 0.86)";
      emotionContext.fillStyle = "rgba(255, 253, 237, 0.9)";
      emotionContext.globalAlpha = selected || hovered ? 0.82 : 0.34;
      emotionContext.lineWidth = selected || hovered ? 0.8 : 0.55;
      emotionContext.beginPath();
      emotionContext.moveTo(point.x - glint, point.y);
      emotionContext.lineTo(point.x + glint, point.y);
      emotionContext.moveTo(point.x, point.y - glint);
      emotionContext.lineTo(point.x, point.y + glint);
      emotionContext.stroke();
      emotionContext.beginPath();
      emotionContext.arc(point.x, point.y, selected || hovered ? 0.9 : 0.62, 0, Math.PI * 2);
      emotionContext.fill();
      emotionContext.restore();
    }
    if (selected) {
      emotionContext.beginPath();
      emotionContext.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
      emotionContext.strokeStyle = isLight ? "#20272d" : "#ffffff";
      emotionContext.lineWidth = 1.5;
      emotionContext.stroke();
    } else if (isPersonSpotlight && personMatch) {
      emotionContext.beginPath();
      emotionContext.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
      emotionContext.strokeStyle = isLight ? "rgba(25, 32, 38, 0.82)" : "rgba(255, 255, 255, 0.9)";
      emotionContext.lineWidth = 1.2;
      emotionContext.stroke();
    }

    const shouldLabel = !isPersonSpotlight && (selected || hovered);
    if (shouldLabel) {
      emotionContext.font = "12px Ubuntu, Arial, sans-serif";
      emotionContext.textAlign = "center";
      emotionContext.textBaseline = "bottom";
      emotionContext.fillStyle = isLight ? "#293239" : "#ffffff";
      emotionContext.fillText(movie.title, point.x, point.y - radius - 5);
    }
  });

  if (activePersonFilter) {
    drawPersonSpotlightLabels(
      emotionRenderedMovies.filter(movieMatchesPerson),
      bounds,
      isLight,
    );
  }
}

function getEmotionMovieAtPoint(clientX, clientY) {
  const bounds = emotionCanvas.getBoundingClientRect();
  emotionViewportCache = bounds;
  const x = clientX - bounds.left;
  const y = clientY - bounds.top;
  for (let index = emotionRenderedMovies.length - 1; index >= 0; index -= 1) {
    const movie = emotionRenderedMovies[index];
    if (activePersonFilter && !movieMatchesPerson(movie)) continue;
    const point = emotionToScreen(movie.emotionProfile);
    const hitRadius = emotionNodeRadius(movie) + 5;
    if (Math.hypot(x - point.x, y - point.y) <= hitRadius) return movie;
  }
  return null;
}

function animateEmotionHover(timestamp) {
  const duration = 620;
  const elapsed = emotionHoverLastTime ? Math.min(40, timestamp - emotionHoverLastTime) : 16;
  emotionHoverLastTime = timestamp;
  const direction = Math.sign(emotionHoverTarget - emotionHoverProgress);
  emotionHoverProgress = clamp(
    emotionHoverProgress + direction * (elapsed / duration),
    0,
    1,
  );
  scheduleEmotionDraw();
  if (Math.abs(emotionHoverTarget - emotionHoverProgress) > 0.001) {
    emotionHoverAnimationFrame = requestAnimationFrame(animateEmotionHover);
    return;
  }
  emotionHoverProgress = emotionHoverTarget;
  emotionHoverAnimationFrame = null;
  emotionHoverLastTime = 0;
  if (emotionHoverTarget === 0) {
    emotionHoveredMovie = null;
    scheduleEmotionDraw();
  }
}

function setEmotionHoverMovie(movie) {
  const nextTarget = movie ? 1 : 0;
  if (movie && movie !== emotionHoveredMovie) {
    emotionHoveredMovie = movie;
    emotionHoverProgress = Math.min(emotionHoverProgress, 0.16);
  }
  emotionHoverTarget = nextTarget;
  if (reducedMotionQuery.matches) {
    emotionHoverProgress = nextTarget;
    if (!movie) emotionHoveredMovie = null;
    scheduleEmotionDraw();
    return;
  }
  if (emotionHoverAnimationFrame === null && emotionHoverProgress !== emotionHoverTarget) {
    emotionHoverAnimationFrame = requestAnimationFrame(animateEmotionHover);
  }
}

function clearEmotionHoverImmediately() {
  if (emotionHoverAnimationFrame !== null) cancelAnimationFrame(emotionHoverAnimationFrame);
  emotionHoverAnimationFrame = null;
  emotionHoverLastTime = 0;
  emotionHoverProgress = 0;
  emotionHoverTarget = 0;
  emotionHoveredMovie = null;
  scheduleEmotionDraw();
}

function updateEmotionTooltip(movie, clientX, clientY) {
  setEmotionHoverMovie(movie);
  emotionCanvas.style.cursor = movie ? "pointer" : "grab";
  if (!movie) {
    emotionTooltip.hidden = true;
    scheduleEmotionDraw();
    return;
  }
  const profile = movie.emotionProfile;
  const bounds = emotionCanvas.getBoundingClientRect();
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  const mixture = document.createElement("em");
  title.textContent = `${movie.title} (${movie.year})`;
  detail.textContent = `${profile.reviewCount} ${profile.reviewCount === 1 ? "review" : "reviews"} · ${profile.confidenceTier} confidence`;
  mixture.textContent = getEmotionMix(movie)
    .slice(0, 3)
    .map(([emotion, value]) => {
      if (!usesOverlappingLenses()) {
        return `${emotionLabel(emotion)} ${Math.round(value * 100)}%`;
      }
      const raw = profile.rawLensScores?.[emotion] || 0;
      return `${emotionLabel(emotion)} ${Math.round(value * 100)}% relative · ${Math.round(raw * 100)}% raw`;
    })
    .join(" · ");
  emotionTooltip.replaceChildren(title, detail, mixture);
  emotionTooltip.hidden = false;
  emotionTooltip.style.left = `${clamp(clientX - bounds.left + 14, 8, bounds.width - 230)}px`;
  emotionTooltip.style.top = `${clamp(clientY - bounds.top + 14, 8, bounds.height - 70)}px`;
  scheduleEmotionDraw();
}

function centerEmotionMovie(movie) {
  const profile = movie?.emotionProfile;
  if (!profile?.reviewCount) return;
  const scales = emotionScales();
  const coordinates = emotionProfileCoordinates(profile);
  emotionView.offsetX = -coordinates.x * scales.x;
  emotionView.offsetY = coordinates.y * scales.y;
  emotionSelectedMovie = movie;
  scheduleEmotionDraw();
  emotionCanvas.focus();
}

async function loadEmotionalData() {
  if (emotionalData) return;
  emotionStatus.hidden = false;
  emotionStatus.textContent = "Loading emotional profiles…";
  const response = await fetch("emotional_map_data.json");
  if (!response.ok) throw new Error("Could not load emotional_map_data.json");
  emotionalData = await response.json();
  const isLegacyTaxonomy = emotionalData.taxonomyVersion === 2;
  const isLensTaxonomy =
    emotionalData.taxonomyVersion === 3 &&
    emotionalData.taxonomyType === "overlapping-cinematic-lenses";
  const candidateLedger = emotionalData.emotionLedger || emotionalData.lensLedger;
  if ((!isLegacyTaxonomy && !isLensTaxonomy) || !candidateLedger) {
    throw new Error("Emotional Map data must use taxonomy version 2 or overlapping-lens version 3");
  }
  if (
    !emotionalData.model ||
    !emotionalData.modelRevision ||
    !Array.isArray(emotionalData.emotions) ||
    !Array.isArray(emotionalData.movies)
  ) {
    throw new Error("Emotional Map model provenance is incomplete");
  }
  const uniqueEmotions = new Set(emotionalData.emotions);
  const validEmotionCount = isLegacyTaxonomy
    ? emotionalData.emotions.length === 8
    : emotionalData.emotions.length >= 6 && emotionalData.emotions.length <= 16;
  if (!validEmotionCount || uniqueEmotions.size !== emotionalData.emotions.length) {
    throw new Error("Emotional Map taxonomy contains an invalid lens list");
  }
  const missingEmotionConfig = emotionalData.emotions.filter((emotion) => {
    const config = candidateLedger[emotion];
    const palette = config?.palette;
    const hasCinematicPalette =
      isLegacyTaxonomy ||
      [palette?.deep, palette?.mid, palette?.flare].every((color) =>
        /^#[0-9a-f]{6}$/i.test(color || ""),
      );
    return (
      !/^#[0-9a-f]{6}$/i.test(config?.color || "") ||
      !hasCinematicPalette ||
      !Array.isArray(config?.anchor) ||
      config.anchor.length !== 2 ||
      config.anchor.some((value) => !Number.isFinite(value) || value < -1 || value > 1) ||
      !Array.isArray(config?.sourceLabels) ||
      !config.sourceLabels.length
    );
  });
  if (missingEmotionConfig.length) {
    throw new Error(`Emotional Map ledger is incomplete: ${missingEmotionConfig.join(", ")}`);
  }
  const sourceLabels = emotionalData.emotions.flatMap(
    (emotion) => candidateLedger[emotion].sourceLabels,
  );
  const atomicLabels = isLensTaxonomy ? emotionalData.atomicLabels : sourceLabels;
  if (
    !Array.isArray(atomicLabels) ||
    atomicLabels.length !== 28 ||
    new Set(atomicLabels).size !== 28 ||
    new Set(sourceLabels).size !== 28 ||
    atomicLabels.some((label) => !sourceLabels.includes(label))
  ) {
    throw new Error("Emotional Map ledger must disclose all 28 atomic model labels");
  }
  if (isLegacyTaxonomy && sourceLabels.length !== 28) {
    throw new Error("Taxonomy v2 must map each atomic label exactly once");
  }
  if (
    isLensTaxonomy &&
    (!emotionalData.calibration ||
      emotionalData.calibration.method !== "p50-p90-smoothstep" ||
      emotionalData.calibration.pipelineFingerprint !== emotionalData.pipelineFingerprint)
  ) {
    throw new Error("Overlapping-lens calibration provenance is incomplete");
  }
  const invalidProfile = emotionalData.movies.find((profile) => {
    if (!profile.reviewCount) return profile.emotionScores !== null || profile.dominantEmotion !== null;
    const scores = profile.emotionScores;
    if (!scores || !uniqueEmotions.has(profile.dominantEmotion)) return true;
    const keys = Object.keys(scores);
    if (keys.length !== uniqueEmotions.size || keys.some((emotion) => !uniqueEmotions.has(emotion))) return true;
    const values = emotionalData.emotions.map((emotion) => scores[emotion]);
    if (values.some((value) => !Number.isFinite(value) || value < 0 || value > 1)) return true;
    if (isLegacyTaxonomy) {
      return Math.abs(values.reduce((total, value) => total + value, 0) - 1) > 0.0001;
    }
    const rawScores = profile.rawLensScores;
    const rawKeys = Object.keys(rawScores || {});
    if (
      rawKeys.length !== uniqueEmotions.size ||
      rawKeys.some((emotion) => !uniqueEmotions.has(emotion)) ||
      emotionalData.emotions.some(
        (emotion) =>
          !Number.isFinite(rawScores[emotion]) || rawScores[emotion] < 0 || rawScores[emotion] > 1,
      )
    ) {
      return true;
    }
    return (
      !Number.isFinite(profile.axisX) ||
      !Number.isFinite(profile.axisY) ||
      profile.axisX < -1 ||
      profile.axisX > 1 ||
      profile.axisY < -1 ||
      profile.axisY > 1
    );
  });
  if (invalidProfile) {
    throw new Error("Emotional Map contains an invalid movie profile");
  }
  emotionLedger = candidateLedger;
  emotionalProfiles = new Map(emotionalData.movies.map((profile) => [String(profile.imdbId), profile]));
  movies.forEach((movie) => {
    movie.emotionProfile = emotionalProfiles.get(String(movie.imdbId)) || null;
  });
  emotionLegend.replaceChildren(
    ...emotionalData.emotions.map((emotion) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "emotion-legend-item";
      item.dataset.emotion = emotion;
      item.setAttribute("aria-pressed", "false");
      item.setAttribute(
        "aria-label",
        isLensTaxonomy
          ? `Show movies with a strong relative ${emotionLabel(emotion)} signal`
          : `Show only ${emotionLabel(emotion)} movies`,
      );
      item.style.setProperty("--emotion-color", emotionColor(emotion));
      const label = document.createElement("span");
      label.className = "emotion-legend-label";
      label.textContent = emotionLabel(emotion);
      item.append(createEmotionIcon(emotion), label);
      item.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 600px)").matches) {
          const revealLabel = !item.classList.contains("is-mobile-label-visible");
          emotionLegend.querySelectorAll(".emotion-legend-item").forEach((legendItem) => {
            legendItem.classList.remove("is-mobile-label-visible");
          });
          item.classList.toggle("is-mobile-label-visible", revealLabel);
        }
        setEmotionFilter(emotion);
      });
      return item;
    }),
  );
  createEmotionAnchors();
  prepareEmotionalMovies();
  emotionStatus.hidden = true;
}

async function setMapMode(mode) {
  emotionalMode = mode === "emotional";
  if (emotionalMode && !ratingFilterPopover.hidden) closeRatingFilter();
  stage.classList.toggle("is-emotional", emotionalMode);
  emotionStage.hidden = !emotionalMode;
  updateMapModeControls(emotionalMode ? "emotional" : "rating");
  searchInput.placeholder = emotionalMode ? "Search the galaxy" : "Search the orbit";
  searchInput.setAttribute(
    "aria-label",
    emotionalMode ? "Search Galaxy movies by title" : "Search Orbit movies by title",
  );
  closeSearch();
  if (emotionalMode) {
    try {
      await loadEmotionalData();
      prepareEmotionalMovies();
      requestAnimationFrame(resizeEmotionCanvas);
    } catch (error) {
      emotionStatus.hidden = false;
      emotionStatus.textContent = error.message;
    }
  } else {
    emotionTooltip.hidden = true;
    resizeRenderer();
  }
  updateFilterCount();
}

function renderMovies(year) {
  const selectedYear = Number(year);
  const yearMovies = activePersonFilter
    ? movies
    : movies.filter((movie) => movie.year === selectedYear);
  const visibleMovies = yearMovies
    .filter(movieMatchesFilters)
    .filter(movieMatchesPerson)
    .sort((a, b) => b.imdbRating - a.imdbRating)
    .slice(0, 120);

  if (
    searchFocusMovie?.year === selectedYear &&
    !visibleMovies.includes(searchFocusMovie)
  ) {
    visibleMovies.unshift(searchFocusMovie);
  }

  hoveredCard = null;
  canvas.style.cursor = "grab";
  movieGroup.children.forEach((card) => {
    card.material.userData.posterCancelled = true;
    posterTextureRecords.forEach((record) => record.materials.delete(card.material));
    if (card.material?.map?.isCanvasTexture) card.material.map.dispose();
    card.material?.dispose();
  });
  movieGroup.clear();

  const moviesByRating = new Map();
  visibleMovies.forEach((movie) => {
    const rating = movie.imdbRating.toFixed(1);
    const ratingMovies = moviesByRating.get(rating) || [];
    ratingMovies.push(movie);
    moviesByRating.set(rating, ratingMovies);
  });

  const occupiedPositions = [];
  moviesByRating.forEach((ratingMovies) => {
    // Keep equal angular spacing within a rating group, but rotate the whole
    // group to avoid posters already placed on neighboring rating ellipses.
    const angleOffset = findBestAngleOffset(ratingMovies, occupiedPositions);

    ratingMovies.forEach((movie, index) => {
      const card = createMovieCard(movie);
      card.position.copy(placeMovie(movie, index, ratingMovies.length, angleOffset));
      const isSearchFocus = movie === searchFocusMovie;
      card.userData.isSearchFocus = isSearchFocus;
      card.userData.baseOpacity = searchFocusMovie && !isSearchFocus ? 0.58 : 1;
      card.material.opacity = card.userData.baseOpacity;
      if (isSearchFocus) {
        card.userData.targetScale = 1.42;
        card.material.depthTest = false;
        card.renderOrder = 5000;
      }
      occupiedPositions.push(card.position.clone());
      movieGroup.add(card);
    });
  });
}

function setYear(value) {
  const year = clamp(Number(value), Number(slider.min), Number(slider.max));
  const yearChanged = selectedMovieYear !== year;
  selectedMovieYear = year;
  slider.value = year;
  output.value = year;
  output.textContent = year;
  previousYearButton.disabled = year <= Number(slider.min);
  nextYearButton.disabled = year >= Number(slider.max);
  const range = Number(slider.max) - Number(slider.min);
  const progress = range ? (year - Number(slider.min)) / range : 0;
  sliderControl.style.setProperty("--timeline-progress", progress);
  if (yearChanged || movieGroup.children.length === 0) {
    if (movieRenderFrame !== null) cancelAnimationFrame(movieRenderFrame);
    movieRenderFrame = requestAnimationFrame(() => {
      renderMovies(year);
      movieRenderFrame = null;
    });
  }
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function initThree() {
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  camera = new THREE.PerspectiveCamera(46, 1, 0.1, 1000);
  camera.position.set(0, 96, 185);

  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.78;
  controls.panSpeed = 0.75;
  controls.minDistance = 24;
  controls.maxDistance = 340;
  controls.screenSpacePanning = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };

  scene.add(buildRatingSurface());
  movieGroup = new THREE.Group();
  scene.add(movieGroup);

  resizeRenderer();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  const cameraDistance = camera.position.distanceTo(controls.target);
  // Ratings stay bright at every distance. Close up, their layer moves behind
  // the poster layer, so only the portions that overlap posters are covered.
  const inspectMode = cameraDistance < 85;
  ratingLabels.forEach((label) => {
    label.material.opacity = 1;
    label.renderOrder = inspectMode ? 50 : 1000;
    if (labelsInspectMode !== inspectMode) {
      label.material.depthTest = false;
      label.material.needsUpdate = true;
    }
  });
  labelsInspectMode = inspectMode;
  movieGroup.children.forEach((card) => {
    const targetScale = card.userData.targetScale || 1;
    const targetOpacity = card.userData.targetOpacity ?? card.userData.baseOpacity ?? 1;
    const targetWidth = WORLD.cardWidth * targetScale;
    const targetHeight = WORLD.cardHeight * targetScale;
    card.scale.x += (targetWidth - card.scale.x) * 0.18;
    card.scale.y += (targetHeight - card.scale.y) * 0.18;
    card.material.opacity += (targetOpacity - card.material.opacity) * 0.14;
  });
  renderer.render(scene, camera);
}

async function loadMovies() {
  dataStatus.hidden = false;
  dataStatus.textContent = "Loading movie data...";

  const response = await fetch("movies_data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load movies_data.json");
  }

  const data = await response.json();
  movies = data
    .map(cleanMovie)
    .filter(Boolean)
    .sort((a, b) => a.year - b.year || b.imdbRating - a.imdbRating);

  if (!movies.length) {
    throw new Error("movies_data.json does not contain valid movie records");
  }
  const years = movies.map((movie) => movie.year);
  const firstTimelineYear = Math.max(1930, Math.min(...years));
  const lastTimelineYear = Math.max(...years);
  availableYears = [...new Set(years)]
    .filter((year) => year >= firstTimelineYear && year <= lastTimelineYear)
    .sort((a, b) => a - b);
  slider.min = firstTimelineYear;
  slider.max = lastTimelineYear;
  timelineMin.textContent = firstTimelineYear;
  timelineMax.textContent = lastTimelineYear;
  updateFilterCount();

  const initialYear = Math.min(Number(slider.max), Math.max(Number(slider.min), Number(slider.value)));
  dataStatus.hidden = true;
  setYear(initialYear);
}

slider.addEventListener("input", (event) => {
  resetSearchFocusIndicator();
  setYear(event.target.value);
});

slider.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  resetSearchFocusIndicator();
  setYear(Number(slider.value) + (event.key === "ArrowRight" ? 1 : -1));
});

function stepTimelineYear(direction) {
  resetSearchFocusIndicator();
  setYear(Number(slider.value) + direction);
}

previousYearButton.addEventListener("click", () => stepTimelineYear(-1));
nextYearButton.addEventListener("click", () => stepTimelineYear(1));

function setYearFromPointer(clientX) {
  resetSearchFocusIndicator();
  const bounds = slider.getBoundingClientRect();
  const progress = clamp((clientX - bounds.left) / bounds.width, 0, 1);
  const year = Math.round(
    Number(slider.min) + progress * (Number(slider.max) - Number(slider.min)),
  );
  setYear(year);
}

let dragStartX = 0;
let draggedStepper = false;

stepper.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".year-step")) return;
  dragStartX = event.clientX;
  draggedStepper = false;
  stepper.classList.add("is-dragging");
  stepper.setPointerCapture(event.pointerId);
  event.preventDefault();
});

stepper.addEventListener("pointermove", (event) => {
  if (!stepper.hasPointerCapture(event.pointerId)) return;
  if (Math.abs(event.clientX - dragStartX) > 3) draggedStepper = true;
  if (draggedStepper) setYearFromPointer(event.clientX);
});

stepper.addEventListener("pointerup", (event) => {
  if (!stepper.hasPointerCapture(event.pointerId)) return;
  stepper.releasePointerCapture(event.pointerId);
  stepper.classList.remove("is-dragging");
});

stepper.addEventListener("pointercancel", () => {
  stepper.classList.remove("is-dragging");
});

function openFilters() {
  if (filterCloseTimer !== null) clearTimeout(filterCloseTimer);
  updateFilterCount();
  stage.classList.add("filters-open");
  filterOpen.setAttribute("aria-expanded", "true");
  openAccessibleDialog(filterOverlay, filterDialog, filterClose, filterOpen);
  requestAnimationFrame(() => {
    updateLayoutOffsets();
    if (emotionalMode) resizeEmotionCanvas();
    else resizeRenderer();
  });
}

function closeFilters() {
  filterOverlay.classList.remove("is-visible");
  stage.classList.remove("filters-open");
  stage.style.setProperty("--filter-subbar-height", "0px");
  filterOpen.setAttribute("aria-expanded", "false");
  requestAnimationFrame(() => {
    if (emotionalMode) resizeEmotionCanvas();
    else resizeRenderer();
  });
  if (filterCloseTimer !== null) clearTimeout(filterCloseTimer);
  filterCloseTimer = closeAccessibleDialog(filterOverlay, filterOpen, 360, {
    onComplete: () => { filterCloseTimer = null; },
  });
}

function openLearn() {
  if (learnCloseTimer !== null) clearTimeout(learnCloseTimer);
  learnOpen.setAttribute("aria-expanded", "true");
  openAccessibleDialog(learnOverlay, learnDialog, learnClose, learnOpen, { disableControls: false });
}

function closeLearn() {
  learnOverlay.classList.remove("is-visible");
  learnOpen.setAttribute("aria-expanded", "false");
  if (learnCloseTimer !== null) clearTimeout(learnCloseTimer);
  learnCloseTimer = closeAccessibleDialog(learnOverlay, learnOpen, 360, {
    onComplete: () => { learnCloseTimer = null; },
  });
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function appendHighlightedSearchTitle(container, title, queryTerms) {
  const wordPattern = /[\p{L}\p{N}]+/gu;
  let cursor = 0;
  let match;

  while ((match = wordPattern.exec(title))) {
    if (match.index > cursor) {
      container.append(document.createTextNode(title.slice(cursor, match.index)));
    }

    const word = match[0];
    const isMatch = queryTerms.some((term) => normalizeSearchText(word).includes(term));
    if (isMatch) {
      const highlighted = document.createElement("strong");
      highlighted.className = "search-result-match";
      highlighted.textContent = word;
      container.append(highlighted);
    } else {
      container.append(document.createTextNode(word));
    }
    cursor = wordPattern.lastIndex;
  }

  if (cursor < title.length) {
    container.append(document.createTextNode(title.slice(cursor)));
  }
}

function closeSearch({ restoreFocus = false } = {}) {
  searchPanel.classList.remove("is-visible");
  searchOpen.setAttribute("aria-expanded", "false");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  activeSearchResult = -1;
  if (searchCloseTimer !== null) clearTimeout(searchCloseTimer);
  searchCloseTimer = window.setTimeout(() => {
    searchPanel.hidden = true;
    if (restoreFocus) searchOpen.focus();
    searchCloseTimer = null;
  }, reducedMotionQuery.matches ? 0 : 320);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function travelCameraToMovie(movie, attemptsLeft = 12) {
  const card = movieGroup.children.find((candidate) => candidate.userData.movie === movie);
  if (!card) {
    if (attemptsLeft > 0) {
      requestAnimationFrame(() => travelCameraToMovie(movie, attemptsLeft - 1));
    }
    return;
  }

  if (cameraTravelFrame !== null) cancelAnimationFrame(cameraTravelFrame);
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const destinationTarget = card.position.clone();
  const viewDirection = startPosition.clone().sub(startTarget).normalize();
  const destinationPosition = destinationTarget.clone().add(viewDirection.multiplyScalar(27));
  const startedAt = performance.now();
  const duration = 1250;
  controls.enabled = false;

  const travel = (now) => {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    const eased = easeInOutCubic(progress);
    camera.position.lerpVectors(startPosition, destinationPosition, eased);
    controls.target.lerpVectors(startTarget, destinationTarget, eased);
    controls.update();
    if (progress < 1) {
      cameraTravelFrame = requestAnimationFrame(travel);
    } else {
      cameraTravelFrame = null;
      controls.enabled = true;
      canvas.focus();
    }
  };
  cameraTravelFrame = requestAnimationFrame(travel);
}

function selectSearchMovie(movie) {
  searchFocusMovie = movie;
  movieFocusLabel.textContent = `Movie: ${movie.title}`;
  movieFocusFilter.hidden = false;
  if (emotionalMode) {
    closeSearch();
    if (movie.emotionProfile?.reviewCount) {
      activePersonFilter = null;
      personFilter.hidden = true;
      timeline.classList.remove("is-person-filtered");
      timeline.removeAttribute("aria-disabled");
      clearEmotionHoverImmediately();
      emotionTooltip.hidden = true;
      activeEmotionFilter = null;
      emotionLegend.classList.remove("has-active-filter");
      emotionLegend.querySelectorAll(".emotion-legend-item").forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-pressed", "false");
      });
      emotionAnchorLayer?.querySelectorAll(".emotion-anchor").forEach((item) => {
        item.classList.remove("is-active");
        item.setAttribute("aria-pressed", "false");
      });
      prepareEmotionalMovies();
      centerEmotionMovie(movie);
      updateFilterCount();
    } else {
      emotionStatus.hidden = false;
      emotionStatus.textContent = `${movie.title} has insufficient review data for the Galaxy.`;
      window.setTimeout(() => {
        if (emotionalMode) emotionStatus.hidden = true;
      }, 2600);
    }
    return;
  }
  const yearChanged = Number(slider.value) !== movie.year;
  setYear(movie.year);
  if (!yearChanged) renderMovies(movie.year);
  closeSearch();
  requestAnimationFrame(() => travelCameraToMovie(movie));
}

function resetSearchFocusIndicator() {
  searchFocusMovie = null;
  movieFocusFilter.hidden = true;
}

function clearSearchMovieFocus() {
  resetSearchFocusIndicator();
  if (emotionalMode) {
    emotionSelectedMovie = null;
    scheduleEmotionDraw();
    emotionCanvas.focus();
    return;
  }
  renderMovies(Number(slider.value));
  canvas.focus();
}

function renderSearchResults() {
  const query = normalizeSearchText(searchInput.value);
  const queryTerms = query.split(" ").filter(Boolean);
  searchResults.replaceChildren();
  activeSearchResult = -1;
  searchInput.removeAttribute("aria-activedescendant");
  searchEmpty.textContent = emotionalMode
    ? "No Galaxy movies found"
    : "No movies found";
  if (!query) {
    searchEmpty.hidden = true;
    searchStatus.textContent = "";
    return;
  }

  const searchableMovies = emotionalMode
    ? movies.filter((movie) => movie.emotionProfile?.reviewCount > 0)
    : movies;
  const matches = searchableMovies
    .map((movie) => {
      const title = normalizeSearchText(movie.title);
      const titleWords = title.split(" ");
      const matchedTermCount = queryTerms.filter((term) =>
        titleWords.some((word) => word.includes(term)),
      ).length;
      return {
        movie,
        title,
        matchedTermCount,
        exactPhrase: title.includes(query),
      };
    })
    .filter(({ matchedTermCount }) => matchedTermCount > 0)
    .sort((a, b) =>
      Number(b.exactPhrase) - Number(a.exactPhrase) ||
      b.matchedTermCount - a.matchedTermCount ||
      a.title.length - b.title.length ||
      b.movie.year - a.movie.year,
    )
    .slice(0, 10);

  searchEmpty.hidden = matches.length > 0;
  searchStatus.textContent = matches.length
    ? `${matches.length} ${matches.length === 1 ? "result" : "results"} available.`
    : searchEmpty.textContent;
  matches.forEach(({ movie }) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const title = document.createElement("span");
    const year = document.createElement("span");
    button.type = "button";
    item.setAttribute("role", "presentation");
    button.className = "search-result-button";
    button.id = `search-result-${movie.imdbId || `${movie.year}-${movie.title}`.replace(/[^a-z0-9]+/gi, "-")}`;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    title.className = "search-result-title";
    appendHighlightedSearchTitle(title, movie.title, queryTerms);
    year.className = "search-result-year";
    year.textContent = movie.year;
    button.append(title, year);
    button.addEventListener("click", () => selectSearchMovie(movie));
    item.append(button);
    searchResults.append(item);
  });
}

function moveSearchSelection(direction) {
  const buttons = [...searchResults.querySelectorAll(".search-result-button")];
  if (!buttons.length) return;
  activeSearchResult = (activeSearchResult + direction + buttons.length) % buttons.length;
  buttons.forEach((button, index) => {
    const isActive = index === activeSearchResult;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  searchInput.setAttribute("aria-activedescendant", buttons[activeSearchResult].id);
  buttons[activeSearchResult].scrollIntoView({ block: "nearest" });
}

function getMovieCardAtPointer(event) {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(movieGroup.children, false);
  const focusedIntersection = intersections.find(({ object }) => object.userData.isSearchFocus);
  return focusedIntersection?.object || intersections[0]?.object || null;
}

function isImdbMarkerAtPointer(event) {
  if (!imdbMarker || emotionalMode) return false;
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(imdbMarker, false).length > 0;
}

function setHoveredCard(card) {
  if (hoveredCard === card) return;
  if (hoveredCard) {
    hoveredCard.userData.targetScale = hoveredCard.userData.isSearchFocus ? 1.42 : 1;
    hoveredCard.material.opacity = hoveredCard.userData.baseOpacity ?? 1;
    hoveredCard.renderOrder = hoveredCard.userData.isSearchFocus ? 5000 : 100;
  }
  hoveredCard = card;
  if (hoveredCard) {
    hoveredCard.userData.targetScale = hoveredCard.userData.isSearchFocus ? 1.52 : 1.28;
    hoveredCard.material.opacity = 1;
    hoveredCard.renderOrder = hoveredCard.userData.isSearchFocus ? 5000 : 2000;
  }
  canvas.style.cursor = hoveredCard ? "pointer" : "grab";
}

function getAwardSummary(movie) {
  const awardNames = movie.awardNames || [];
  const oscarWins = Number(movie.oscarWins) || 0;
  const summaries = [];
  if (oscarWins) {
    summaries.push(`${oscarWins} ${oscarWins === 1 ? "Oscar" : "Oscars"}`);
  }
  if (movie.festivalWinner) summaries.push("Major festival winner");
  if (!summaries.length && awardNames.length) summaries.push(awardNames.slice(0, 2).join(", "));
  return summaries.join(" · ") || "No award information available";
}

function renderMovieEmotionProfile(movie) {
  const profile = movie.emotionProfile;
  if (!profile?.reviewCount || !profile.emotionScores) {
    movieEmotionProfile.hidden = true;
    movieEmotionBars.replaceChildren();
    return;
  }
  movieEmotionProfile.hidden = false;
  movieEmotionConfidence.textContent = usesOverlappingLenses()
    ? `${profile.confidenceTier} confidence · relative intensity`
    : `${profile.confidenceTier} confidence`;
  const orderedEmotions = emotionalData?.emotions || Object.keys(profile.emotionScores);
  const rows = orderedEmotions.map((emotion) => {
    const value = profile.emotionScores[emotion] || 0;
    const row = document.createElement("div");
    const label = document.createElement("span");
    const track = document.createElement("span");
    const fill = document.createElement("span");
    const number = document.createElement("span");
    row.className = "movie-emotion-row";
    label.textContent = emotionLabel(emotion);
    track.className = "movie-emotion-track";
    fill.className = "movie-emotion-fill";
    fill.style.setProperty("--emotion-color", emotionColor(emotion));
    fill.style.setProperty("--emotion-value", `${Math.round(value * 100)}%`);
    number.className = "movie-emotion-value";
    number.textContent = `${Math.round(value * 100)}%`;
    if (usesOverlappingLenses()) {
      const raw = profile.rawLensScores?.[emotion] || 0;
      row.title = `${emotionLabel(emotion)}: ${Math.round(value * 100)}% relative intensity; ${Math.round(raw * 100)}% raw model-derived signal`;
    }
    track.append(fill);
    row.append(label, track, number);
    return row;
  });
  movieEmotionBars.replaceChildren(...rows);
  const sourceLabels = [];
  if (profile.reviewSources?.imdbAcademic) {
    sourceLabels.push(`${profile.reviewSources.imdbAcademic} academic IMDb`);
  }
  if (profile.reviewSources?.tmdb) {
    sourceLabels.push(`${profile.reviewSources.tmdb} TMDB`);
  }
  const sourceText = sourceLabels.length ? ` Sources: ${sourceLabels.join(" + ")}.` : "";
  movieEmotionNote.textContent = usesOverlappingLenses()
    ? `${profile.reviewCount} audience ${profile.reviewCount === 1 ? "review" : "reviews"} analyzed.${sourceText} Strongest relative signal: ${emotionLabel(profile.dominantEmotion)}. Relative intensity compares this movie with the corpus for each lens; raw lens scores overlap and are not parts of a 100% total.`
    : `${profile.reviewCount} audience ${profile.reviewCount === 1 ? "review" : "reviews"} analyzed.${sourceText} Dominant signal: ${emotionLabel(profile.dominantEmotion)}. This profile describes language in reviews and is not an objective property of the film.`;
}

function applyPersonFilter(role, name) {
  activePersonFilter = { role, name };
  const roleLabel = role === "director" ? "Director" : "Actor";
  const emotionalMatchCount = movies.filter(
    (movie) => movie.emotionProfile?.reviewCount > 0 && movieMatchesPerson(movie),
  ).length;
  personFilterLabel.textContent = emotionalMode
    ? `${roleLabel}: ${name} · ${emotionalMatchCount} emotional ${emotionalMatchCount === 1 ? "movie" : "movies"}`
    : `${roleLabel}: ${name}`;
  personFilter.hidden = false;
  timeline.classList.add("is-person-filtered");
  timeline.setAttribute("aria-disabled", "true");
  closeMovieDetails({ returnFocus: emotionalMode ? emotionCanvas : canvas });
  if (emotionalMode) {
    emotionSelectedMovie = null;
    clearEmotionHoverImmediately();
    emotionTooltip.hidden = true;
    emotionView.zoom = 1;
    emotionView.offsetX = 0;
    emotionView.offsetY = 0;
    activeEmotionFilter = null;
    emotionLegend.classList.remove("has-active-filter");
    emotionLegend.querySelectorAll(".emotion-legend-item").forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-pressed", "false");
    });
    emotionAnchorLayer?.querySelectorAll(".emotion-anchor").forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-pressed", "false");
    });
  }
  applyFilters();
}

function clearPersonFilter() {
  activePersonFilter = null;
  personFilter.hidden = true;
  timeline.classList.remove("is-person-filtered");
  timeline.removeAttribute("aria-disabled");
  applyFilters();
}

function createPersonElement(name, role) {
  const creditKey = role === "director" ? "directors" : "cast";
  const matchingMovieCount = movies.filter((movie) => (movie[creditKey] || []).includes(name)).length;
  if (matchingMovieCount < 2) {
    const text = document.createElement("span");
    text.className = "movie-person-static";
    text.textContent = name;
    return text;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "movie-person-link";
  button.textContent = name;
  button.addEventListener("click", () => applyPersonFilter(role, name));
  return button;
}

function movieGenreSet(movie) {
  return new Set(
    String(movie.genres || "")
      .split("|")
      .map((genre) => genre.trim().toLowerCase())
      .filter(Boolean),
  );
}

function relatedMoviesFor(movie, limit = 4) {
  const genres = movieGenreSet(movie);
  const directors = new Set((movie.directors || []).map((name) => name.toLowerCase()));
  const cast = new Set((movie.cast || []).map((name) => name.toLowerCase()));
  return movies
    .filter((candidate) => candidate !== movie && candidate.posterUrl)
    .map((candidate) => {
      const sharedGenres = [...movieGenreSet(candidate)].filter((genre) => genres.has(genre)).length;
      const sharedDirectors = (candidate.directors || []).filter((name) => directors.has(name.toLowerCase())).length;
      const sharedCast = (candidate.cast || []).filter((name) => cast.has(name.toLowerCase())).length;
      const ratingDistance = Math.abs(Number(candidate.imdbRating) - Number(movie.imdbRating));
      const yearDistance = Math.abs(Number(candidate.year) - Number(movie.year));
      const score =
        sharedGenres * 10 +
        sharedDirectors * 6 +
        Math.min(sharedCast, 2) * 2.5 +
        Math.max(0, 3 - ratingDistance) +
        Math.max(0, 2 - yearDistance / 12);
      return { candidate, score, sharedGenres, ratingDistance, yearDistance };
    })
    .filter(({ sharedGenres, score }) => sharedGenres > 0 || score >= 4)
    .sort((first, second) =>
      second.score - first.score ||
      first.ratingDistance - second.ratingDistance ||
      first.yearDistance - second.yearDistance ||
      first.candidate.title.localeCompare(second.candidate.title),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function renderRelatedMovies(movie) {
  if (!movieRelatedList) return;
  const cards = relatedMoviesFor(movie).map((candidate) => {
    const button = document.createElement("button");
    const poster = document.createElement("img");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    button.type = "button";
    button.className = "movie-related-card";
    button.setAttribute("aria-label", `Open ${candidate.title}, ${candidate.year}`);
    poster.src = candidate.posterUrl;
    poster.alt = "";
    poster.loading = "lazy";
    copy.className = "movie-related-copy";
    title.textContent = candidate.title;
    meta.textContent = `${candidate.year} · IMDb ${Number(candidate.imdbRating).toFixed(1)}`;
    copy.append(title, meta);
    button.append(poster, copy);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openMovieDetails(candidate);
    });
    return button;
  });
  movieRelatedList.replaceChildren(...cards);
}

function resetOrbitMovieFocus() {
  orbitFocusMovie = null;
  movieGroup?.children.forEach((card) => {
    card.userData.targetOpacity = card.userData.baseOpacity ?? 1;
    card.userData.targetScale = card.userData.isSearchFocus ? 1.42 : 1;
    card.renderOrder = card.userData.isSearchFocus ? 5000 : 100;
  });
}

function focusOrbitMovieAndOpen(card) {
  if (!card?.userData.movie) return;
  const movie = card.userData.movie;
  if (mobileViewportQuery.matches) {
    orbitFocusMovie = null;
    openMovieDetails(movie);
    return;
  }
  orbitFocusMovie = movie;
  if (movieFocusOpenTimer !== null) {
    clearTimeout(movieFocusOpenTimer);
    movieFocusOpenTimer = null;
  }
  setHoveredCard(null);

  movieGroup.children.forEach((candidate) => {
    const isSelected = candidate === card;
    candidate.userData.targetOpacity = isSelected ? 1 : 0.16;
    candidate.userData.targetScale = isSelected ? 1.86 : 0.96;
    candidate.renderOrder = isSelected ? 6000 : 80;
  });

  if (reducedMotionQuery.matches) {
    openMovieDetails(movie);
    return;
  }

  if (cameraTravelFrame !== null) cancelAnimationFrame(cameraTravelFrame);
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();
  const destinationTarget = card.position.clone();
  const viewDirection = startPosition.clone().sub(startTarget).normalize();
  const destinationPosition = destinationTarget.clone().add(viewDirection.multiplyScalar(32));
  const startedAt = performance.now();
  const duration = 1120;
  controls.enabled = false;

  const focus = (now) => {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    const eased = easeInOutCubic(progress);
    camera.position.lerpVectors(startPosition, destinationPosition, eased);
    controls.target.lerpVectors(startTarget, destinationTarget, eased);
    controls.update();
    if (progress < 1) {
      cameraTravelFrame = requestAnimationFrame(focus);
      return;
    }
    cameraTravelFrame = null;
    controls.enabled = true;
    movieFocusOpenTimer = window.setTimeout(() => {
      movieFocusOpenTimer = null;
      openMovieDetails(movie);
    }, 100);
  };
  cameraTravelFrame = requestAnimationFrame(focus);
}

function openMovieDetails(movie) {
  activeDetailMovie = movie;
  const usesOrbitPoster = !mobileViewportQuery.matches && !emotionalMode && orbitFocusMovie === movie;
  movieDetailOverlay.classList.toggle("uses-orbit-poster", usesOrbitPoster);
  if (movieDetailCloseTimer !== null) {
    clearTimeout(movieDetailCloseTimer);
    movieDetailCloseTimer = null;
  }
  movieDetailPoster.alt = `${movie.title} poster`;
  movieDetailPoster.hidden = true;
  movieDetailPosterFallbackTitle.textContent = movie.title;
  movieDetailPosterFallbackYear.textContent = movie.year;
  movieDetailPosterFallback.style.setProperty(
    "--poster-fallback-color",
    movie.color?.getStyle() || "#344b58",
  );
  movieDetailPosterFallback.hidden = false;
  const posterUrl = String(movie.posterUrl || "").trim();
  movieDetailPoster.dataset.requestedUrl = posterUrl;
  movieDetailPoster.onload = () => {
    if (movieDetailPoster.dataset.requestedUrl !== posterUrl) return;
    movieDetailPoster.hidden = false;
    movieDetailPosterFallback.hidden = true;
  };
  movieDetailPoster.onerror = () => {
    if (movieDetailPoster.dataset.requestedUrl !== posterUrl) return;
    movieDetailPoster.hidden = true;
    movieDetailPosterFallback.hidden = false;
  };
  if (posterUrl && !usesOrbitPoster) movieDetailPoster.src = posterUrl;
  else movieDetailPoster.removeAttribute("src");
  movieDetailTitle.textContent = movie.title;
  movieDetailRating.textContent = Number(movie.imdbRating).toFixed(1);
  movieDetailYear.textContent = movie.year;
  movieDetailOverview.textContent = movie.overview || "No synopsis is available for this movie.";
  movieDetailPanel.scrollTop = 0;
  renderMovieEmotionProfile(movie);
  renderRelatedMovies(movie);
  const directorButtons = (movie.directors || []).map((name) =>
    createPersonElement(name, "director"),
  );
  if (directorButtons.length) {
    movieDetailDirector.replaceChildren(...directorButtons);
  } else {
    movieDetailDirector.textContent = "Not available";
  }
  movieDetailAwards.textContent = getAwardSummary(movie);

  const genreChips = String(movie.genres || "")
    .split("|")
    .filter(Boolean)
    .map((genre) => {
      const chip = document.createElement("span");
      chip.textContent = genre;
      return chip;
    });
  movieDetailGenres.replaceChildren(...genreChips);

  const castButtons = (movie.cast || []).map((name) => createPersonElement(name, "actor"));
  if (castButtons.length) {
    movieDetailCast.replaceChildren(...castButtons);
  } else {
    movieDetailCast.textContent = "Not available";
  }

  setHoveredCard(null);
  movieDetailOverlay.classList.remove("is-visible");
  openAccessibleDialog(
    movieDetailOverlay,
    movieDetailContent,
    movieDetailClose,
    emotionalMode ? emotionCanvas : canvas,
    { disableControls: false },
  );
}

function closeMovieDetails({ restoreFocus = true, returnFocus } = {}) {
  activeDetailMovie = null;
  resetOrbitMovieFocus();
  movieDetailOverlay.classList.remove("is-visible");
  if (movieDetailCloseTimer !== null) clearTimeout(movieDetailCloseTimer);
  movieDetailCloseTimer = closeAccessibleDialog(
    movieDetailOverlay,
    emotionalMode ? emotionCanvas : canvas,
    380,
    {
      restoreFocus,
      returnFocus,
      onComplete: () => {
        movieDetailCloseTimer = null;
        movieDetailOverlay.classList.remove("uses-orbit-poster");
      },
    },
  );
}

async function shareActiveMovie() {
  if (!activeDetailMovie) return;
  const url = movieShareUrl(activeDetailMovie);
  const shareData = {
    title: `${activeDetailMovie.title} — The Movie Space`,
    text: `Explore ${activeDetailMovie.title} (${activeDetailMovie.year}) in The Movie Space.`,
    url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const linkField = document.createElement("textarea");
    linkField.value = url;
    linkField.setAttribute("readonly", "");
    linkField.style.position = "fixed";
    linkField.style.opacity = "0";
    document.body.append(linkField);
    linkField.select();
    document.execCommand("copy");
    linkField.remove();
  }

  movieDetailShare.dataset.feedback = "Link copied";
  movieDetailShare.setAttribute("aria-label", "Movie link copied");
  window.setTimeout(() => {
    delete movieDetailShare.dataset.feedback;
    movieDetailShare.setAttribute("aria-label", "Share this movie");
  }, 1800);
}

function stepMovieDetails(direction) {
  if (!activeDetailMovie) return;
  const visibleMovies = emotionalMode
    ? emotionalMovies.filter(movieMatchesPerson)
    : movieGroup.children.map((card) => card.userData.movie).filter(Boolean);
  let sequence = [...visibleMovies];

  if (!sequence.includes(activeDetailMovie)) {
    sequence = movies
      .filter((movie) => movieMatchesFilters(movie) && movieMatchesPerson(movie))
      .filter((movie) => !emotionalMode || (movie.emotionProfile?.reviewCount > 0 && movieMatchesEmotionFilter(movie)))
      .sort((first, second) => first.year - second.year || second.imdbRating - first.imdbRating);
    sequence.push(activeDetailMovie);
  }

  const currentIndex = sequence.indexOf(activeDetailMovie);
  const nextIndex = (currentIndex + direction + sequence.length) % sequence.length;
  if (nextIndex !== currentIndex) openMovieDetails(sequence[nextIndex]);
}

function filterEligibleMovies() {
  if (emotionalMode) {
    return movies.filter(
      (movie) =>
        movie.emotionProfile?.reviewCount > 0 &&
        movieMatchesEmotionFilter(movie),
    );
  }
  const firstYear = Number(slider.min);
  const lastYear = Number(slider.max);
  return movies.filter((movie) => movie.year >= firstYear && movie.year <= lastYear);
}

function updateFilterCount() {
  const matchingMovies = filterEligibleMovies()
    .filter(movieMatchesFilters)
    .filter(movieMatchesPerson).length;
  const label = emotionalMode
    ? `${matchingMovies} ${matchingMovies === 1 ? "movie" : "movies"} in galaxy`
    : `${matchingMovies} ${matchingMovies === 1 ? "movie" : "movies"} in orbit`;
  filterCount.textContent = label;
}

function filterLabel(input) {
  return input.closest("label")?.textContent.replace(/\s+/g, " ").trim() || input.value;
}

function createRemovableFilterChip(label, remove, key) {
  const chip = document.createElement("div");
  const text = document.createElement("span");
  const button = document.createElement("button");
  chip.className = "selected-filter-chip";
  chip.dataset.filterKey = key;
  text.textContent = label;
  button.type = "button";
  button.textContent = "×";
  button.setAttribute("aria-label", `Remove ${label} filter`);
  button.addEventListener("click", remove);
  chip.append(text, button);
  return chip;
}

function renderActiveFilterChips() {
  const chips = [];
  const inputs = [...genreInputs, ...durationInputs, ...awardInputs, ...regionInputs];
  inputs.filter((input) => input.checked).forEach((input) => {
    const label = filterLabel(input);
    chips.push(createRemovableFilterChip(label, () => {
      input.checked = false;
      applyFilters();
    }, `${input.name}:${input.value}`));
  });
  if (minimumRating !== 1 || maximumRating !== 10) {
    const label = `IMDb ${minimumRating.toFixed(1)}–${maximumRating.toFixed(1)}`;
    chips.push(createRemovableFilterChip(label, () => clearRatingFilter(), "rating"));
  }
  selectedFilterChips.replaceChildren(...chips);
}

function applyFilters() {
  renderActiveFilterChips();
  updateFilterCount();
  if (emotionalMode) {
    prepareEmotionalMovies();
    scheduleEmotionDraw();
  } else {
    renderMovies(Number(slider.value));
  }
}

function updateRatingFilterDisplay() {
  minimumRating = Number(ratingMinInput.value);
  maximumRating = Number(ratingMaxInput.value);
  if (minimumRating > maximumRating) {
    if (document.activeElement === ratingMinInput) {
      maximumRating = minimumRating;
      ratingMaxInput.value = maximumRating;
    } else {
      minimumRating = maximumRating;
      ratingMinInput.value = minimumRating;
    }
  }
  ratingMinOutput.value = minimumRating.toFixed(1);
  ratingMinOutput.textContent = minimumRating.toFixed(1);
  ratingMaxOutput.value = maximumRating.toFixed(1);
  ratingMaxOutput.textContent = maximumRating.toFixed(1);
  ratingFilterPopover.style.setProperty("--rating-start", `${((minimumRating - 1) / 9) * 100}%`);
  ratingFilterPopover.style.setProperty("--rating-end", `${((maximumRating - 1) / 9) * 100}%`);
  const matching = filterEligibleMovies().filter(movieMatchesFilters).filter(movieMatchesPerson).length;
  ratingFilterResult.textContent = minimumRating === 1 && maximumRating === 10
    ? "All ratings"
    : `${matching} ${matching === 1 ? "movie" : "movies"}`;
}

function commitRatingFilter() {
  updateRatingFilterDisplay();
  applyFilters();
}

function openRatingFilter() {
  updateRatingFilterDisplay();
  stage.classList.add("rating-filter-open");
  ratingFilterPopover.hidden = false;
  requestAnimationFrame(() => ratingFilterPopover.classList.add("is-visible"));
  ratingMinInput.focus();
}

function closeRatingFilter() {
  ratingFilterPopover.classList.remove("is-visible");
  ratingFilterPopover.hidden = true;
  stage.classList.remove("rating-filter-open");
  canvas.focus();
}

function clearRatingFilter({ apply = true } = {}) {
  ratingMinInput.value = "1";
  ratingMaxInput.value = "10";
  updateRatingFilterDisplay();
  if (apply) applyFilters();
}

filterOpen.addEventListener("click", openFilters);
searchOpen.addEventListener("click", () => {
  const willOpen = searchPanel.hidden || !searchPanel.classList.contains("is-visible");
  if (willOpen) {
    if (searchCloseTimer !== null) clearTimeout(searchCloseTimer);
    searchPanel.hidden = false;
    searchOpen.setAttribute("aria-expanded", "true");
    searchInput.setAttribute("aria-expanded", "true");
    searchInput.focus();
    renderSearchResults();
    requestAnimationFrame(() => searchPanel.classList.add("is-visible"));
  } else {
    closeSearch({ restoreFocus: true });
  }
});
searchInput.addEventListener("input", renderSearchResults);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveSearchSelection(event.key === "ArrowDown" ? 1 : -1);
  }
  if (event.key === "Enter") {
    const buttons = [...searchResults.querySelectorAll(".search-result-button")];
    const selected = buttons[activeSearchResult] || buttons[0];
    if (selected) {
      event.preventDefault();
      selected.click();
    }
  }
});
document.addEventListener("pointerdown", (event) => {
  if (!searchPanel.hidden && !movieSearch.contains(event.target)) closeSearch();
});
filterClose.addEventListener("click", closeFilters);
filterOverlay.addEventListener("keydown", (event) => trapDialogFocus(event, filterOverlay, filterDialog));
filterOverlay.addEventListener("click", (event) => {
  if (!filterDialog.contains(event.target)) closeFilters();
});
filterClear.addEventListener("click", () => {
  filterDialog.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
  });
  clearRatingFilter({ apply: false });
  applyFilters();
});
ratingMinInput.addEventListener("input", updateRatingFilterDisplay);
ratingMaxInput.addEventListener("input", updateRatingFilterDisplay);
ratingMinInput.addEventListener("change", commitRatingFilter);
ratingMaxInput.addEventListener("change", commitRatingFilter);
ratingFilterClear.addEventListener("click", clearRatingFilter);
ratingFilterClose.addEventListener("click", closeRatingFilter);
genreInputs.forEach((input) => input.addEventListener("change", applyFilters));
durationInputs.forEach((input) => input.addEventListener("change", applyFilters));
awardInputs.forEach((input) => input.addEventListener("change", applyFilters));
regionInputs.forEach((input) => input.addEventListener("change", applyFilters));
learnOpen.addEventListener("click", openLearn);
learnClose.addEventListener("click", closeLearn);
learnOverlay.addEventListener("click", (event) => {
  if (!learnDialog.contains(event.target)) closeLearn();
});
movieDetailClose.addEventListener("click", closeMovieDetails);
movieDetailShare.addEventListener("click", shareActiveMovie);
movieDetailOverlay.addEventListener("click", (event) => {
  if (!movieDetailContent.contains(event.target)) closeMovieDetails();
});
personFilterClear.addEventListener("click", clearPersonFilter);
movieFocusClear.addEventListener("click", clearSearchMovieFocus);
function mapModeFromHash() {
  return window.location.hash === "#emotional-map" ? "emotional" : "rating";
}

function syncMapModeFromHash() {
  const mode = mapModeFromHash();
  if (mode !== (emotionalMode ? "emotional" : "rating")) setMapMode(mode);
}

mapModeControls.forEach((control) => control.addEventListener("click", (event) => {
  event.preventDefault();
  const hash = control.getAttribute("href");
  if (window.location.hash !== hash) history.pushState(null, "", hash);
  syncMapModeFromHash();
}));
window.addEventListener("hashchange", syncMapModeFromHash);
window.addEventListener("popstate", syncMapModeFromHash);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !searchPanel.hidden) closeSearch({ restoreFocus: true });
  if (event.key === "Escape" && !filterOverlay.hidden) closeFilters();
  if (event.key === "Escape" && !learnOverlay.hidden) closeLearn();
  if (event.key === "Escape" && !movieDetailOverlay.hidden) closeMovieDetails();
  if (event.key === "Escape" && !ratingFilterPopover.hidden) closeRatingFilter();
  const target = event.target;
  const isEditingText = target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']");
  if (
    !movieDetailOverlay.hidden &&
    movieDetailOverlay.classList.contains("is-visible") &&
    !isEditingText &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    (event.key === "ArrowLeft" || event.key === "ArrowRight")
  ) {
    event.preventDefault();
    stepMovieDetails(event.key === "ArrowRight" ? 1 : -1);
  }
});

themeToggle.addEventListener("click", () => {
  stage.classList.toggle("light");
  const isLight = stage.classList.contains("light");
  themeToggle.setAttribute("aria-checked", String(isLight));
  themeToggle.setAttribute("aria-label", isLight ? "Switch to night mode" : "Switch to day mode");
  const ringColor = isLight ? 0x000000 : 0xf7f7f2;
  const ringOpacity = isLight ? 0.55 : 0.24;
  ratingRings.forEach((ring) => {
    ring.material.color.setHex(ringColor);
    ring.material.opacity = ringOpacity;
  });
  if (emotionalMode) scheduleEmotionDraw();
});

canvas.addEventListener("pointermove", (event) => {
  if (!movieDetailOverlay.hidden || orbitFocusMovie) return;
  if (isImdbMarkerAtPointer(event)) {
    setHoveredCard(null);
    canvas.style.cursor = "pointer";
    return;
  }
  setHoveredCard(getMovieCardAtPointer(event));
});
canvas.addEventListener("pointerleave", () => setHoveredCard(null));
canvas.addEventListener("pointerdown", (event) => {
  if (event.button === 0) pointerDownPosition = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", (event) => {
  if (orbitFocusMovie) return;
  if (!pointerDownPosition || event.button !== 0) return;
  const movement = Math.hypot(
    event.clientX - pointerDownPosition.x,
    event.clientY - pointerDownPosition.y,
  );
  pointerDownPosition = null;
  if (movement > 6) return;
  if (isImdbMarkerAtPointer(event)) {
    if (ratingFilterPopover.hidden) openRatingFilter();
    else closeRatingFilter();
    return;
  }
  const card = getMovieCardAtPointer(event);
  if (card?.userData.movie) focusOrbitMovieAndOpen(card);
});
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
emotionCanvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  emotionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  emotionInteractionActive = true;
  emotionHasDragged = false;
  emotionCanvas.style.cursor = "grabbing";
  emotionCanvas.setPointerCapture(event.pointerId);
  if (emotionPointers.size === 1) {
    emotionPointerDown = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: emotionView.offsetX,
      offsetY: emotionView.offsetY,
    };
    emotionPinch = null;
    return;
  }

  const points = [...emotionPointers.values()].slice(0, 2);
  const bounds = emotionCanvas.getBoundingClientRect();
  const centerX = (points[0].x + points[1].x) / 2 - bounds.left;
  const centerY = (points[0].y + points[1].y) / 2 - bounds.top;
  const scales = emotionScales(bounds);
  emotionPinch = {
    distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
    zoom: emotionView.zoom,
    worldX: (centerX - bounds.width / 2 - emotionView.offsetX) / scales.x,
    worldY: -(centerY - bounds.height / 2 - emotionView.offsetY) / scales.y,
  };
  emotionPointerDown = null;
  emotionHasDragged = true;
  emotionTooltip.hidden = true;
});
emotionCanvas.addEventListener("pointermove", (event) => {
  if (emotionPointers.has(event.pointerId)) {
    emotionPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }
  if (emotionPinch && emotionPointers.size >= 2) {
    const points = [...emotionPointers.values()].slice(0, 2);
    const bounds = emotionCanvas.getBoundingClientRect();
    const centerX = (points[0].x + points[1].x) / 2 - bounds.left;
    const centerY = (points[0].y + points[1].y) / 2 - bounds.top;
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    emotionView.zoom = clamp(emotionPinch.zoom * (distance / Math.max(1, emotionPinch.distance)), 0.7, 5);
    const scales = emotionScales(bounds);
    emotionView.offsetX = centerX - bounds.width / 2 - emotionPinch.worldX * scales.x;
    emotionView.offsetY = centerY - bounds.height / 2 + emotionPinch.worldY * scales.y;
    emotionHasDragged = true;
    emotionCloudCache = { key: "", canvas: null };
    scheduleEmotionDraw();
    return;
  }
  if (emotionPointerDown && emotionPointerDown.pointerId === event.pointerId && emotionCanvas.hasPointerCapture(event.pointerId)) {
    const deltaX = event.clientX - emotionPointerDown.clientX;
    const deltaY = event.clientY - emotionPointerDown.clientY;
    if (Math.hypot(deltaX, deltaY) > 4) emotionHasDragged = true;
    emotionView.offsetX = emotionPointerDown.offsetX + deltaX;
    emotionView.offsetY = emotionPointerDown.offsetY + deltaY;
    emotionTooltip.hidden = true;
    scheduleEmotionDraw();
    return;
  }
  updateEmotionTooltip(getEmotionMovieAtPoint(event.clientX, event.clientY), event.clientX, event.clientY);
});
emotionCanvas.addEventListener("pointerup", (event) => {
  if (emotionCanvas.hasPointerCapture(event.pointerId)) emotionCanvas.releasePointerCapture(event.pointerId);
  const wasPinching = Boolean(emotionPinch);
  const wasTap = !wasPinching && emotionPointerDown?.pointerId === event.pointerId && !emotionHasDragged;
  const movie = wasTap ? getEmotionMovieAtPoint(event.clientX, event.clientY) : null;
  emotionPointers.delete(event.pointerId);
  emotionPinch = null;
  emotionPointerDown = null;
  if (emotionPointers.size === 1) {
    const [pointerId, point] = emotionPointers.entries().next().value;
    emotionPointerDown = {
      pointerId,
      clientX: point.x,
      clientY: point.y,
      offsetX: emotionView.offsetX,
      offsetY: emotionView.offsetY,
    };
  }
  emotionInteractionActive = emotionPointers.size > 0;
  emotionCloudCache = { key: "", canvas: null };
  scheduleEmotionDraw();
  if (movie) {
    emotionSelectedMovie = movie;
    scheduleEmotionDraw();
    emotionCanvas.style.cursor = "pointer";
    openMovieDetails(movie);
  } else if (wasTap) {
    emotionSelectedMovie = null;
    scheduleEmotionDraw();
    emotionCanvas.style.cursor = "grab";
  } else {
    emotionCanvas.style.cursor = "grab";
  }
});
emotionCanvas.addEventListener("pointercancel", () => {
  emotionPointers.clear();
  emotionPinch = null;
  emotionPointerDown = null;
  emotionInteractionActive = false;
  emotionCloudCache = { key: "", canvas: null };
  emotionCanvas.style.cursor = "grab";
  scheduleEmotionDraw();
});
emotionCanvas.addEventListener("pointerleave", () => {
  if (!emotionPointerDown) updateEmotionTooltip(null, 0, 0);
});
emotionCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  emotionInteractionActive = true;
  if (emotionInteractionEndTimer !== null) clearTimeout(emotionInteractionEndTimer);
  emotionInteractionEndTimer = window.setTimeout(() => {
    emotionInteractionEndTimer = null;
    emotionInteractionActive = false;
    emotionCloudCache = { key: "", canvas: null };
    scheduleEmotionDraw();
  }, 140);
  const bounds = emotionCanvas.getBoundingClientRect();
  const pointerX = event.clientX - bounds.left;
  const pointerY = event.clientY - bounds.top;
  zoomEmotionAt(
    emotionView.zoom * Math.exp(-event.deltaY * 0.0012),
    pointerX,
    pointerY,
  );
}, { passive: false });
emotionZoomIn?.addEventListener("click", () => zoomEmotionAroundCenter(1.2));
emotionZoomOut?.addEventListener("click", () => zoomEmotionAroundCenter(1 / 1.2));
emotionCanvas.addEventListener("keydown", (event) => {
  if (event.key === "0") {
    emotionView.zoom = 1;
    emotionView.offsetX = 0;
    emotionView.offsetY = 0;
    scheduleEmotionDraw();
  }
  if (event.key === "+" || event.key === "=") {
    zoomEmotionAroundCenter(1.2);
  }
  if (event.key === "-") {
    zoomEmotionAroundCenter(1 / 1.2);
  }
});
window.addEventListener("resize", () => {
  resizeRenderer();
  if (emotionalMode) resizeEmotionCanvas();
});

initThree();
animate();
loadMovies()
  .then(async () => {
    await setMapMode(mapModeFromHash());
    const sharedMovie = movieFromSharedUrl();
    if (!sharedMovie) return;
    if (!emotionalMode) setYear(sharedMovie.year);
    requestAnimationFrame(() => openMovieDetails(sharedMovie));
  })
  .catch((error) => {
    dataStatus.hidden = false;
    dataStatus.textContent = error.message;
  });
