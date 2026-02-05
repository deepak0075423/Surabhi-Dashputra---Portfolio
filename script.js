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
    // 6.  TRACK BAR FILL  (animate when music section visible)
    // ================================================
    const tracksSec = document.getElementById('tracksSection');

    if (tracksSec) {
        const trackObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateBars();
                    trackObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        trackObs.observe(tracksSec);
    }

    function animateBars () {
        document.querySelectorAll('.tfill').forEach(function (bar, i) {
            setTimeout(function () {
                bar.style.width = (bar.dataset.w || '0') + '%';
            }, i * 220);
        });
    }

    // ================================================
    // 6b. DYNAMIC TRACK LIST & CLICK TO PLAY
    // ================================================

    // Track data - all songs from Surabhi Dashputra's Spotify
    const trackData = [
        { id: '3TXjNRh2C9ybqG2ZYDrgh5', name: 'Dhul Gaye', plays: '1,388,846', year: '2025' },
        { id: '4Mpj5odhILzZEMylxorNOs', name: 'Mangoge Na?', plays: '1,267,587', year: '2024' },
        { id: '4tefrWaeysumoEvGz23J56', name: 'Rehn De', plays: '397,508', year: '2023' },
        { id: '0DE5XwVjRp2MT2zQI8brRF', name: 'Kadar Na Jaane', plays: '257,833', year: '2022' },
        { id: '2dt3ufaUo17rMaf8bt9ZmD', name: 'Kis Raste Hai Jana', plays: '228,198', year: '2019' },
        { id: '5GevKyan5AcdTHuT9ukyNc', name: 'Raahiya Ve', plays: '147,344', year: '2019' },
        { id: '4ebzARJSxxzlvR7O5vtJ3S', name: 'More Sajan', plays: '139,408', year: '2022' },
        { id: '4kPHxTSLwAtW0jGFfmyi8E', name: 'O Ranjhna', plays: '124,027', year: '2018' },
        { id: '7EWlAp5v5iI1wrHJyXIs87', name: 'Naa Jao', plays: '71,069', year: '2022' },
        { id: '5AUYlghrRZHKxJ9ni5VIUx', name: 'Karigar', plays: '68,622', year: '2025' },
        { id: '3uGOEFiAtF4e6caYf8JFo6', name: 'Gumsum', plays: '45,000', year: '2019' },
        { id: '7rzNbxtI5OIavvltjLiNXC', name: 'Rab Ki Baatein', plays: '38,000', year: '2016' },
        { id: '5KmIKqXj2ZMK31ybmmLCmB', name: 'Tarana', plays: '25,000', year: '2013' },
        { id: '5m48aRV6nH5MeKmycAeZHK', name: 'I Love U Maa', plays: '20,000', year: '2013' },
        { id: '3U51GW2kvwnOsiHztxk1Zr', name: 'Tu Hi Hai Channa', plays: '3,699', year: '2026' },
        { id: '5BG231YR8VjjLf37AKpZre', name: 'Jism Ya Rooh', plays: '1,800', year: '2025' },
        { id: '3HB6DGSmxzzWBBWXkQUW21', name: 'Bheja No Dahi', plays: '1,500', year: '2025' }
    ];

    const trackListContainer = document.getElementById('trackList');
    const spotifyIframe = document.querySelector('.spotify-wrap iframe');

    // Track current playing song for pause/resume on reel hover
    let currentPlayingTrackId = null;

    // Calculate max plays for progress bar
    const maxPlays = Math.max(...trackData.map(t => parseInt(t.plays.replace(/,/g, ''))));

    // Generate track list dynamically
    function renderTracks() {
        if (!trackListContainer) return;

        trackListContainer.innerHTML = trackData.map(function(track, index) {
            const playsNum = parseInt(track.plays.replace(/,/g, ''));
            const barWidth = Math.round((playsNum / maxPlays) * 100);
            const num = String(index + 1).padStart(2, '0');

            return '<div class="track" data-track="' + track.id + '" tabindex="0" role="button" aria-label="Play ' + track.name + '">' +
                '<span class="tnum">' + num + '</span>' +
                '<div class="tinfo">' +
                    '<span class="tname">' + track.name + '</span>' +
                    '<span class="tplays"><i class="fas fa-play"></i> ' + track.plays + ' plays</span>' +
                '</div>' +
                '<div class="tbar"><div class="tfill" data-w="' + barWidth + '"></div></div>' +
            '</div>';
        }).join('');

        // Attach click handlers after rendering
        attachTrackHandlers();

        // Animate bars after a short delay
        setTimeout(animateBars, 300);
    }

    function attachTrackHandlers() {
        const tracks = document.querySelectorAll('.track[data-track]');

        tracks.forEach(function (track) {
            track.addEventListener('click', function () {
                const trackId = this.dataset.track;
                if (!trackId || !spotifyIframe) return;

                // Track the current playing song
                currentPlayingTrackId = trackId;

                // Update iframe to play selected track with autoplay
                spotifyIframe.src = 'https://open.spotify.com/embed/track/' + trackId + '?utm_source=generator&theme=0&autoplay=1';

                // Add active state to clicked track
                tracks.forEach(function (t) { t.classList.remove('track-active'); });
                this.classList.add('track-active');

                // Scroll to player on mobile
                if (window.innerWidth < 900) {
                    const playerWrap = document.querySelector('.spotify-wrap');
                    if (playerWrap) {
                        const offset = navbar.offsetHeight + 16;
                        const top = playerWrap.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top: top, behavior: 'smooth' });
                    }
                }
            });

            // Keyboard accessibility
            track.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // Initialize track list
    renderTracks();

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
            video: 'videos/reel1.mp4',
            title: '✨ New music coming soon! Stay tuned 🎵',
            likes: '12.5K',
            comments: '234',
            shares: '89',
            reelUrl: 'https://www.instagram.com/reel/DUNKA1_iMzr/'
        },
        {
            video: 'videos/reel2.mp4',
            title: 'Behind the scenes of Dhul Gaye 🎤',
            likes: '8.2K',
            comments: '156',
            shares: '45',
            reelUrl: 'https://www.instagram.com/reel/DUIapO5CA3E/'
        },
        {
            video: 'videos/reel3.mp4',
            title: 'Studio session vibes 🎹',
            likes: '15.1K',
            comments: '312',
            shares: '128',
            reelUrl: 'https://www.instagram.com/reel/DTH_2T0iNHO/'
        },
        {
            video: 'videos/reel4.mp4',
            title: 'Live performance highlights 🎭',
            likes: '9.8K',
            comments: '189',
            shares: '67',
            reelUrl: 'https://www.instagram.com/reel/DRRDE4NCKzI/'
        },
        {
            video: 'videos/reel5.mp4',
            title: 'Music is life 🎶',
            likes: '11.3K',
            comments: '267',
            shares: '94',
            reelUrl: 'https://www.instagram.com/reel/DPtObGIiFId/'
        },
        {
            video: 'videos/reel6.mp4',
            title: 'Creative moments in the studio 🎧',
            likes: '7.6K',
            comments: '145',
            shares: '52',
            reelUrl: 'https://www.instagram.com/reel/DPWRRWlCO0T/'
        },
        {
            video: 'videos/reel7.mp4',
            title: 'New release dropping soon! 🔥',
            likes: '14.2K',
            comments: '298',
            shares: '156',
            reelUrl: 'https://www.instagram.com/reel/DPTBu_siBkK/'
        },
        {
            video: 'videos/reel8.mp4',
            title: 'Your favorite track 💕',
            likes: '10.5K',
            comments: '223',
            shares: '78',
            reelUrl: 'https://www.instagram.com/reel/DN7z2t0jEFD/'
        },
        {
            video: 'videos/reel9.mp4',
            title: 'Trending now! 📈',
            likes: '18.9K',
            comments: '456',
            shares: '234',
            reelUrl: 'https://www.instagram.com/reel/DNVlYoYMXfB/'
        },
        {
            video: 'videos/reel10.mp4',
            title: 'Acoustic cover session 🎸',
            likes: '6.4K',
            comments: '134',
            shares: '41',
            reelUrl: 'https://www.instagram.com/reel/DNKhi-eMlUZ/'
        },
        {
            video: 'videos/reel11.mp4',
            title: 'Live clip from concert 🎤',
            likes: '8.7K',
            comments: '178',
            shares: '63',
            reelUrl: 'https://www.instagram.com/reel/DM46SUtM-KC/'
        },
        {
            video: 'videos/reel12.mp4',
            title: 'Special moment with fans 💖',
            likes: '13.1K',
            comments: '289',
            shares: '112',
            reelUrl: 'https://www.instagram.com/reel/DMXisAZSekc/'
        },
        {
            video: 'videos/reel13.mp4',
            title: 'Rehearsal time 🎼',
            likes: '5.9K',
            comments: '98',
            shares: '34',
            reelUrl: 'https://www.instagram.com/reel/DK63wYms7ck/'
        },
        {
            video: 'videos/reel14.mp4',
            title: 'Music magic ✨🎵',
            likes: '16.8K',
            comments: '367',
            shares: '189',
            reelUrl: 'https://www.instagram.com/reel/DKRq-Jisah8/'
        },
        {
            video: 'videos/reel15.mp4',
            title: 'This one went viral! 🚀',
            likes: '22.4K',
            comments: '512',
            shares: '298',
            reelUrl: 'https://www.instagram.com/reel/DJGlpEKsOGg/'
        }
    ];

    // Track if Spotify was playing before reel hover
    let spotifyWasPlaying = false;

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
                        '<source src="' + reel.video + '" type="video/mp4">' +
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

            // Autoplay when visible
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        video.play().catch(function(){});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(card);

            // Sound on hover + Spotify pause/resume
            card.addEventListener('mouseenter', function() {
                video.muted = false;
                if (soundBtn) soundBtn.innerHTML = '<i class="fas fa-volume-up"></i>';

                // Pause Spotify if a song is playing
                if (currentPlayingTrackId && spotifyIframe) {
                    spotifyWasPlaying = true;
                    // Remove autoplay to pause the music
                    spotifyIframe.src = 'https://open.spotify.com/embed/track/' + currentPlayingTrackId + '?utm_source=generator&theme=0';
                }
            });

            card.addEventListener('mouseleave', function() {
                video.muted = true;
                if (soundBtn) soundBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';

                // Resume Spotify if it was playing before
                if (spotifyWasPlaying && currentPlayingTrackId && spotifyIframe) {
                    spotifyIframe.src = 'https://open.spotify.com/embed/track/' + currentPlayingTrackId + '?utm_source=generator&theme=0&autoplay=1';
                    spotifyWasPlaying = false;
                }
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
    const API_URL = 'http://localhost:3000/api/contact';

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
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

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

})();
