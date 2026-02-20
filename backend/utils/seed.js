/**
 * Seed Script — Generates initial JSON data files from current hardcoded content.
 * Run once: node utils/seed.js
 */
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { writeJSON, adminPath, resetTokensPath, messagesPath, contentPath, ensureDir, DATA_DIR, CONTENT_DIR, BACKUP_DIR } = require('./json-store');

async function seed() {
    console.log('Seeding CMS data files...\n');

    // Ensure directories
    await ensureDir(DATA_DIR);
    await ensureDir(CONTENT_DIR);
    await ensureDir(BACKUP_DIR);

    // ── Admin credentials ──
    const defaultPassword = 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const jwtSecret = crypto.randomBytes(48).toString('hex');
    await writeJSON(adminPath(), {
        username: 'admin',
        passwordHash,
        email: 'ppdd5423@gmail.com',
        jwtSecret,
        createdAt: new Date().toISOString()
    });
    console.log('  [+] data/admin.json (user: admin, pass: admin123)');

    // Reset tokens (empty)
    await writeJSON(resetTokensPath(), { tokens: [] });
    console.log('  [+] data/reset-tokens.json');

    // Contact messages (empty)
    await writeJSON(messagesPath(), { messages: [] });
    console.log('  [+] data/messages.json');

    // ── Content: Meta ──
    await writeJSON(contentPath('meta'), {
        pageTitle: 'Surabhi Dashputra | Singer & Content Creator',
        metaDescription: 'Surabhi Dashputra — Singer, Content Creator & Musician. 60K+ Monthly Spotify Listeners. Featured in Bollywood film soundtracks.',
        themeColor: '#08080f'
    });
    console.log('  [+] content/meta.json');

    // ── Content: Navigation ──
    await writeJSON(contentPath('navigation'), {
        links: [
            { href: '#home', label: 'Home' },
            { href: '#about', label: 'About' },
            { href: '#music', label: 'Popular' },
            { href: '#films', label: 'Films' },
            { href: '#news', label: 'News' },
            { href: '#youtube', label: 'YouTube' },
            { href: '#jingles', label: 'Jingles' },
            { href: '#reels', label: 'Reels' },
            { href: '#gallery', label: 'Photos' },
            { href: '#academy', label: 'Academy' },
            { href: '#contact', label: 'Connect' }
        ]
    });
    console.log('  [+] content/navigation.json');

    // ── Content: Hero ──
    await writeJSON(contentPath('hero'), {
        badge: '\u2726 Singer \u00b7 Content Creator \u00b7 Musician',
        firstName: 'Surabhi',
        lastName: 'Dashputra',
        subheading: 'Crafting soulful melodies that resonate across borders.',
        spotifyListeners: '60,000+',
        heroImage: 'images/image24.png',
        ctaButtons: [
            { label: 'Listen on Spotify', url: 'https://open.spotify.com/artist/5OAB0WGU0xp8UY2lihPD3F', icon: 'fab fa-spotify', class: 'btn-spotify' },
            { label: 'YouTube', url: 'https://www.youtube.com/@surabhidashputra', icon: 'fab fa-youtube', class: 'btn-yt' }
        ],
        socialLinks: [
            { url: 'https://www.instagram.com/surabhidashputra/', icon: 'fab fa-instagram', label: 'Instagram' },
            { url: 'https://open.spotify.com/artist/5OAB0WGU0xp8UY2lihPD3F', icon: 'fab fa-spotify', label: 'Spotify' },
            { url: 'https://www.youtube.com/@surabhidashputra', icon: 'fab fa-youtube', label: 'YouTube' }
        ]
    });
    console.log('  [+] content/hero.json');

    // ── Content: About ──
    await writeJSON(contentPath('about'), {
        tag: 'About Me',
        title: 'The Voice <span class="highlight">Behind the Music</span>',
        leadParagraph: 'Surabhi Dashputra is a versatile Indian singer and content creator whose soulful voice has captivated over <strong>60,000 monthly listeners</strong> on Spotify.',
        bodyParagraphs: [
            'With a career spanning multiple genres, Surabhi has lent her powerful vocals to iconic Bollywood film soundtracks and released original music that deeply resonates with audiences. Her hit tracks <em>"Dhul Gaye"</em> and <em>"Mangoge Na?"</em> have collectively crossed <strong>2.6 million streams</strong>.',
            'Beyond music, Surabhi is a passionate content creator \u2014 engaging her growing audience on YouTube and Instagram with authentic storytelling and creative visual content.'
        ],
        tags: [
            '\ud83c\udfa4 Vocalist',
            '\ud83c\udfac Film Soundtracks',
            '\ud83d\udcf1 Content Creator',
            '\ud83c\udfb5 Songwriter'
        ],
        floatBadge: '60K+ Monthly Listeners',
        aboutImage: 'images/image1.jpeg'
    });
    console.log('  [+] content/about.json');

    // ── Content: Stats ──
    await writeJSON(contentPath('stats'), {
        items: [
            { icon: 'fas fa-headphones', target: '60', suffix: 'K+', label: 'Monthly Listeners' },
            { icon: 'fas fa-play-circle', target: '2.6', suffix: 'M+', label: 'Total Streams' },
            { icon: 'fas fa-film', target: '3', suffix: '', label: 'Film Soundtracks' },
            { icon: 'fas fa-music', target: '10', suffix: '+', label: 'Original Releases' }
        ]
    });
    console.log('  [+] content/stats.json');

    // ── Content: Music ──
    await writeJSON(contentPath('music'), {
        tag: 'Music',
        title: 'Spotify <span class="highlight">Playlist</span>',
        tabs: [
            { filter: 'all', label: 'All' },
            { filter: 'films', label: 'Films & Series' },
            { filter: 'independent', label: 'Independent' }
        ],
        defaultTrackUri: '3TXjNRh2C9ybqG2ZYDrgh5',
        spotifyArtistUrl: 'https://open.spotify.com/artist/5OAB0WGU0xp8UY2lihPD3F',
        playlist: [
            { title: 'Manzoor Nahi', spotifyId: '', category: 'independent' },
            { title: 'Laage Naahi Man', spotifyId: '', category: 'independent' },
            { title: 'Mai Jaanu Na', spotifyId: '', category: 'independent' },
            { title: 'Naa Jao', spotifyId: '7EWlAp5v5iI1wrHJyXIs87', category: 'independent' },
            { title: 'Tum Yun Roothe', spotifyId: '', category: 'independent' },
            { title: 'Balma', spotifyId: '', category: 'independent' },
            { title: 'Maanoge Na?', spotifyId: '4Mpj5odhILzZEMylxorNOs', category: 'independent' },
            { title: 'Dil Vich Rab', spotifyId: '', category: 'independent' },
            { title: 'Na Maanungi', spotifyId: '', category: 'independent' },
            { title: 'Rehn De', spotifyId: '4tefrWaeysumoEvGz23J56', category: 'independent' },
            { title: 'Qadar Na Jaane', spotifyId: '0DE5XwVjRp2MT2zQI8brRF', category: 'independent' },
            { title: 'Gumsum', spotifyId: '3uGOEFiAtF4e6caYf8JFo6', category: 'independent' },
            { title: 'Teri Nazar Ka Jaadu', spotifyId: '', category: 'independent' },
            { title: 'More Sajan', spotifyId: '4ebzARJSxxzlvR7O5vtJ3S', category: 'independent' },
            { title: 'Dhul Gaye', spotifyId: '3TXjNRh2C9ybqG2ZYDrgh5', category: 'independent' },
            { title: 'Jism Ya Rooh', spotifyId: '5BG231YR8VjjLf37AKpZre', category: 'independent' },
            { title: 'Sukh Karta', spotifyId: '', category: 'independent' },
            { title: 'Aai Mehendi Wali Raat', spotifyId: '', category: 'independent' },
            { title: 'Neele Neele Ole Ole', spotifyId: '', category: 'independent' },
            { title: 'Ram Kahun', spotifyId: '', category: 'independent' },
            { title: 'Kaarigar', spotifyId: '5AUYlghrRZHKxJ9ni5VIUx', category: 'independent' },
            { title: 'Tu Hi Hai Channa', spotifyId: '3U51GW2kvwnOsiHztxk1Zr', category: 'independent' },
            { title: 'Ludhiyane Waleya', spotifyId: '', category: 'independent' },
            { title: 'Bandi Yudh Ke (POW)', spotifyId: '', category: 'films' },
            { title: 'Ik Omkar (POW)', spotifyId: '', category: 'films' },
            { title: 'Raahiya Ve (POW)', spotifyId: '5GevKyan5AcdTHuT9ukyNc', category: 'films' },
            { title: 'Rab Ki Baatein (POW)', spotifyId: '7rzNbxtI5OIavvltjLiNXC', category: 'films' },
            { title: 'Aa Chal Ke Tujhe (POW)', spotifyId: '', category: 'films' },
            { title: 'Kya Kasoor Tha Amla Ka (Title Track)', spotifyId: '', category: 'films' }
        ]
    });
    console.log('  [+] content/music.json');

    // ── Content: Films ──
    await writeJSON(contentPath('films'), {
        tag: '<i class="fas fa-clapperboard"></i> Filmography',
        title: 'Films & TV <span class="highlight">Soundtracks</span>',
        subtitle: 'Lending soulful vocals to the silver screen and beyond',
        tabs: [
            { key: 'films', icon: 'fas fa-film', label: 'Films' },
            { key: 'tv', icon: 'fas fa-tv', label: 'TV/Web Series' }
        ],
        cards: [
            {
                title: 'Judgementall Hai Kya', year: '2019',
                description: "Surabhi's evocative vocals bring emotion to this psychological thriller's captivating soundtrack.",
                genre: 'Bollywood Thriller', image: 'images/image4.jpeg',
                gradient: 'linear-gradient(135deg,#667eea,#764ba2)', type: 'films'
            },
            {
                title: 'Titoo MBA', year: 'Hindi',
                description: 'Her melodic rendition adds warmth and romance to this heartfelt cinematic story.',
                genre: 'Hindi Cinema', image: 'images/image5.jpeg',
                gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', type: 'films'
            },
            {
                title: 'DHAAGE', year: 'Classic',
                description: 'Contributing to the legacy soundtrack of this beloved film, showcasing her vocal versatility.',
                genre: 'Bollywood Classic', image: 'images/image6.jpeg',
                gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', type: 'films'
            },
            {
                title: 'P.O.W. \u2013 Bandi Yuddh Ke', year: 'Series',
                description: 'Captivating title tracks and background scores that set the tone for episodic storytelling.',
                genre: 'Web Series', image: 'images/image7.jpeg',
                gradient: '', type: 'tv'
            }
        ]
    });
    console.log('  [+] content/films.json');

    // ── Content: News ──
    await writeJSON(contentPath('news'), {
        tag: '<i class="fas fa-newspaper"></i> Latest Updates',
        title: 'In the <span class="highlight">News</span>',
        subtitle: 'Press features, releases & milestones',
        perPage: 5,
        items: [
            { month: 'Sep', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra \u2014 The Source',
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
              url: 'https://extragavanza.in/blog/Top-Indian-Songs-of-the-week-24th-August-2025',
              metas: [{ icon: 'fa-newspaper', text: 'Extragavanza' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra to release her next ghazal "Jism Yaa Rooh"',
              desc: 'Coverage of Surabhi\u2019s upcoming ghazal release "Jism Yaa Rooh".',
              url: 'https://www.indulgexpress.com/culture/music/2025/Aug/14/surabhi-dashputra-to-release-her-next-a-ghazal-jism-yaa-rooh',
              metas: [{ icon: 'fa-newspaper', text: 'Indulge Express' }, { icon: 'fa-calendar', text: 'Aug 14, 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra will unveil her next musical gem with ghazal "Jism Yaa Rooh"',
              desc: 'Press feature announcing the upcoming ghazal "Jism Yaa Rooh".',
              url: 'https://urbanasian.com/entertainment/2025/08/surabhi-dashputra-will-unveil-her-next-musical-gem-with-ghazal-jism-yaa-rooh/',
              metas: [{ icon: 'fa-newspaper', text: 'Urban Asian' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra to release her upcoming single "Jism Yaa Rooh" on August 19',
              desc: 'Announcement post for the upcoming single "Jism Yaa Rooh".',
              url: 'https://planetbollywood.com/wp/news/surabhi-dashputra-to-release-her-upcoming-single-jism-yaa-rooh-on-august-19/',
              metas: [{ icon: 'fa-newspaper', text: 'Planet Bollywood' }, { icon: 'fa-calendar', text: 'Aug 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra to unveil her next musical gem',
              desc: 'Editorial feature teasing the next musical release.',
              url: 'https://radioandmusic.com/entertainment/editorial/250813-surabhi-dashputra-unveil-her-next-musical-gem-0',
              metas: [{ icon: 'fa-newspaper', text: 'Radio & Music' }, { icon: 'fa-calendar', text: 'Aug 13, 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra pens heartfelt lyrics for Arijit Singh\u2019s new release "Dhul Gaye"',
              desc: 'Press feature on Surabhi\u2019s lyrics for Arijit Singh\u2019s track "Dhul Gaye".',
              url: 'https://www.musiculture.in/surabhi-dashputra-pens-heartfelt-lyrics-for-arijit-singhs-new-release-dhul-gaye/',
              metas: [{ icon: 'fa-newspaper', text: 'Musiculture' }, { icon: 'fa-calendar', text: 'Aug 6, 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra crafts emotional lyrics for Arijit Singh\u2019s "Dhul Gaye"',
              desc: 'Press coverage highlighting Surabhi\u2019s lyric-writing for "Dhul Gaye".',
              url: 'https://loudest.in/independent-music/surabhi-dashputra-crafts-emotional-lyrics-for-arijit-singhs-soul-stirring-track-dhul-gaye-18536.html',
              metas: [{ icon: 'fa-newspaper', text: 'Loudest.in' }, { icon: 'fa-calendar', text: 'Aug 6, 2025' }] },
            { month: 'Aug', year: '2025', labelText: 'Press', labelClass: 'press', labelIcon: 'fa-newspaper',
              title: 'Surabhi Dashputra pens heartfelt lyrics for "Dhul Gaye" \u2014 Tellychakkar',
              desc: 'Press mention of Surabhi\u2019s lyrics for Arijit Singh\u2019s "Dhul Gaye".',
              url: 'https://www.tellychakkar.com/tv/tv-news/surabhi-dashputra-pens-heartfelt-lyrics-arijit-singh-s-soulful-new-release-dhul-gaye',
              metas: [{ icon: 'fa-newspaper', text: 'Tellychakkar' }, { icon: 'fa-calendar', text: 'Aug 2025' }] }
        ]
    });
    console.log('  [+] content/news.json');

    // ── Content: YouTube ──
    await writeJSON(contentPath('youtube'), {
        tag: '<i class="fab fa-youtube"></i> Watch Now',
        title: 'YouTube <span class="highlight">Videos</span>',
        subtitle: 'Music videos, live performances & exclusive content',
        videos: [
            { title: 'Surabhi Dashputra Showreel', embedId: 'dKnkzcl80jw' },
            { title: 'Do not miss it!', embedId: 'yr4YkeL__Bo' },
            { title: 'Sufi Mashup', embedId: '8ggJNCvnA2s' },
            { title: "'Ghazalish\u0915\u093C Showreel' | Love For Ghazals | Ek Shaam Ghazlon Ke Naam | Surabhi Dashputra", embedId: 'F_yvcXjf0RM' }
        ],
        channelName: '@surabhidashputra',
        channelTagline: 'Hit Play. Feel the Magic.',
        stats: [
            { icon: 'fas fa-play-circle', value: '100+', label: 'Videos' },
            { icon: 'fas fa-eye', value: '2M+', label: 'Views' },
            { icon: 'fas fa-users', value: '10K+', label: 'Subscribers' }
        ],
        subscribeUrl: 'https://www.youtube.com/@surabhidashputra'
    });
    console.log('  [+] content/youtube.json');

    // ── Content: Jingles ──
    await writeJSON(contentPath('jingles'), {
        tag: '<i class="fas fa-bullhorn"></i> Commercial Work',
        title: 'Ad <span class="highlight">Jingles</span>',
        subtitle: 'Catchy tunes & vocal performances for leading brands',
        cards: [
            {
                brand: 'Calapor', brandIcon: 'fas fa-building', title: 'Tarana',
                description: "Soulful vocal rendition for Calapor's brand campaign, blending melody and emotion.",
                tags: [{ icon: 'fas fa-tag', label: 'Brand Film' }, { icon: 'fas fa-music', label: 'Vocals' }],
                youtubeId: 'A27WX3WqRIY'
            },
            {
                brand: 'Judgementall Hai Kya', brandIcon: 'fas fa-film', title: 'Kis Raste Hai Jana',
                description: 'Evocative vocals for this Bollywood thriller soundtrack featuring Kangana Ranaut & Rajkummar Rao.',
                tags: [{ icon: 'fas fa-film', label: 'Bollywood' }, { icon: 'fas fa-microphone', label: 'Playback' }],
                youtubeId: 'JGMoTP38rio'
            },
            {
                brand: 'Saregama Carvaan', brandIcon: 'fas fa-compact-disc', title: 'Sa Re Ga Ma Carvaan',
                description: "Vocal performance for Saregama Carvaan's iconic ad campaign directed by Amit Sharma.",
                tags: [{ icon: 'fas fa-tv', label: 'TV Ad' }, { icon: 'fas fa-music', label: 'Jingle' }],
                youtubeId: 'JVe06h3ye9U'
            },
            {
                brand: 'MakeMyTrip', brandIcon: 'fas fa-plane', title: 'MakeMyTrip Ad',
                description: "Catchy jingle for MakeMyTrip's star-studded campaign featuring Ranveer Singh & Alia Bhatt.",
                tags: [{ icon: 'fas fa-tv', label: 'TV Ad' }, { icon: 'fas fa-star', label: 'Celebrity' }],
                youtubeId: '8y8vvSrIUqs'
            },
            {
                brand: 'Cadbury Dairy Milk', brandIcon: 'fas fa-candy-cane', title: 'Wedding TVC',
                description: "Heartwarming vocal track for Cadbury Dairy Milk's wedding-themed television commercial.",
                tags: [{ icon: 'fas fa-tv', label: 'TVC' }, { icon: 'fas fa-heart', label: 'Emotional' }],
                youtubeId: 'I-aKwqh3NHM'
            },
            {
                brand: 'Ninjacart', brandIcon: 'fas fa-seedling', title: '#BetterLives For Every Agri Citizen',
                description: "Inspirational vocals for Ninjacart's campaign celebrating India's agricultural community.",
                tags: [{ icon: 'fas fa-bullhorn', label: 'Campaign' }, { icon: 'fas fa-leaf', label: 'Social' }],
                youtubeId: 'CXjyevUcgMg'
            },
            {
                brand: 'Original', brandIcon: 'fas fa-music', title: 'Maawan Ni Maawan',
                description: 'A soulful collaboration with Arjuna Harjai \u2014 an emotional track celebrating motherhood.',
                tags: [{ icon: 'fas fa-microphone', label: 'Feature' }, { icon: 'fas fa-heart', label: 'Emotional' }],
                youtubeId: 'aH7YeoBJLNs'
            },
            {
                brand: 'Ambuja Cement', brandIcon: 'fas fa-building', title: 'Ambuja Cement Ad',
                description: "Vocal performance with lyrics by Gulzar for Ambuja Cement's inspiring brand campaign.",
                tags: [{ icon: 'fas fa-tv', label: 'TVC' }, { icon: 'fas fa-pen-fancy', label: 'Gulzar' }],
                youtubeId: 'O4bEbpI5EqI'
            },
            {
                brand: 'Dettol', brandIcon: 'fas fa-shield-alt', title: 'Dettol Dettol Ho',
                description: "Catchy jingle for Dettol's ad film \u2014 an instantly memorable hook that stays with you.",
                tags: [{ icon: 'fas fa-tv', label: 'Ad Film' }, { icon: 'fas fa-music', label: 'Jingle' }],
                youtubeId: '2L8T5YMc7t8'
            }
        ]
    });
    console.log('  [+] content/jingles.json');

    // ── Content: Reels ──
    await writeJSON(contentPath('reels'), {
        tag: '<i class="fab fa-instagram"></i> Trending Now',
        title: 'Viral <span class="highlight">Reels</span>',
        subtitle: 'Behind the scenes, covers, performances & creative moments',
        reels: [
            { video: 'videos/A jewel from Heeramandi \ud83d\udc96....This captivating thumri, with composition by Mr. Sanjay Leela Bhan.mp4',
              title: 'A jewel from Heeramandi \ud83d\udc96 This captivating thumri by Mr. Sanjay Leela Bhansali',
              likes: '12.5K', comments: '234', shares: '89',
              reelUrl: 'https://www.instagram.com/reel/DUNKA1_iMzr/' },
            { video: 'videos/Added to ASR Playlist. Link in bio \ud83d\udd17\u201CJism Ya Rooh\u201Din the mesmerising voice of @surabhidashputra.mp4',
              title: 'Added to ASR Playlist \ud83d\udd17 "Jism Ya Rooh" in the mesmerising voice of @surabhidashputra',
              likes: '8.2K', comments: '156', shares: '45',
              reelUrl: 'https://www.instagram.com/reel/DUIapO5CA3E/' },
            { video: "videos/Here\u2019s presenting a folk called \u2018Chaiti\u2019 which is typically sung during the month of Phaagun . T.mp4",
              title: "Here\u2019s presenting a folk called \u2018Chaiti\u2019 sung during the month of Phaagun",
              likes: '15.1K', comments: '312', shares: '128',
              reelUrl: 'https://www.instagram.com/reel/DTH_2T0iNHO/' },
            { video: 'videos/I absolutely loved all the songs of the series but \u201CNirmohiya,\u201D holds special place in my heart .mp4',
              title: 'I absolutely loved all the songs but \u201CNirmohiya\u201D holds a special place in my heart',
              likes: '9.8K', comments: '189', shares: '67',
              reelUrl: 'https://www.instagram.com/reel/DRRDE4NCKzI/' },
            { video: "videos/I began \u2018Ghazalish\u0915\u093C\u2019 with two deeply cherished ghazals, originally sung by my guru @sureshwadka.mp4",
              title: "I began \u2018Ghazalish\u0915\u093C\u2019 with two deeply cherished ghazals by my guru @sureshwadkar",
              likes: '11.3K', comments: '267', shares: '94',
              reelUrl: 'https://www.instagram.com/reel/DPtObGIiFId/' },
            { video: 'videos/I can hum this melody forever . Just loveee it! #hamriatriyameajaresaveriya.mp4',
              title: 'I can hum this melody forever. Just loveee it! #hamriatriyameajaresaveriya',
              likes: '7.6K', comments: '145', shares: '52',
              reelUrl: 'https://www.instagram.com/reel/DPWRRWlCO0T/' },
            { video: 'videos/Itni si baat pe roothe sajana\u2026. \u201CMore Sajan\u201D is now out on all platforms. Composed and produced.mp4',
              title: 'Itni si baat pe roothe sajana\u2026 \u201CMore Sajan\u201D is now out on all platforms',
              likes: '14.2K', comments: '298', shares: '156',
              reelUrl: 'https://www.instagram.com/reel/DPTBu_siBkK/' },
            { video: "videos/It\u2019s always a pleasure to sing & write lyrics for Arjuna\u2019s @arjunaharjai songs, given his meticu.mp4",
              title: "It\u2019s always a pleasure to sing & write lyrics for Arjuna\u2019s @arjunaharjai songs",
              likes: '10.5K', comments: '223', shares: '78',
              reelUrl: 'https://www.instagram.com/reel/DN7z2t0jEFD/' },
            { video: "videos/I\u2019ve been singing this ghazal since childhood, and even today, performing it fills me with joy. .mp4",
              title: "I\u2019ve been singing this ghazal since childhood, performing it fills me with joy",
              likes: '18.9K', comments: '456', shares: '234',
              reelUrl: 'https://www.instagram.com/reel/DNVlYoYMXfB/' },
            { video: 'videos/Music is a safe kind of high\u2764\uFE0F....On guitars @pranavatrey\ud83e\udd70#madanmohan #filmanpadh #aapkinazronn.mp4',
              title: 'Music is a safe kind of high \u2764\uFE0F On guitars @pranavatrey #madanmohan #aapkinazron',
              likes: '6.4K', comments: '134', shares: '41',
              reelUrl: 'https://www.instagram.com/reel/DNKhi-eMlUZ/' },
            { video: "videos/There\u2019s something so soothing about singing \u2018Abhi Na Jao\u2019 with @surabhidashputra \ud83c\udfb6 It felt like.mp4",
              title: "There\u2019s something so soothing about singing \u2018Abhi Na Jao\u2019 with @surabhidashputra \ud83c\udfb6",
              likes: '8.7K', comments: '178', shares: '63',
              reelUrl: 'https://www.instagram.com/reel/DM46SUtM-KC/' },
            { video: "videos/\u2018 Ghazalish\u0915\u093C\u2018 remains incomplete without the legendary \u2018Chupke Chupke Raat Din\u2019 echoing through.mp4",
              title: "\u2018Ghazalish\u0915\u093C\u2019 remains incomplete without the legendary \u2018Chupke Chupke Raat Din\u2019",
              likes: '13.1K', comments: '289', shares: '112',
              reelUrl: 'https://www.instagram.com/reel/DMXisAZSekc/' }
        ],
        channelName: '@surabhidashputra',
        channelTagline: 'Every Reel, A Vibe. Every Note, A Story.',
        stats: [
            { icon: 'fas fa-video', value: '50+', label: 'Reels' },
            { icon: 'fas fa-heart', value: '100K+', label: 'Likes' },
            { icon: 'fas fa-eye', value: '1M+', label: 'Views' }
        ],
        followUrl: 'https://www.instagram.com/surabhidashputra/reels/'
    });
    console.log('  [+] content/reels.json');

    // ── Content: Gallery ──
    await writeJSON(contentPath('gallery'), {
        tag: '<i class="fas fa-images"></i> Visual Stories',
        title: 'Photo <span class="highlight">Gallery</span>',
        subtitle: 'Moments captured on stage, in the studio & beyond',
        filterTabs: [
            { filter: 'all', label: 'All' },
            { filter: 'live', label: 'Live Events' },
            { filter: 'recordings', label: 'Recordings' }
        ],
        perPage: 8
    });
    console.log('  [+] content/gallery.json');

    // ── Content: Academy ──
    await writeJSON(contentPath('academy'), {
        tag: '<i class="fas fa-graduation-cap"></i> My Academy',
        title: 'ASM <span class="highlight">Institute</span>',
        academyName: 'Aesthetics Of Sound And Music',
        description: 'Welcome to my music academy! ASM Institute is where passion meets profession. Join us to learn from industry experts, master your craft, and transform your musical dreams into reality through personalized training programs.',
        features: [
            { icon: 'fas fa-microphone', label: 'Vocal Training' },
            { icon: 'fas fa-guitar', label: 'Instruments' },
            { icon: 'fas fa-sliders-h', label: 'Music Production' },
            { icon: 'fas fa-users', label: 'Expert Faculty' }
        ],
        ctaText: 'Explore Courses',
        academyUrl: 'https://www.asminstitute.com/',
        logoImage: 'images/logo/academy-logo.jpeg'
    });
    console.log('  [+] content/academy.json');

    // ── Content: Contact ──
    await writeJSON(contentPath('contact'), {
        tag: 'Connect',
        title: "Let's <span class=\"highlight\">Connect</span>",
        subtitle: 'Follow along for new music, behind-the-scenes content, and more.',
        socialCards: [
            { platform: 'Instagram', handle: '@surabhidashputra', url: 'https://www.instagram.com/surabhidashputra/', icon: 'fab fa-instagram', class: 's-insta' },
            { platform: 'YouTube', handle: '@surabhidashputra', url: 'https://www.youtube.com/@surabhidashputra', icon: 'fab fa-youtube', class: 's-yt' },
            { platform: 'Spotify', handle: 'Surabhi Dashputra', url: 'https://open.spotify.com/artist/5OAB0WGU0xp8UY2lihPD3F', icon: 'fab fa-spotify', class: 's-spot' }
        ],
        formHeading: 'Send a Message',
        formSubtitle: 'For collaborations, bookings, or just to say hello!',
        subjectOptions: [
            { value: '', label: 'Select a topic...' },
            { value: 'collaboration', label: 'Collaboration' },
            { value: 'booking', label: 'Event Booking' },
            { value: 'press', label: 'Press / Media Inquiry' },
            { value: 'fan', label: 'Fan Message' },
            { value: 'other', label: 'Other' }
        ],
        successMessage: 'Thank you! Your message has been sent.'
    });
    console.log('  [+] content/contact.json');

    // ── Content: Footer ──
    await writeJSON(contentPath('footer'), {
        description: 'Surabhi Dashputra \u2014 Singer, Content Creator & Musician',
        links: [
            { href: '#home', label: 'Home' },
            { href: '#about', label: 'About' },
            { href: '#music', label: 'Popular' },
            { href: '#films', label: 'Films & TV' },
            { href: '#news', label: 'News' },
            { href: '#youtube', label: 'YouTube' },
            { href: '#jingles', label: 'Ads & Jingles' },
            { href: '#reels', label: 'Reels' },
            { href: '#gallery', label: 'Photos' },
            { href: '#academy', label: 'Academy' },
            { href: '#contact', label: 'Connect' }
        ],
        copyright: '\u00a9 2026 Surabhi Dashputra. All rights reserved.'
    });
    console.log('  [+] content/footer.json');

    console.log('\nSeed complete! All data files created.');
    console.log('Default admin login: admin / admin123');
    console.log('Change the password after first login.\n');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
