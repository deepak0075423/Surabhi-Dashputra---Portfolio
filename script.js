/* ============================================================
   Portfolio JS  —  Surabhi Dashputra
   • Navbar scroll styling
   • Mobile menu
   • Smooth scroll
   • Intersection-Observer reveal animations
   • Animated stat counters
   • Track-bar fill animation
   • Active nav-link highlighting
   • Back-to-top button
   ============================================================ */

(function () {
    'use strict';

    // ── DOM refs ──
    const navbar      = document.getElementById('navbar');
    const menuToggle  = document.getElementById('menuToggle');
    const navLinks    = document.getElementById('navLinks');
    const navOverlay  = document.getElementById('navOverlay');
    const backTop     = document.getElementById('backTop');

    // Optional backend base URL (used only for the contact form).
    // The gallery is frontend-only and loads from `images/gallery/manifest.json`.
    // You can override by setting `window.BACKEND_BASE_URL` before `script.js` loads.
    const BACKEND_BASE_URL = (typeof window !== 'undefined' && window.BACKEND_BASE_URL)
        ? window.BACKEND_BASE_URL
        : 'http://localhost:3000';


    // ============================================================
    // Media control (Spotify / Reels / YouTube): play one at a time
    // ============================================================
    let activeMediaType = null; // 'spotify' | 'reel' | 'youtube' | null
    let activeReelVideo = null;
    let activeYouTubePlayer = null;
    let activeYouTubeIframe = null;

    // Spotify embed (fallback iframe + optional Spotify Iframe API controller)
    const spotifyWrap = document.querySelector('.spotify-wrap');
    const spotifyFallbackIframe = spotifyWrap ? spotifyWrap.querySelector('iframe') : null;
    const spotifyFallbackSrc = spotifyFallbackIframe ? spotifyFallbackIframe.getAttribute('src') : null;
    const spotifyArtistUri = 'spotify:track:3TXjNRh2C9ybqG2ZYDrgh5';

    let spotifyController = null;
    let spotifyControllerReady = false;
    let pendingSpotifyTrackId = null;
    let spotifyPauseRequested = false;
    let spotifyIsPlaying = false;

    // Track current selected/playing Spotify track (used for fallback reload/pause)
    let currentPlayingTrackId = null;

    // YouTube Iframe API players (optional; fallback pause via postMessage)
    const ytPlayers = [];
    let youTubeApiInitRequested = false;

    function pauseAllReels (exceptVideo) {
        document.querySelectorAll('.reel-video').forEach(function (v) {
            if (exceptVideo && v === exceptVideo) return;
            try { v.pause(); } catch (_) {}
        });
    }

    function pauseAllYouTube (opts) {
        const exceptPlayer = opts && opts.player ? opts.player : null;
        const exceptIframe = opts && opts.iframe ? opts.iframe : null;

        if (ytPlayers.length && window.YT && typeof window.YT.PlayerState !== 'undefined') {
            ytPlayers.forEach(function (p) {
                if (exceptPlayer && p === exceptPlayer) return;
                try {
                    if (exceptIframe && typeof p.getIframe === 'function' && p.getIframe() === exceptIframe) return;
                } catch (_) {}
                try { p.pauseVideo(); } catch (_) {}
            });
            return;
        }

        // Fallback: requires enablejsapi=1 on the iframe URL
        document.querySelectorAll('#youtube iframe').forEach(function (iframe) {
            if (exceptIframe && iframe === exceptIframe) return;
            try {
                if (!iframe.contentWindow) return;
                iframe.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'pauseVideo',
                    args: ''
                }), '*');
            } catch (_) {}
        });
    }

    function getSpotifyEmbedSrcForTrack (trackId, autoplay) {
        const base = 'https://open.spotify.com/embed/track/' + trackId + '?utm_source=generator&theme=0';
        return autoplay ? base + '&autoplay=1' : base;
    }

    function pauseSpotifyPlayback () {
        if (spotifyController && spotifyControllerReady && typeof spotifyController.pause === 'function') {
            try { spotifyController.pause(); } catch (_) {}
            return;
        }

        // Fallback: force a reload to stop playback
        if (!spotifyFallbackIframe) return;
        if (currentPlayingTrackId) {
            spotifyFallbackIframe.src = getSpotifyEmbedSrcForTrack(currentPlayingTrackId, false);
        } else if (spotifyFallbackSrc) {
            spotifyFallbackIframe.src = spotifyFallbackSrc;
        }
    }

    function setActiveMedia (type, opts) {
        if (type === 'spotify') {
            activeMediaType = 'spotify';
            activeReelVideo = null;
            activeYouTubePlayer = null;
            activeYouTubeIframe = null;
            spotifyPauseRequested = false;
            pauseAllReels();
            pauseAllYouTube();
            return;
        }

        if (type === 'youtube') {
            activeMediaType = 'youtube';
            activeYouTubePlayer = opts && opts.player ? opts.player : null;
            activeReelVideo = null;
            activeYouTubeIframe = opts && opts.iframe ? opts.iframe : null;
            if (!activeYouTubeIframe && activeYouTubePlayer && typeof activeYouTubePlayer.getIframe === 'function') {
                try { activeYouTubeIframe = activeYouTubePlayer.getIframe(); } catch (_) {}
            }
            spotifyPauseRequested = spotifyIsPlaying;
            pauseSpotifyPlayback();
            pauseAllReels();
            pauseAllYouTube({ player: activeYouTubePlayer, iframe: activeYouTubeIframe });
            return;
        }

        if (type === 'reel') {
            activeMediaType = 'reel';
            activeReelVideo = opts && opts.video ? opts.video : null;
            activeYouTubePlayer = null;
            activeYouTubeIframe = null;
            spotifyPauseRequested = spotifyIsPlaying;
            pauseSpotifyPlayback();
            pauseAllYouTube();
            pauseAllReels(activeReelVideo);
            return;
        }

        activeMediaType = null;
        activeReelVideo = null;
        activeYouTubePlayer = null;
        activeYouTubeIframe = null;
    }

    function playSpotifyTrack (trackId) {
        currentPlayingTrackId = trackId;
        setActiveMedia('spotify');

        // Prefer Spotify Iframe API when available (can autoplay reliably)
        if (spotifyController && spotifyControllerReady) {
            try {
                if (typeof spotifyController.loadUri === 'function') {
                    spotifyController.loadUri('spotify:track:' + trackId);
                }
                if (typeof spotifyController.play === 'function') {
                    spotifyController.play();
                }
                return;
            } catch (_) {
                // fall through to iframe fallback
            }
        }

        if (spotifyFallbackIframe) {
            spotifyFallbackIframe.src = getSpotifyEmbedSrcForTrack(trackId, true);
        }
    }

    function initSpotifyIframeApi () {
        if (!spotifyWrap) return;
        if (spotifyWrap.dataset.spotifyApiInit === 'true') return;
        spotifyWrap.dataset.spotifyApiInit = 'true';

        const mount = document.createElement('div');
        mount.id = 'spotifyEmbedMount';
        spotifyWrap.appendChild(mount);

        const prevReady = window.onSpotifyIframeApiReady;
        window.onSpotifyIframeApiReady = function (IFrameAPI) {
            try {
                const options = { uri: spotifyArtistUri, width: '100%', height: 420 };
                IFrameAPI.createController(mount, options, function (controller) {
                    spotifyController = controller;
                    spotifyControllerReady = true;
                    if (spotifyFallbackIframe) spotifyFallbackIframe.style.display = 'none';

                    // Ensure autoplay permission on the API-generated iframe
                    const apiIframe = mount.querySelector('iframe');
                    if (apiIframe) {
                        apiIframe.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture');
                        apiIframe.setAttribute('loading', 'lazy');
                    }

                    // When Spotify starts playing, pause reels + YouTube
                    if (controller && typeof controller.addListener === 'function') {
                        controller.addListener('playback_update', function (e) {
                            const isPaused = e && e.data && typeof e.data.isPaused === 'boolean'
                                ? e.data.isPaused
                                : null;
                            if (isPaused === true) spotifyIsPlaying = false;
                            if (isPaused === false) spotifyIsPlaying = true;

                            if (isPaused === false) {
                                if (!activeMediaType || activeMediaType === 'spotify') {
                                    setActiveMedia('spotify');
                                } else if (spotifyPauseRequested) {
                                    pauseSpotifyPlayback();
                                } else {
                                    // Spotify started while something else was active: treat Spotify as the new active media.
                                    setActiveMedia('spotify');
                                }
                            }
                            if (isPaused === true) {
                                if (spotifyPauseRequested) spotifyPauseRequested = false;
                                if (activeMediaType === 'spotify') setActiveMedia(null);
                            }
                        });
                    }

                    if (pendingSpotifyTrackId) {
                        const trackId = pendingSpotifyTrackId;
                        pendingSpotifyTrackId = null;
                        playSpotifyTrack(trackId);
                    }
                });
            } catch (_) {
                // Keep fallback iframe if API init fails
            }

            if (typeof prevReady === 'function') {
                try { prevReady(IFrameAPI); } catch (_) {}
            }
        };

        if (!document.querySelector('script[data-spotify-iframe-api]')) {
            const s = document.createElement('script');
            s.async = true;
            s.src = 'https://open.spotify.com/embed/iframe-api/v1';
            s.dataset.spotifyIframeApi = 'true';
            document.body.appendChild(s);
        }
    }

    // Treat focusing/clicking the Spotify embed area as "intent to play Spotify".
    // Helps ensure Spotify can take over from YouTube/Reels when the user clicks play inside the embed UI.
    function initSpotifyIntentListeners () {
        if (!spotifyWrap) return;
        if (spotifyWrap.dataset.mediaIntentInit === 'true') return;
        spotifyWrap.dataset.mediaIntentInit = 'true';

        function activate () { setActiveMedia('spotify'); }
        spotifyWrap.addEventListener('focusin', activate, true);
        spotifyWrap.addEventListener('pointerdown', activate, true);
    }

    function initYouTubeIframeApi () {
        const iframes = document.querySelectorAll('#youtube iframe');
        if (!iframes.length) return;
        if (youTubeApiInitRequested) return;
        youTubeApiInitRequested = true;

        function onStateChange (event) {
            if (!event || !event.target || !window.YT) return;
            const state = event.data;

            if (state === window.YT.PlayerState.PLAYING) {
                setActiveMedia('youtube', { player: event.target });
            }

            if (
                (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) &&
                activeMediaType === 'youtube' &&
                activeYouTubePlayer === event.target
            ) {
                setActiveMedia(null);
            }
        }

        function createPlayers () {
            if (!window.YT || !window.YT.Player) return;
            iframes.forEach(function (iframe) {
                try {
                    const player = new window.YT.Player(iframe, { events: { onStateChange: onStateChange } });
                    ytPlayers.push(player);
                } catch (_) {}
            });
        }

        if (window.YT && window.YT.Player) {
            createPlayers();
            return;
        }

        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
            try { createPlayers(); } catch (_) {}
            if (typeof prev === 'function') {
                try { prev(); } catch (_) {}
            }
        };

        if (!document.querySelector('script[data-youtube-iframe-api]')) {
            const tag = document.createElement('script');
            tag.async = true;
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.dataset.youtubeIframeApi = 'true';
            document.head.appendChild(tag);
        }
    }

    // If the YouTube API is blocked or slow, Spotify can still keep pausing YouTube.
    // Treat focusing/clicking a YouTube iframe as "intent to play" and pause other media immediately.
    function initYouTubeIntentListeners () {
        const youtubeSection = document.getElementById('youtube');
        if (!youtubeSection) return;
        if (youtubeSection.dataset.mediaIntentInit === 'true') return;
        youtubeSection.dataset.mediaIntentInit = 'true';

        function maybeActivate (e) {
            const target = e && e.target ? e.target : null;
            if (!target || target.tagName !== 'IFRAME') return;
            setActiveMedia('youtube', { iframe: target });
        }

        youtubeSection.addEventListener('focusin', maybeActivate, true);
        youtubeSection.addEventListener('pointerdown', maybeActivate, true);
    }

    initSpotifyIframeApi();
    initYouTubeIframeApi();
    initYouTubeIntentListeners();
    initSpotifyIntentListeners();

    // ================================================
    // 1.  NAVBAR — add .scrolled when page scrolls
    // ================================================
    window.addEventListener('scroll', onScroll, { passive: true });

    function onScroll () {
        // Navbar background
        navbar.classList.toggle('scrolled', window.scrollY > 50);

        // Back-to-top visibility
        backTop.classList.toggle('visible', window.scrollY > 650);

        // Active nav link
        highlightNav();
    }

    // ================================================
    // 2.  MOBILE MENU
    // ================================================
    menuToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);

    // Close on any nav link click (mobile)
    navLinks.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
            if (navLinks.classList.contains('active')) toggleMenu();
        });
    });

    function toggleMenu () {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        navOverlay.classList.toggle('active');
    }

    // ================================================
    // 3.  SMOOTH SCROLL
    // ================================================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            const offset = navbar.offsetHeight + 16;
            const top    = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    });

    // ================================================
    // 4.  SCROLL REVEAL  (Intersection Observer)
    // ================================================
    const revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObs.unobserve(entry.target);   // fire once
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -55px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
        revealObs.observe(el);
    });

    // ================================================
    // 5.  STAT COUNTERS  (animate on reveal)
    // ================================================
    const statObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const numEl  = entry.target.querySelector('.sn');
                if (numEl && !numEl.dataset.animated) {
                    numEl.dataset.animated = 'true';
                    countUp(numEl);
                }
                statObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('.stat').forEach(function (el) {
        statObs.observe(el);
    });

    /**
     * Animate a .sn element from 0 → data-target, append data-suffix.
     * Handles both integer and decimal targets (e.g. "2.6").
     */
    function countUp (el) {
        const target  = parseFloat(el.dataset.target);
        const suffix  = el.dataset.suffix || '';
        const isFloat = String(el.dataset.target).includes('.');
        const dur     = 1800;  // ms
        const start   = performance.now();

        (function step (now) {
            const progress = Math.min((now - start) / dur, 1);
            // ease-out cubic
            const eased   = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            el.textContent = (isFloat ? current.toFixed(1) : Math.round(current)) + suffix;

            if (progress < 1) requestAnimationFrame(step);
        })(start);
    }

    // ================================================
    // 6.  (Reserved — bar fill removed)
    // ================================================

    // ================================================
    // 6b. PLAYLIST (Independent vs Films & Series)
    // ================================================
    const playlistData = [
        // Independent songs (IDs pending where blank)
        { id: '', name: 'Manzoor Nahi', category: 'independent' },
        { id: '', name: 'Laage Naahi Man', category: 'independent' },
        { id: '', name: 'Mai Jaanu Na', category: 'independent' },
        { id: '7EWlAp5v5iI1wrHJyXIs87', name: 'Naa Jao', category: 'independent' },
        { id: '', name: 'Tum Yun Roothe', category: 'independent' },
        { id: '', name: 'Balma', category: 'independent' },
        { id: '4Mpj5odhILzZEMylxorNOs', name: 'Maanoge Na?', category: 'independent' },
        { id: '', name: 'Dil Vich Rab', category: 'independent' },
        { id: '', name: 'Na Maanungi', category: 'independent' },
        { id: '4tefrWaeysumoEvGz23J56', name: 'Rehn De', category: 'independent' },
        { id: '0DE5XwVjRp2MT2zQI8brRF', name: 'Qadar Na Jaane', category: 'independent' },
        { id: '3uGOEFiAtF4e6caYf8JFo6', name: 'Gumsum', category: 'independent' },
        { id: '', name: 'Teri Nazar Ka Jaadu', category: 'independent' },
        { id: '4ebzARJSxxzlvR7O5vtJ3S', name: 'More Sajan', category: 'independent' },
        { id: '3TXjNRh2C9ybqG2ZYDrgh5', name: 'Dhul Gaye', category: 'independent' },
        { id: '5BG231YR8VjjLf37AKpZre', name: 'Jism Ya Rooh', category: 'independent' },
        { id: '', name: 'Sukh Karta', category: 'independent' },
        { id: '', name: 'Aai Mehendi Wali Raat', category: 'independent' },
        { id: '', name: 'Neele Neele Ole Ole', category: 'independent' },
        { id: '', name: 'Ram Kahun', category: 'independent' },
        { id: '5AUYlghrRZHKxJ9ni5VIUx', name: 'Kaarigar', category: 'independent' },
        { id: '3U51GW2kvwnOsiHztxk1Zr', name: 'Tu Hi Hai Channa', category: 'independent' },
        { id: '', name: 'Ludhiyane Waleya', category: 'independent' },

        // Films & series
        { id: '', name: 'Bandi Yudh Ke (POW)', category: 'films' },
        { id: '', name: 'Ik Omkar (POW)', category: 'films' },
        { id: '5GevKyan5AcdTHuT9ukyNc', name: 'Raahiya Ve (POW)', category: 'films' },
        { id: '7rzNbxtI5OIavvltjLiNXC', name: 'Rab Ki Baatein (POW)', category: 'films' },
        { id: '', name: 'Aa Chal Ke Tujhe (POW)', category: 'films' },
        { id: '', name: 'Kya Kasoor Tha Amla Ka (Title Track)', category: 'films' }
    ];

    const trackListContainer = document.getElementById('trackList');
    const playlistTabs = document.querySelectorAll('.pl-tab[data-filter]');
    let activePlaylistFilter = 'all';

    const categoryLabel = {
        independent: 'Independent',
        films: 'Films & Series'
    };

    function sanitizeHtmlText (text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getFilteredPlaylist () {
        if (activePlaylistFilter === 'all') return playlistData.slice();
        return playlistData.filter(function (t) { return t.category === activePlaylistFilter; });
    }

    function renderPlaylist () {
        if (!trackListContainer) return;

        const items = getFilteredPlaylist();
        trackListContainer.innerHTML = items.map(function (track, index) {
            const num = String(index + 1).padStart(2, '0');
            const hasId = Boolean(track.id);
            const cat = track.category === 'films' ? 'films' : 'independent';
            const title = sanitizeHtmlText(track.name);
            const badge = sanitizeHtmlText(categoryLabel[cat] || 'Independent');

            return '' +
                '<div class="pl-item' + (hasId ? '' : ' is-missing') + '" ' +
                    (hasId ? ('data-track="' + track.id + '"') : '') +
                    ' data-category="' + cat + '" tabindex="' + (hasId ? '0' : '-1') + '" role="button" ' +
                    'aria-label="' + (hasId ? ('Play ' + title) : (title + ' (Spotify link pending)')) + '">' +
                    '<span class="pl-num">' + num + '</span>' +
                    '<div class="pl-main">' +
                        '<span class="pl-title">' + title + '</span>' +
                        '<span class="pl-sub">' + badge + '</span>' +
                    '</div>' +
                    '<span class="pl-badge ' + cat + '">' + badge + '</span>' +
                '</div>';
        }).join('');

        attachPlaylistHandlers();
        syncActiveTrackHighlight();
    }

    function syncActiveTrackHighlight () {
        if (!currentPlayingTrackId) return;
        const items = trackListContainer ? trackListContainer.querySelectorAll('.pl-item[data-track]') : [];
        items.forEach(function (el) {
            if (el.dataset.track === currentPlayingTrackId) el.classList.add('pl-active');
            else el.classList.remove('pl-active');
        });
    }

    function attachPlaylistHandlers () {
        if (!trackListContainer) return;
        const items = trackListContainer.querySelectorAll('.pl-item[data-track]');

        items.forEach(function (item) {
            item.addEventListener('click', function () {
                const trackId = this.dataset.track;
                if (!trackId) return;

                if (!spotifyControllerReady) pendingSpotifyTrackId = trackId;
                playSpotifyTrack(trackId);

                items.forEach(function (t) { t.classList.remove('pl-active'); });
                this.classList.add('pl-active');

                if (window.innerWidth < 900) {
                    const playerWrap = document.querySelector('.spotify-wrap');
                    if (playerWrap) {
                        const offset = navbar ? navbar.offsetHeight + 16 : 16;
                        const top = playerWrap.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top: top, behavior: 'smooth' });
                    }
                }
            });

            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    function setActivePlaylistFilter (filter) {
        activePlaylistFilter = filter;
        playlistTabs.forEach(function (btn) {
            const isActive = btn.dataset.filter === filter;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        renderPlaylist();
    }

    playlistTabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const filter = this.dataset.filter || 'all';
            setActivePlaylistFilter(filter);
        });
    });

    // Initialize playlist UI
    renderPlaylist();

    // ================================================
    // 6c. INSTAGRAM REELS
    // ================================================

    // ============================================================
    // INSTAGRAM REELS - Phone-like Video Player with Autoplay
    // ============================================================
    //
    // UPDATE REEL DATA:
    // - video: path to downloaded video file
    // - title: reel caption/title
    // - likes: like count (update manually from Instagram)
    // - comments: comment count
    // - shares: share count
    // - reelUrl: direct link to the reel on Instagram
    //
    const reelsData = [
        {
            video: 'videos/A jewel from Heeramandi \u{1F496}....This captivating thumri, with composition by Mr. Sanjay Leela Bhan.mp4',
            title: 'A jewel from Heeramandi \u{1F496} This captivating thumri by Mr. Sanjay Leela Bhansali',
            likes: '12.5K',
            comments: '234',
            shares: '89',
            reelUrl: 'https://www.instagram.com/reel/DUNKA1_iMzr/'
        },
        {
            video: 'videos/Added to ASR Playlist. Link in bio \u{1F517}\u201CJism Ya Rooh\u201Din the mesmerising voice of @surabhidashputra.mp4',
            title: 'Added to ASR Playlist \u{1F517} "Jism Ya Rooh" in the mesmerising voice of @surabhidashputra',
            likes: '8.2K',
            comments: '156',
            shares: '45',
            reelUrl: 'https://www.instagram.com/reel/DUIapO5CA3E/'
        },
        {
            video: 'videos/Here\u2019s presenting a folk called \u2018Chaiti\u2019 which is typically sung during the month of Phaagun . T.mp4',
            title: 'Here\u2019s presenting a folk called \u2018Chaiti\u2019 sung during the month of Phaagun',
            likes: '15.1K',
            comments: '312',
            shares: '128',
            reelUrl: 'https://www.instagram.com/reel/DTH_2T0iNHO/'
        },
        {
            video: 'videos/I absolutely loved all the songs of the series but \u201CNirmohiya,\u201D holds special place in my heart .mp4',
            title: 'I absolutely loved all the songs but \u201CNirmohiya\u201D holds a special place in my heart',
            likes: '9.8K',
            comments: '189',
            shares: '67',
            reelUrl: 'https://www.instagram.com/reel/DRRDE4NCKzI/'
        },
        {
            video: 'videos/I began \u2018Ghazalish\u0915\u093C\u2019 with two deeply cherished ghazals, originally sung by my guru @sureshwadka.mp4',
            title: 'I began \u2018Ghazalish\u0915\u093C\u2019 with two deeply cherished ghazals by my guru @sureshwadkar',
            likes: '11.3K',
            comments: '267',
            shares: '94',
            reelUrl: 'https://www.instagram.com/reel/DPtObGIiFId/'
        },
        {
            video: 'videos/I can hum this melody forever . Just loveee it! #hamriatriyameajaresaveriya.mp4',
            title: 'I can hum this melody forever. Just loveee it! #hamriatriyameajaresaveriya',
            likes: '7.6K',
            comments: '145',
            shares: '52',
            reelUrl: 'https://www.instagram.com/reel/DPWRRWlCO0T/'
        },
        {
            video: 'videos/Itni si baat pe roothe sajana\u2026. \u201CMore Sajan\u201D is now out on all platforms. Composed and produced.mp4',
            title: 'Itni si baat pe roothe sajana\u2026 \u201CMore Sajan\u201D is now out on all platforms',
            likes: '14.2K',
            comments: '298',
            shares: '156',
            reelUrl: 'https://www.instagram.com/reel/DPTBu_siBkK/'
        },
        {
            video: 'videos/It\u2019s always a pleasure to sing & write lyrics for Arjuna\u2019s @arjunaharjai songs, given his meticu.mp4',
            title: 'It\u2019s always a pleasure to sing & write lyrics for Arjuna\u2019s @arjunaharjai songs',
            likes: '10.5K',
            comments: '223',
            shares: '78',
            reelUrl: 'https://www.instagram.com/reel/DN7z2t0jEFD/'
        },
        {
            video: 'videos/I\u2019ve been singing this ghazal since childhood, and even today, performing it fills me with joy. .mp4',
            title: 'I\u2019ve been singing this ghazal since childhood, performing it fills me with joy',
            likes: '18.9K',
            comments: '456',
            shares: '234',
            reelUrl: 'https://www.instagram.com/reel/DNVlYoYMXfB/'
        },
        {
            video: 'videos/Music is a safe kind of high\u2764\uFE0F....On guitars @pranavatrey\u{1F970}#madanmohan #filmanpadh #aapkinazronn.mp4',
            title: 'Music is a safe kind of high \u2764\uFE0F On guitars @pranavatrey #madanmohan #aapkinazron',
            likes: '6.4K',
            comments: '134',
            shares: '41',
            reelUrl: 'https://www.instagram.com/reel/DNKhi-eMlUZ/'
        },
        {
            video: 'videos/There\u2019s something so soothing about singing \u2018Abhi Na Jao\u2019 with @surabhidashputra \u{1F3B6} It felt like.mp4',
            title: 'There\u2019s something so soothing about singing \u2018Abhi Na Jao\u2019 with @surabhidashputra \u{1F3B6}',
            likes: '8.7K',
            comments: '178',
            shares: '63',
            reelUrl: 'https://www.instagram.com/reel/DM46SUtM-KC/'
        },
        {
            video: 'videos/\u2018 Ghazalish\u0915\u093C\u2018 remains incomplete without the legendary \u2018Chupke Chupke Raat Din\u2019 echoing through.mp4',
            title: '\u2018Ghazalish\u0915\u093C\u2019 remains incomplete without the legendary \u2018Chupke Chupke Raat Din\u2019',
            likes: '13.1K',
            comments: '289',
            shares: '112',
            reelUrl: 'https://www.instagram.com/reel/DMXisAZSekc/'
        }
    ];

	    const reelsGrid = document.getElementById('reelsGrid');
	    const reelsPrev = document.querySelector('.reels-prev');
	    const reelsNext = document.querySelector('.reels-next');

    function renderReels() {
        if (!reelsGrid) return;

        reelsGrid.innerHTML = reelsData.map(function(reel) {
            return '<div class="reel-phone-card" data-reel-url="' + reel.reelUrl + '">' +
                '<div class="reel-phone-frame">' +
                    '<div class="reel-phone-notch"></div>' +
                    '<video class="reel-video" muted loop playsinline preload="metadata">' +
                        '<source src="' + reel.video.split('/').map(function(p,i){return i?encodeURIComponent(p):p;}).join('/') + '" type="video/mp4">' +
                    '</video>' +
                    '<div class="reel-phone-overlay">' +
                        '<div class="reel-phone-actions">' +
                            '<button class="reel-action"><i class="fas fa-heart"></i><span>' + reel.likes + '</span></button>' +
                            '<button class="reel-action"><i class="fas fa-comment"></i><span>' + reel.comments + '</span></button>' +
                            '<button class="reel-action"><i class="fas fa-paper-plane"></i><span>' + reel.shares + '</span></button>' +
                            '<button class="reel-action reel-sound-btn"><i class="fas fa-volume-mute"></i></button>' +
                        '</div>' +
                        '<div class="reel-phone-info">' +
                            '<span class="reel-phone-user"><i class="fab fa-instagram"></i> @surabhidashputra</span>' +
                            '<span class="reel-phone-title">' + reel.title + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="reel-phone-loader"><i class="fas fa-spinner fa-spin"></i></div>' +
                '</div>' +
            '</div>';
        }).join('');

        // Attach video handlers
        attachReelHandlers();
    }

    function attachReelHandlers() {
        const reelCards = document.querySelectorAll('.reel-phone-card');

        reelCards.forEach(function(card) {
            const video = card.querySelector('.reel-video');
            const soundBtn = card.querySelector('.reel-sound-btn');
            const loader = card.querySelector('.reel-phone-loader');

            if (!video) return;

            // Hide loader when video loads
            video.addEventListener('loadeddata', function() {
                if (loader) loader.style.opacity = '0';
            });

            // Show loader on error
            video.addEventListener('error', function() {
                if (loader) loader.innerHTML = '<i class="fab fa-instagram"></i><span>Video not found</span>';
            });

	            // Autoplay when visible (each video plays independently)
	            const observer = new IntersectionObserver(function(entries) {
	                entries.forEach(function(entry) {
	                    if (entry.isIntersecting) {
	                        video.play().catch(function(){});
	                    } else {
	                        video.pause();
	                    }
	                });
	            }, { threshold: 0.3 });
	            observer.observe(card);
	
	            // Sound on hover (unmute only this video, don't pause others)
	            card.addEventListener('mouseenter', function() {
	                video.muted = false;
	                if (soundBtn) soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
	            });

	            card.addEventListener('mouseleave', function() {
	                video.muted = true;
	                if (soundBtn) soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
	            });

            // Sound button click
	            if (soundBtn) {
	                soundBtn.addEventListener('click', function(e) {
	                    e.stopPropagation();
	                    video.muted = !video.muted;
	                    this.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
	                });
	            }

            // Click to open specific reel on Instagram
            card.addEventListener('click', function() {
                const reelUrl = this.dataset.reelUrl || 'https://www.instagram.com/surabhidashputra/reels/';
                window.open(reelUrl, '_blank');
            });
        });
    }

    // Scroll Navigation
    function scrollReels(direction) {
        if (!reelsGrid) return;
        const scrollAmount = 300;
        reelsGrid.scrollBy({
            left: direction === 'next' ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
        });
    }

    if (reelsPrev) {
        reelsPrev.addEventListener('click', function() { scrollReels('prev'); });
    }
    if (reelsNext) {
        reelsNext.addEventListener('click', function() { scrollReels('next'); });
    }

    // Keyboard navigation for reels
    if (reelsGrid) {
        reelsGrid.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') scrollReels('prev');
            if (e.key === 'ArrowRight') scrollReels('next');
        });
    }

    // Initialize reels
    renderReels();

    // ================================================
    // 6e. GALLERY — Premium Masonry with Auto-Settle
    // ================================================
    //
    // HOW TO ADD IMAGES:
    // 1) Put images in `images/gallery/` (optionally in `images/gallery/stage|studio|bts/`)
    // 2) Regenerate `images/gallery/manifest.json` (see `scripts/generate-gallery-manifest.py`)
    // 3) Refresh the site — no JS edits needed.
    //
    // Each entry: { src, alt, category ('all'|'stage'|'studio'|'bts'), tag, icon }
    //
    // Fallback items (used if backend isn't running)
    var galleryData = [
        { src: 'images/gallery/image1.jpeg',  alt: 'Photo', category: 'all', tag: 'Photo', icon: 'fa-camera' },
        { src: 'images/gallery/image2.jpeg',  alt: 'Photo', category: 'all', tag: 'Photo', icon: 'fa-camera' },
        { src: 'images/gallery/image3.jpeg',  alt: 'Photo', category: 'all', tag: 'Photo', icon: 'fa-camera' },
        { src: 'images/gallery/image4.jpeg',  alt: 'Photo', category: 'all', tag: 'Photo', icon: 'fa-camera' }
    ];

    var GALLERY_MANIFEST_URL = 'images/gallery/manifest.json';

    var GALLERY_PER_PAGE = 8;
    var galleryShown = 0;
    var galleryFilter = 'all';
    var galleryGridEl = document.getElementById('galleryGrid');
    var galleryCountEl = document.getElementById('galleryCount');
    var galleryLoadMoreBtn = document.getElementById('galleryLoadMore');
    var lightbox = document.getElementById('galleryLightbox');
    var lbImage = document.getElementById('lbImage');
    var lbCounter = document.getElementById('lbCounter');
    var lbClose = lightbox ? lightbox.querySelector('.lb-close') : null;
    var lbPrev = lightbox ? lightbox.querySelector('.lb-prev') : null;
    var lbNext = lightbox ? lightbox.querySelector('.lb-next') : null;
    var currentLbIndex = 0;

    function iconForCategory(category) {
        if (category === 'live') return 'fa-microphone';
        if (category === 'recordings') return 'fa-headphones';
        if (category === 'stage') return 'fa-microphone';
        if (category === 'studio') return 'fa-headphones';
        if (category === 'bts') return 'fa-film';
        return 'fa-camera';
    }

    function titleCase(s) {
        return String(s || '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .filter(Boolean)
            .map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); })
            .join(' ');
    }

    function labelFromSrc(src) {
        var name = String(src || '').split('/').pop() || '';
        name = name.replace(/\.[^.]+$/, '');
        name = name.replace(/^(stage|studio|bts)[-_ ]+/i, '');
        name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
        return titleCase(name || 'Photo');
    }

    function normalizeCategory(category) {
        category = String(category || '').toLowerCase();
        if (category === 'live' || category === 'stage') return 'live';
        if (category === 'recordings' || category === 'studio') return 'recordings';
        if (category === 'bts') return 'live';
        return 'all';
    }

    function buildGalleryItem(raw) {
        var src = raw && raw.src ? String(raw.src) : '';
        var category = normalizeCategory(raw && raw.category ? raw.category : 'all');
        var label = labelFromSrc(src);
        return { src: src, alt: label, category: category, tag: label, icon: iconForCategory(category) };
    }

    function getFilteredGallery() {
        if (galleryFilter === 'all') return galleryData;
        return galleryData.filter(function(item) { return item.category === galleryFilter; });
    }

    // Staggered reveal animation
    function staggerReveal(container) {
        var items = container.querySelectorAll('.gallery-item:not(.gi-visible)');
        items.forEach(function(el, i) {
            setTimeout(function() {
                el.classList.add('gi-visible');
            }, i * 80);
        });
    }

    function renderGallery(reset) {
        if (!galleryGridEl) return;
        if (reset) {
            galleryGridEl.innerHTML = '';
            galleryShown = 0;
        }

        var filtered = getFilteredGallery();
        var end = Math.min(galleryShown + GALLERY_PER_PAGE, filtered.length);
        var fragment = document.createDocumentFragment();

        for (var i = galleryShown; i < end; i++) {
            var item = filtered[i];
            var div = document.createElement('div');
            div.className = 'gallery-item';
            div.dataset.category = item.category;
            div.dataset.index = String(i);
            div.innerHTML =
                '<img src="' + item.src + '" alt="Surabhi Dashputra - ' + item.alt + '" loading="lazy">' +
                '<span class="gi-num">' + (i + 1) + '</span>' +
                '<span class="gi-accent"></span>' +
                '<div class="gi-overlay">' +
                    '<span class="gi-tag"><i class="fas ' + item.icon + '"></i> ' + item.tag + '</span>' +
                    '<span class="gi-expand"><i class="fas fa-expand"></i></span>' +
                '</div>';
            div.addEventListener('click', (function(idx) {
                return function() { openLightbox(idx); };
            })(i));

            // 3D tilt effect on mouse move
            div.addEventListener('mousemove', function(e) {
                var rect = this.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                this.style.transform = 'perspective(800px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) scale(1.02)';
            });
            div.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });

            fragment.appendChild(div);
        }

        galleryGridEl.appendChild(fragment);
        galleryShown = end;

        // Staggered reveal
        staggerReveal(galleryGridEl);

        // Update counter
        if (galleryCountEl) {
            galleryCountEl.textContent = 'Showing ' + galleryShown + ' of ' + filtered.length + ' photos';
        }

        // Toggle load more button
        if (galleryLoadMoreBtn) {
            if (galleryShown >= filtered.length) {
                galleryLoadMoreBtn.classList.add('hidden');
            } else {
                galleryLoadMoreBtn.classList.remove('hidden');
            }
        }
    }

    function openLightbox(index) {
        if (!lightbox || !lbImage) return;
        var filtered = getFilteredGallery();
        currentLbIndex = index;
        if (!filtered[currentLbIndex]) return;
        lbImage.src = filtered[currentLbIndex].src;
        lbCounter.textContent = (currentLbIndex + 1) + ' / ' + filtered.length;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigateLb(dir) {
        var filtered = getFilteredGallery();
        currentLbIndex = (currentLbIndex + dir + filtered.length) % filtered.length;
        if (!filtered[currentLbIndex]) return;
        lbImage.src = filtered[currentLbIndex].src;
        lbCounter.textContent = (currentLbIndex + 1) + ' / ' + filtered.length;
    }

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function() { navigateLb(-1); });
    if (lbNext) lbNext.addEventListener('click', function() { navigateLb(1); });

    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) closeLightbox();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLb(-1);
        if (e.key === 'ArrowRight') navigateLb(1);
    });

    // Load More button
    if (galleryLoadMoreBtn) {
        galleryLoadMoreBtn.addEventListener('click', function() {
            renderGallery(false);
        });
    }

    // Gallery Filters
    var filterBtns = document.querySelectorAll('.gf-btn');
    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            galleryFilter = this.dataset.filter;
            filterBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            renderGallery(true);
        });
    });

    function updateGalleryFilterVisibility() {
        var counts = { live: 0, recordings: 0 };
        galleryData.forEach(function(item) {
            var c = item && item.category ? item.category : 'all';
            if (counts[c] != null) counts[c] += 1;
        });

        filterBtns.forEach(function(btn) {
            var f = btn && btn.dataset ? btn.dataset.filter : '';
            if (!f || f === 'all') return;
            btn.style.display = counts[f] ? '' : 'none';
        });

        if (galleryFilter !== 'all' && !counts[galleryFilter]) {
            galleryFilter = 'all';
            filterBtns.forEach(function(b) { b.classList.toggle('active', b.dataset.filter === 'all'); });
        }
    }

    async function loadGalleryFromManifest() {
        try {
            var resp = await fetch(GALLERY_MANIFEST_URL, { cache: 'no-store' });
            if (!resp.ok) throw new Error('Gallery manifest failed: ' + resp.status);

            var data = await resp.json();
            var list = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data && Array.isArray(data.images)) {
                list = data.images;
            }

            galleryData = list
                .map(function(item) {
                    if (typeof item === 'string') {
                        var src = item.indexOf('/') >= 0 ? item : ('images/gallery/' + item);
                        return buildGalleryItem({ src: src, category: 'all' });
                    }
                    return buildGalleryItem(item);
                })
                .filter(function(x) { return x && x.src; });

            updateGalleryFilterVisibility();
            renderGallery(true);
        } catch (e) {
            updateGalleryFilterVisibility();
            renderGallery(true);
            try { console.warn('[gallery] Using fallback data:', e && e.message ? e.message : e); } catch (_) {}
        }
    }

    // Initialize gallery (fallback first, then backend if available)
    updateGalleryFilterVisibility();
    renderGallery(true);
    loadGalleryFromManifest();

    // ================================================
    // 6f. FILMS TABS — Films / TV Toggle + Scroll
    // ================================================
    var filmTabBtns = document.querySelectorAll('.ft-btn');
    var filmCards = document.querySelectorAll('.film-card[data-type]');
    var filmsGrid = document.getElementById('filmsGrid');
    var filmsGridWrap = document.getElementById('filmsGridWrap');
    var filmsPrev = document.getElementById('filmsPrev');
    var filmsNext = document.getElementById('filmsNext');

    // Update scroll arrows visibility
    function updateFilmsScroll() {
        if (!filmsGrid || !filmsGridWrap) return;
        var scrollLeft = filmsGrid.scrollLeft;
        var maxScroll = filmsGrid.scrollWidth - filmsGrid.clientWidth;
        var canScrollLeft = scrollLeft > 5;
        var canScrollRight = maxScroll > 5 && scrollLeft < maxScroll - 5;

        if (filmsPrev) filmsPrev.classList.toggle('visible', canScrollLeft);
        if (filmsNext) filmsNext.classList.toggle('visible', canScrollRight);
        filmsGridWrap.classList.toggle('can-scroll-left', canScrollLeft);
        filmsGridWrap.classList.toggle('can-scroll-right', canScrollRight);
    }

    function scrollFilms(direction) {
        if (!filmsGrid) return;
        var card = filmsGrid.querySelector('.film-card:not([style*="display: none"])');
        var cardWidth = card ? card.offsetWidth + 24 : 350;
        filmsGrid.scrollBy({
            left: direction === 'next' ? cardWidth : -cardWidth,
            behavior: 'smooth'
        });
    }

    if (filmsGrid) {
        filmsGrid.addEventListener('scroll', updateFilmsScroll);
        window.addEventListener('resize', updateFilmsScroll);
    }
    if (filmsPrev) {
        filmsPrev.addEventListener('click', function(e) {
            e.preventDefault();
            scrollFilms('prev');
        });
    }
    if (filmsNext) {
        filmsNext.addEventListener('click', function(e) {
            e.preventDefault();
            scrollFilms('next');
        });
    }

    filmTabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tab = this.dataset.tab;
            filmTabBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');

            filmCards.forEach(function(card) {
                if (card.dataset.type === tab) {
                    card.style.display = '';
                    card.classList.add('visible');
                } else {
                    card.style.display = 'none';
                }
            });

            // Reset scroll and update arrows after tab switch
            if (filmsGrid) filmsGrid.scrollLeft = 0;
            setTimeout(updateFilmsScroll, 100);
        });
    });

    // Initial scroll check
    setTimeout(updateFilmsScroll, 300);

    // ================================================
    // 6h. JINGLES — YouTube Video Popup
    // ================================================
    var jinglePopup = document.getElementById('jinglePopup');
    var jinglePopupPlayer = document.getElementById('jinglePopupPlayer');
    var jinglePopupClose = document.getElementById('jinglePopupClose');
    var jinglePopupBackdrop = jinglePopup ? jinglePopup.querySelector('.jingle-popup-backdrop') : null;

    function openJinglePopup(videoId) {
        if (!jinglePopup || !jinglePopupPlayer) return;
        jinglePopupPlayer.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        jinglePopup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeJinglePopup() {
        if (!jinglePopup || !jinglePopupPlayer) return;
        jinglePopup.classList.remove('active');
        jinglePopupPlayer.innerHTML = '';
        document.body.style.overflow = '';
    }

    // Jingles Carousel Scroll
    var jinglesGrid = document.getElementById('jinglesGrid');
    var jinglesWrap = document.getElementById('jinglesWrap');
    var jinglesPrev = document.getElementById('jinglesPrev');
    var jinglesNext = document.getElementById('jinglesNext');

    function updateJinglesScroll() {
        if (!jinglesGrid || !jinglesWrap) return;
        var scrollLeft = jinglesGrid.scrollLeft;
        var maxScroll = jinglesGrid.scrollWidth - jinglesGrid.clientWidth;
        var canScrollLeft = scrollLeft > 5;
        var canScrollRight = maxScroll > 5 && scrollLeft < maxScroll - 5;

        if (jinglesPrev) jinglesPrev.classList.toggle('visible', canScrollLeft);
        if (jinglesNext) jinglesNext.classList.toggle('visible', canScrollRight);
        jinglesWrap.classList.toggle('can-scroll-left', canScrollLeft);
        jinglesWrap.classList.toggle('can-scroll-right', canScrollRight);
    }

    function scrollJingles(direction) {
        if (!jinglesGrid) return;
        var card = jinglesGrid.querySelector('.jingle-card');
        var cardWidth = card ? card.offsetWidth + 16 : 400;
        jinglesGrid.scrollBy({
            left: direction === 'next' ? cardWidth : -cardWidth,
            behavior: 'smooth'
        });
    }

    if (jinglesGrid) {
        jinglesGrid.addEventListener('scroll', updateJinglesScroll);
        window.addEventListener('resize', updateJinglesScroll);
    }
    if (jinglesPrev) {
        jinglesPrev.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scrollJingles('prev');
        });
    }
    if (jinglesNext) {
        jinglesNext.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scrollJingles('next');
        });
    }
    setTimeout(updateJinglesScroll, 300);

    // Attach click to jingle cards via event delegation (survives CMS re-render)
    if (jinglesGrid) {
        jinglesGrid.addEventListener('click', function(e) {
            var card = e.target.closest('.jingle-card[data-yt]');
            if (card) {
                var videoId = card.dataset.yt;
                if (videoId) openJinglePopup(videoId);
            }
        });
    }

    if (jinglePopupClose) jinglePopupClose.addEventListener('click', closeJinglePopup);
    if (jinglePopupBackdrop) jinglePopupBackdrop.addEventListener('click', closeJinglePopup);

    document.addEventListener('keydown', function(e) {
        if (jinglePopup && jinglePopup.classList.contains('active') && e.key === 'Escape') {
            closeJinglePopup();
        }
    });

    // ================================================
    // 6g. NEWS — Data-driven with Load More
    // ================================================
    //
    // HOW TO ADD NEWS:
    // Simply add new entries to the newsData array below (newest first).
    // Each entry: { month, year, labelText, labelClass, labelIcon, title, desc, url, metas: [{icon,text}] }
    // labelClass options: '' (release/green), 'milestone' (gold), 'press' (purple), 'collab' (rose)
    //
    var newsData = [
        { month: 'Sep', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra — The Source',
          desc: 'Press feature highlighting Surabhi Dashputra and her journey.',
          url: 'https://thesource.com/2025/09/10/surabhi-dashputra/',
          metas: [{ icon: 'fa-newspaper', text: 'The Source' }, { icon: 'fa-calendar', text: 'Sep 10, 2025' }] },
        { month: 'Sep', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Indian artist Surabhi Dashputra to release new works with UK label',
          desc: 'Press story about upcoming releases with a UK label and cultural collaboration.',
          url: 'https://runwaytimes.com/2025/09/08/indian-artist-surabhi-dashputra-to-release-new-works-with-uk-label-strengthening-cultural-bridges-through-music/',
          metas: [{ icon: 'fa-newspaper', text: 'Runway Times' }, { icon: 'fa-calendar', text: 'Sep 8, 2025' }] },
        { month: 'Sep', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra signs multi-song deal with UK indie label Aart Sense Records',
          desc: 'Press coverage on a multi-song deal signaling a new chapter in global indie music.',
          url: 'https://musictimes.co.uk/2025/09/02/surabhi-dashputra-signs-multi-song-deal-with-uk-indie-label-aart-sense-records-signaling-a-bold-new-chapter-in-global-indie-music/',
          metas: [{ icon: 'fa-newspaper', text: 'Music Times (UK)' }, { icon: 'fa-calendar', text: 'Sep 2, 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Top Indian Songs of the Week (24th Aug 2025)',
          desc: 'Weekly roundup featuring top Indian songs around 24th August 2025.',
          url: 'https://extragavanza.in/blog/Top-Indian-Songs-of-the-week-24th-August-2025?fbclid=PAZnRzaAMfoK9leHRuA2FlbQIxMQABp9e_cLsgIwp3H-Fc2Z-p1F_6RW2uv_lIlM-hxQImJQFazwVcmR938ykwy4W3_aem_-Pcgue-ONMcy7V0nSS96Zg',
          metas: [{ icon: 'fa-newspaper', text: 'Extragavanza' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra to release her next ghazal “Jism Yaa Rooh”',
          desc: 'Coverage of Surabhi’s upcoming ghazal release “Jism Yaa Rooh”.',
          url: 'https://www.indulgexpress.com/culture/music/2025/Aug/14/surabhi-dashputra-to-release-her-next-a-ghazal-jism-yaa-rooh',
          metas: [{ icon: 'fa-newspaper', text: 'Indulge Express' }, { icon: 'fa-calendar', text: 'Aug 14, 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra will unveil her next musical gem with ghazal “Jism Yaa Rooh”',
          desc: 'Press feature announcing the upcoming ghazal “Jism Yaa Rooh”.',
          url: 'https://urbanasian.com/entertainment/2025/08/surabhi-dashputra-will-unveil-her-next-musical-gem-with-ghazal-jism-yaa-rooh/',
          metas: [{ icon: 'fa-newspaper', text: 'Urban Asian' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra to release her upcoming single “Jism Yaa Rooh” on August 19',
          desc: 'Announcement post for the upcoming single “Jism Yaa Rooh”.',
          url: 'https://planetbollywood.com/wp/news/surabhi-dashputra-to-release-her-upcoming-single-jism-yaa-rooh-on-august-19/',
          metas: [{ icon: 'fa-newspaper', text: 'Planet Bollywood' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra to unveil her next musical gem',
          desc: 'Editorial feature teasing the next musical release.',
          url: 'https://radioandmusic.com/entertainment/editorial/250813-surabhi-dashputra-unveil-her-next-musical-gem-0',
          metas: [{ icon: 'fa-newspaper', text: 'Radio & Music' }, { icon: 'fa-calendar', text: 'Aug 13, 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra pens heartfelt lyrics for Arijit Singh’s new release “Dhul Gaye”',
          desc: 'Press feature on Surabhi’s lyrics for Arijit Singh’s track “Dhul Gaye”.',
          url: 'https://www.musiculture.in/surabhi-dashputra-pens-heartfelt-lyrics-for-arijit-singhs-new-release-dhul-gaye/',
          metas: [{ icon: 'fa-newspaper', text: 'Musiculture' }, { icon: 'fa-calendar', text: 'Aug 6, 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra crafts emotional lyrics for Arijit Singh’s “Dhul Gaye”',
          desc: 'Press coverage highlighting Surabhi’s lyric-writing for “Dhul Gaye”.',
          url: 'https://loudest.in/independent-music/surabhi-dashputra-crafts-emotional-lyrics-for-arijit-singhs-soul-stirring-track-dhul-gaye-18536.html',
          metas: [{ icon: 'fa-newspaper', text: 'Loudest.in' }, { icon: 'fa-calendar', text: 'Aug 6, 2025' }] },
        { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
          title: 'Surabhi Dashputra pens heartfelt lyrics for “Dhul Gaye” — Tellychakkar',
          desc: 'Press mention of Surabhi’s lyrics for Arijit Singh’s “Dhul Gaye”.',
          url: 'https://www.tellychakkar.com/tv/tv-news/surabhi-dashputra-pens-heartfelt-lyrics-arijit-singh-s-soulful-new-release-dhul-gaye',
          metas: [{ icon: 'fa-newspaper', text: 'Tellychakkar' }, { icon: 'fa-calendar', text: 'Aug 2025' }] }
        // ADD MORE NEWS HERE — just follow the same format above (newest first).
    ];

    var NEWS_PER_PAGE = 5;
    var newsShown = 0;
    var newsTimelineEl = document.getElementById('newsTimeline');
    var newsCountEl = document.getElementById('newsCount');
    var newsLoadMoreBtn = document.getElementById('newsLoadMore');

    function renderNews(reset) {
        if (!newsTimelineEl) return;
        if (reset) {
            newsTimelineEl.innerHTML = '';
            newsShown = 0;
        }

        function escapeHtml (value) {
            return String(value == null ? '' : value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function escapeAttr (value) {
            return escapeHtml(value).replace(/`/g, '&#96;');
        }

        var end = Math.min(newsShown + NEWS_PER_PAGE, newsData.length);
        var fragment = document.createDocumentFragment();

        for (var i = newsShown; i < end; i++) {
            var item = newsData[i];
            var newsItem = document.createElement('div');
            newsItem.className = 'news-item';

            // Build metas HTML
            var metasHtml = '';
            if (item.metas && item.metas.length) {
                for (var m = 0; m < item.metas.length; m++) {
                    metasHtml += '<span><i class="fas ' + escapeAttr(item.metas[m].icon) + '"></i> ' + escapeHtml(item.metas[m].text) + '</span>';
                }
            }

            var readHtml = '';
            if (item.url) {
                readHtml =
                    '<div class="news-actions">' +
                        '<a class="news-read" href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener">' +
                            'Read Article <i class="fas fa-arrow-up-right-from-square"></i>' +
                        '</a>' +
                    '</div>';
            }

            newsItem.innerHTML =
                '<div class="news-date-col">' +
                    '<div class="news-date-badge">' +
                        '<span class="nd-month">' + escapeHtml(item.month) + '</span>' +
                        '<span class="nd-year">' + escapeHtml(item.year) + '</span>' +
                    '</div>' +
                    '<div class="news-line"></div>' +
                '</div>' +
                '<div class="news-content">' +
                    '<div class="news-card">' +
                        '<span class="news-label ' + item.labelClass + '">' +
                            '<i class="fas ' + escapeAttr(item.labelIcon) + '"></i> ' + escapeHtml(item.labelText) +
                        '</span>' +
                        '<h3>' + escapeHtml(item.title) + '</h3>' +
                        '<p>' + escapeHtml(item.desc) + '</p>' +
                        '<div class="news-meta">' + metasHtml + '</div>' +
                        readHtml +
                    '</div>' +
                '</div>';

            fragment.appendChild(newsItem);
        }

        newsTimelineEl.appendChild(fragment);
        newsShown = end;

        // Update counter
        if (newsCountEl) {
            newsCountEl.textContent = 'Showing ' + newsShown + ' of ' + newsData.length + ' updates';
        }

        // Toggle Load More button
        if (newsLoadMoreBtn) {
            if (newsShown >= newsData.length) {
                newsLoadMoreBtn.classList.add('hidden');
            } else {
                newsLoadMoreBtn.classList.remove('hidden');
            }
        }
    }

    // Load More button
    if (newsLoadMoreBtn) {
        newsLoadMoreBtn.addEventListener('click', function() {
            renderNews(false);
        });
    }

    // Initialize news
    renderNews(true);

    // ================================================
    // 6d. YOUTUBE SCROLL NAVIGATION
    // ================================================
    const ytGrid = document.getElementById('ytGrid');
    const ytPrev = document.querySelector('.yt-prev');
    const ytNext = document.querySelector('.yt-next');

    function scrollYouTube(direction) {
        if (!ytGrid) return;
        // Scroll by the width of one video card + gap
        const card = ytGrid.querySelector('.yt-video-card');
        const cardWidth = card ? card.offsetWidth + 24 : 400;

        ytGrid.scrollBy({
            left: direction === 'next' ? cardWidth : -cardWidth,
            behavior: 'smooth'
        });
    }

    if (ytPrev) {
        ytPrev.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scrollYouTube('prev');
        });
    }
    if (ytNext) {
        ytNext.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            scrollYouTube('next');
        });
    }

    // Keyboard navigation for YouTube grid
    if (ytGrid) {
        ytGrid.setAttribute('tabindex', '0');
        ytGrid.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollYouTube('prev');
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollYouTube('next');
            }
        });
    }

    // ================================================
    // 7.  ACTIVE NAV LINK HIGHLIGHT
    // ================================================
    const sectionEls = document.querySelectorAll('section[id]');

    function highlightNav () {
        let current = '';
        sectionEls.forEach(function (sec) {
            if (window.scrollY >= sec.offsetTop - navbar.offsetHeight - 90) {
                current = sec.getAttribute('id');
            }
        });
        document.querySelectorAll('.nav-links a').forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    }

    // ================================================
    // 8.  CONTACT FORM HANDLER (SMTP Backend)
    // ================================================
    // Backend server must be running: cd backend && npm start
    const API_URL = BACKEND_BASE_URL + '/api/contact';
    const API_FALLBACK_URL = 'http://localhost:3000/api/contact';

    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const submitBtn = contactForm ? contactForm.querySelector('.btn-submit') : null;

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            // Simple validation
            if (!data.name || !data.email || !data.subject || !data.message) {
                return;
            }

            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            }

            try {
                // Send to backend API
                let response;
                try {
                    response = await fetch(API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                } catch (err) {
                    if (API_URL !== API_FALLBACK_URL) {
                        response = await fetch(API_FALLBACK_URL, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                    } else {
                        throw err;
                    }
                }

                if (response && !response.ok && API_URL !== API_FALLBACK_URL) {
                    response = await fetch(API_FALLBACK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                }

                const result = await response.json();

                if (result.success) {
                    // Show success message
                    contactForm.style.display = 'none';
                    if (formSuccess) {
                        formSuccess.classList.add('show');
                    }

                    // Reset form after delay
                    setTimeout(function() {
                        contactForm.reset();
                        contactForm.style.display = 'flex';
                        if (formSuccess) {
                            formSuccess.classList.remove('show');
                        }
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                        }
                    }, 5000);
                } else {
                    throw new Error(result.error || 'Failed to send message');
                }
            } catch (error) {
                console.error('Contact form error:', error);
                alert('Error: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                }
            }
        });
    }

    // ============================================================
    // CMS CONTENT INTEGRATION
    // Fetches editable content from backend API and updates DOM.
    // Falls back silently to static HTML if API is unavailable.
    // ============================================================
    async function loadCMSContent() {
        try {
            var resp = await fetch(BACKEND_BASE_URL + '/api/content');
            if (!resp.ok) throw new Error('CMS API unavailable');
            var content = await resp.json();

            if (content.meta) applyMeta(content.meta);
            if (content.navigation) applyNavigation(content.navigation);
            if (content.hero) applyHero(content.hero);
            if (content.about) applyAbout(content.about);
            if (content.stats) applyStats(content.stats);
            if (content.music) applyMusic(content.music);
            if (content.films) applyFilms(content.films);
            if (content.news) applyNews(content.news);
            if (content.youtube) applyYouTube(content.youtube);
            if (content.jingles) applyJingles(content.jingles);
            if (content.reels) applyReels(content.reels);
            if (content.gallery) applyGalleryText(content.gallery);
            if (content.academy) applyAcademy(content.academy);
            if (content.contact) applyContact(content.contact);
            if (content.footer) applyFooter(content.footer);
            if (content.logo) applyLogo(content.logo);

            console.log('[CMS] Content loaded from API');
        } catch (err) {
            console.warn('[CMS] Using static content:', err.message);
        }
    }

    function applyMeta(d) {
        if (d.pageTitle) document.title = d.pageTitle;
        var meta = document.querySelector('meta[name="description"]');
        if (meta && d.metaDescription) meta.setAttribute('content', d.metaDescription);
    }

    function applyNavigation(d) {
        if (!d.links) return;
        var ul = document.getElementById('navLinks');
        if (!ul) return;
        ul.innerHTML = d.links.map(function(l) {
            return '<li><a href="' + l.href + '">' + l.label + '</a></li>';
        }).join('');
    }

    function applyHero(d) {
        var badge = document.querySelector('.hero .badge');
        if (badge && d.badge) badge.textContent = d.badge;
        var fn = document.querySelector('.name-first');
        if (fn && d.firstName) fn.textContent = d.firstName;
        var ln = document.querySelector('.name-last');
        if (ln && d.lastName) ln.textContent = d.lastName;
        var sub = document.querySelector('.hero-sub');
        if (sub && d.subheading) {
            sub.innerHTML = d.subheading + '<br><span class="gold-text">' + (d.spotifyListeners || '') + ' Monthly Listeners</span> on Spotify';
        }
        var img = document.querySelector('.hero-placeholder img');
        if (img && d.heroImage) img.src = d.heroImage;
        if (d.ctaButtons && d.ctaButtons.length) {
            var btnsWrap = document.querySelector('.hero-btns');
            if (btnsWrap) {
                btnsWrap.innerHTML = d.ctaButtons.map(function(b) {
                    return '<a href="' + b.url + '" target="_blank" rel="noopener" class="btn ' + b.class + '"><i class="' + b.icon + '"></i> ' + b.label + '</a>';
                }).join('');
            }
        }
        if (d.socialLinks && d.socialLinks.length) {
            var socials = document.querySelector('.hero-socials');
            if (socials) {
                socials.innerHTML = d.socialLinks.map(function(s) {
                    return '<a href="' + s.url + '" target="_blank" rel="noopener" aria-label="' + s.label + '"><i class="' + s.icon + '"></i></a>';
                }).join('');
            }
        }
    }

    function applyAbout(d) {
        var sec = document.querySelector('#about');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.textContent = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var lead = sec.querySelector('.about-lead');
        if (lead && d.leadParagraph) lead.innerHTML = d.leadParagraph;
        var textDiv = sec.querySelector('.about-text');
        if (textDiv && d.bodyParagraphs) {
            var ps = textDiv.querySelectorAll('p:not(.about-lead)');
            d.bodyParagraphs.forEach(function(txt, i) {
                if (ps[i]) ps[i].innerHTML = txt;
            });
        }
        if (d.tags) {
            var tagsDiv = sec.querySelector('.tags');
            if (tagsDiv) {
                tagsDiv.innerHTML = d.tags.map(function(t) {
                    return '<span class="tag">' + t + '</span>';
                }).join('');
            }
        }
        var badge = sec.querySelector('.float-badge');
        if (badge && d.floatBadge) badge.innerHTML = '<i class="fab fa-spotify"></i> ' + d.floatBadge;
        var img = sec.querySelector('.about-placeholder img');
        if (img && d.aboutImage) img.src = d.aboutImage;
    }

    function applyStats(d) {
        if (!d.items) return;
        var stats = document.querySelectorAll('.stats-band .stat');
        d.items.forEach(function(item, i) {
            if (!stats[i]) return;
            var ico = stats[i].querySelector('i');
            if (ico) ico.className = item.icon;
            var sn = stats[i].querySelector('.sn');
            if (sn) {
                sn.setAttribute('data-target', item.target);
                sn.setAttribute('data-suffix', item.suffix || '');
                // Reset animation flag and re-run countUp with new values
                delete sn.dataset.animated;
                countUp(sn);
            }
            var sl = stats[i].querySelector('.sl');
            if (sl) sl.textContent = item.label;
        });
    }

    function applyMusic(d) {
        if (d.playlist && d.playlist.length) {
            playlistData.length = 0;
            d.playlist.forEach(function(t) {
                playlistData.push({ id: t.spotifyId || '', name: t.title, category: t.category });
            });
            renderPlaylist();
        }
        var sec = document.querySelector('#music');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.textContent = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
    }

    function applyFilms(d) {
        var sec = document.querySelector('#films');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.tabs) {
            var tabsWrap = sec.querySelector('.films-tabs');
            if (tabsWrap) {
                tabsWrap.innerHTML = d.tabs.map(function(t, i) {
                    return '<button class="ft-btn' + (i === 0 ? ' active' : '') + '" data-tab="' + t.key + '"><i class="' + t.icon + '"></i> ' + t.label + '</button>';
                }).join('');
            }
        }
        if (d.cards) {
            var grid = sec.querySelector('.films-grid');
            if (grid) {
                grid.innerHTML = d.cards.map(function(c) {
                    var bg = c.gradient ? 'background:' + c.gradient : (c.image ? 'background-image:url(' + c.image + ')' : '');
                    return '<div class="film-card visible" data-type="' + (c.type || 'films') + '"' + (c.type === 'tv' ? ' style="display:none"' : '') + '>' +
                        '<div class="film-top" style="' + bg + '">' +
                        (c.image ? '<img src="' + c.image + '" alt="' + c.title + '">' : '') +
                        '<span class="film-yr">' + c.year + '</span>' +
                        '</div>' +
                        '<div class="film-body"><h3>' + c.title + '</h3><p>' + c.description + '</p><span class="film-genre">' + c.genre + '</span></div>' +
                        '</div>';
                }).join('');
                // Re-bind tab switching to new cards
                filmCards = grid.querySelectorAll('.film-card[data-type]');
            }
        }
        // Re-bind tab buttons
        var newTabBtns = sec.querySelectorAll('.ft-btn');
        if (newTabBtns.length) {
            filmTabBtns = newTabBtns;
            filmTabBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var tab = this.dataset.tab;
                    filmTabBtns.forEach(function(b) { b.classList.remove('active'); });
                    this.classList.add('active');
                    filmCards.forEach(function(card) {
                        if (card.dataset.type === tab) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                    if (filmsGrid) filmsGrid.scrollLeft = 0;
                    setTimeout(updateFilmsScroll, 100);
                });
            });
        }
        setTimeout(updateFilmsScroll, 100);
    }

    function applyNews(d) {
        if (d.items) {
            newsData.length = 0;
            d.items.forEach(function(n) { newsData.push(n); });
            newsShown = 0;
            if (newsTimelineEl) newsTimelineEl.innerHTML = '';
            renderNews(true);
        }
        var sec = document.querySelector('#news');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.perPage) NEWS_PER_PAGE = parseInt(d.perPage, 10) || 5;
    }

    function applyYouTube(d) {
        var sec = document.querySelector('#youtube');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.videos) {
            var grid = document.getElementById('ytGrid');
            if (grid) {
                grid.innerHTML = d.videos.map(function(v) {
                    return '<div class="yt-video-card"><div class="yt-video-wrap">' +
                        '<iframe src="https://www.youtube.com/embed/' + v.embedId + '?enablejsapi=1" title="' + v.title + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
                        '</div><div class="yt-video-info"><span class="yt-video-title">' + v.title + '</span></div></div>';
                }).join('');
            }
        }
        var chName = sec.querySelector('.yt-channel-name');
        if (chName && d.channelName) chName.textContent = d.channelName;
        var chTag = sec.querySelector('.yt-channel-tagline');
        if (chTag && d.channelTagline) chTag.textContent = d.channelTagline;
        if (d.stats) {
            var statsWrap = sec.querySelector('.yt-stats');
            if (statsWrap) {
                statsWrap.innerHTML = d.stats.map(function(s) {
                    return '<div class="yt-stat"><i class="' + s.icon + '"></i><span>' + s.value + '</span> ' + s.label + '</div>';
                }).join('');
            }
        }
        var subBtn = sec.querySelector('.btn-yt');
        if (subBtn && d.subscribeUrl) subBtn.href = d.subscribeUrl;
    }

    function applyJingles(d) {
        var sec = document.querySelector('#jingles');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.cards) {
            var grid = document.getElementById('jinglesGrid');
            if (grid) {
                grid.innerHTML = d.cards.map(function(c) {
                    var tagsHtml = (c.tags || []).map(function(t) {
                        return '<span><i class="' + t.icon + '"></i> ' + t.label + '</span>';
                    }).join('');
                    return '<div class="jingle-card" data-yt="' + c.youtubeId + '">' +
                        '<div class="jingle-thumb" style="background-image:url(\'https://img.youtube.com/vi/' + c.youtubeId + '/hqdefault.jpg\')">' +
                        '<div class="jingle-play"><i class="fas fa-play"></i></div></div>' +
                        '<div class="jingle-info"><span class="jingle-brand"><i class="' + c.brandIcon + '"></i> ' + c.brand + '</span>' +
                        '<h3>' + c.title + '</h3><p>' + c.description + '</p>' +
                        '<div class="jingle-tags">' + tagsHtml + '</div></div></div>';
                }).join('');
            }
        }
    }

    function applyReels(d) {
        if (d.reels) {
            reelsData.length = 0;
            d.reels.forEach(function(r) { reelsData.push(r); });
            renderReels();
        }
        var sec = document.querySelector('#reels');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        var chName = sec.querySelector('.reels-channel-name');
        if (chName && d.channelName) chName.textContent = d.channelName;
        var chTag = sec.querySelector('.reels-channel-tagline');
        if (chTag && d.channelTagline) chTag.textContent = d.channelTagline;
        if (d.stats) {
            var statsWrap = sec.querySelector('.reels-stats');
            if (statsWrap) {
                statsWrap.innerHTML = d.stats.map(function(s) {
                    return '<div class="rstat"><i class="' + s.icon + '"></i><span>' + s.value + '</span> ' + s.label + '</div>';
                }).join('');
            }
        }
        var followBtn = sec.querySelector('.btn-insta');
        if (followBtn && d.followUrl) followBtn.href = d.followUrl;
    }

    function applyGalleryText(d) {
        var sec = document.querySelector('#gallery');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.sec-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.perPage) GALLERY_PER_PAGE = parseInt(d.perPage, 10) || 8;
        if (d.filterTabs) {
            var filtersWrap = sec.querySelector('.gallery-filters');
            if (filtersWrap) {
                filtersWrap.innerHTML = d.filterTabs.map(function(t, i) {
                    return '<button class="gf-btn' + (i === 0 ? ' active' : '') + '" data-filter="' + t.filter + '">' + t.label + '</button>';
                }).join('');
                // Re-bind filter click events
                filtersWrap.querySelectorAll('.gf-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        filtersWrap.querySelectorAll('.gf-btn').forEach(function(b) { b.classList.remove('active'); });
                        btn.classList.add('active');
                        galleryFilter = btn.dataset.filter;
                        renderGallery(true);
                    });
                });
            }
        }
        // Reload gallery images from CMS data
        if (d.images && Array.isArray(d.images) && d.images.length > 0) {
            galleryData = d.images
                .filter(function(img) { return img && img.src; })
                .map(function(img) { return buildGalleryItem(img); });
            galleryFilter = 'all';
            updateGalleryFilterVisibility();
            renderGallery(true);
        }
    }

    function applyAcademy(d) {
        var sec = document.querySelector('#academy');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.innerHTML = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var name = sec.querySelector('.academy-info h3');
        if (name && d.academyName) name.textContent = d.academyName;
        var desc = sec.querySelector('.academy-info p');
        if (desc && d.description) desc.textContent = d.description;
        if (d.features) {
            var featWrap = sec.querySelector('.academy-features');
            if (featWrap) {
                featWrap.innerHTML = d.features.map(function(f) {
                    return '<span><i class="' + f.icon + '"></i> ' + f.label + '</span>';
                }).join('');
            }
        }
        var cta = sec.querySelector('.btn-academy');
        if (cta) {
            if (d.ctaText) cta.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + d.ctaText;
            if (d.academyUrl) cta.href = d.academyUrl;
        }
        var logo = sec.querySelector('.academy-visual img');
        if (logo && d.logoImage) logo.src = d.logoImage;
    }

    function applyContact(d) {
        var sec = document.querySelector('#contact');
        if (!sec) return;
        var tag = sec.querySelector('.sec-tag');
        if (tag && d.tag) tag.textContent = d.tag;
        var h2 = sec.querySelector('.sec-head h2');
        if (h2 && d.title) h2.innerHTML = d.title;
        var sub = sec.querySelector('.contact-sub');
        if (sub && d.subtitle) sub.textContent = d.subtitle;
        if (d.socialCards) {
            var grid = sec.querySelector('.social-grid');
            if (grid) {
                grid.innerHTML = d.socialCards.map(function(c) {
                    return '<a href="' + c.url + '" target="_blank" rel="noopener" class="social-card ' + c.class + '">' +
                        '<i class="' + c.icon + '"></i><span class="s-name">' + c.platform + '</span>' +
                        '<span class="s-handle">' + c.handle + '</span></a>';
                }).join('');
            }
        }
        var fh = sec.querySelector('.contact-form-wrap h3');
        if (fh && d.formHeading) fh.innerHTML = '<i class="fas fa-envelope"></i> ' + d.formHeading;
        var fs = sec.querySelector('.form-sub');
        if (fs && d.formSubtitle) fs.textContent = d.formSubtitle;
        if (d.subjectOptions) {
            var select = sec.querySelector('#subject');
            if (select) {
                select.innerHTML = d.subjectOptions.map(function(o) {
                    return '<option value="' + o.value + '">' + o.label + '</option>';
                }).join('');
            }
        }
    }

    function applyFooter(d) {
        var footer = document.querySelector('footer');
        if (!footer) return;
        var desc = footer.querySelector('.footer-desc');
        if (desc && d.description) desc.textContent = d.description;
        if (d.links) {
            var linksWrap = footer.querySelector('.footer-links');
            if (linksWrap) {
                linksWrap.innerHTML = d.links.map(function(l) {
                    return '<a href="' + l.href + '">' + l.label + '</a>';
                }).join('');
            }
        }
        var copy = footer.querySelector('.footer-copy');
        if (copy && d.copyright) copy.textContent = d.copyright;
    }

    function applyLogo(d) {
        if (d.siteLogo) {
            var navLogo = document.querySelector('#navbar .logo-img');
            if (navLogo) navLogo.src = d.siteLogo;
            var footLogo = document.querySelector('footer .footer-logo-img');
            if (footLogo) footLogo.src = d.siteLogo;
        }
    }

    // Load CMS content on page ready
    loadCMSContent();

})();
