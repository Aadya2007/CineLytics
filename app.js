/**
 * CineLytics - Main Application Logic
 * Premium Movie Insights Dashboard
 */

(function() {
    'use strict';

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const state = {
        currentPage: 'home',
        activeGenre: null,
        activeService: null,
        searchQuery: '',
        isDarkMode: true,
        filteredMovies: [...MOVIES_DATA],
        heroIndex: 0
    };

    // ==========================================
    // DOM REFERENCES
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        renderServices();
        renderGenres();
        renderHome();
        renderDiscoverFilters();
        bindNavigation();
        bindSearch();
        bindTopBarTabs();
        bindThemeToggle();
        bindModal();
        startHeroRotation();
        animateOnScroll();
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    function bindNavigation() {
        $$('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                navigateTo(page);
            });
        });
    }

    function navigateTo(page) {
        // Update nav active state
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = $(`.nav-item[data-page="${page}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Hide all pages, show target
        $$('.page').forEach(p => p.classList.remove('active'));
        const targetPage = $(`#page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
            state.currentPage = page;
        }

        // Render page-specific content
        switch(page) {
            case 'home':
                renderHome();
                break;
            case 'discover':
                renderDiscover();
                break;
            case 'community':
                renderCommunity();
                break;
            case 'top-rated':
                renderTopRatedPage();
                break;
        }

        // Scroll to top
        $('#main-content').scrollTop = 0;
    }

    // ==========================================
    // HOME PAGE
    // ==========================================
    function renderHome() {
        renderHero();
        renderContinueWatching();
        renderTopRated();
        renderTrending();
    }

    function renderHero() {
        const heroMovies = MOVIES_DATA.filter(m => m.topRated);
        const movie = heroMovies[state.heroIndex % heroMovies.length];
        
        const backdrop = $('#hero-backdrop');
        backdrop.style.backgroundImage = `url(${movie.backdrop})`;
        
        $('#hero-title').textContent = movie.title;
        const metaEl = $('#hero-meta');
        metaEl.innerHTML = `
            <span class="hero-year">${movie.year}</span>
            <span class="hero-separator">·</span>
            <span class="hero-genres">${movie.genres.join('/')}</span>
        `;

        // Animate in
        const heroContent = $('.hero-content');
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        requestAnimationFrame(() => {
            heroContent.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        });

        // Bind watch button
        $('#hero-watch-btn').onclick = () => openModal(movie);
    }

    function startHeroRotation() {
        setInterval(() => {
            state.heroIndex++;
            renderHero();
        }, 8000);
    }

    function renderContinueWatching() {
        const movies = getFilteredMovies().filter(m => m.continueWatching);
        const container = $('#continue-row');
        container.innerHTML = '';

        if (movies.length === 0) {
            container.innerHTML = '<p class="empty-state">No movies in progress</p>';
            return;
        }

        movies.forEach((movie, i) => {
            const card = createContinueCard(movie, i);
            container.appendChild(card);
        });
    }

    function createContinueCard(movie, index) {
        const card = document.createElement('div');
        card.className = 'continue-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.innerHTML = `
            <div class="continue-card-image">
                <img src="${movie.backdrop}" alt="${movie.title}" loading="lazy">
                <div class="continue-card-overlay">
                    <button class="play-btn-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
                <div class="continue-card-info">
                    <span class="continue-card-title">${movie.title}</span>
                    <span class="continue-card-year">${movie.year}</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${movie.progress}%"></div>
            </div>
        `;
        card.addEventListener('click', () => openModal(movie));
        return card;
    }

    function renderTopRated() {
        const movies = getFilteredMovies().filter(m => m.topRated);
        const container = $('#top-rated-row');
        container.innerHTML = '';

        movies.forEach((movie, i) => {
            const card = createMovieCard(movie, i);
            container.appendChild(card);
        });
    }

    function renderTrending() {
        const movies = getFilteredMovies().filter(m => m.trending);
        const container = $('#trending-row');
        container.innerHTML = '';

        movies.forEach((movie, i) => {
            const card = createMovieCard(movie, i);
            container.appendChild(card);
        });
    }

    function createMovieCard(movie, index) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.animationDelay = `${index * 0.08}s`;
        card.innerHTML = `
            <div class="movie-card-poster">
                <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
                <div class="rating-badge">
                    <svg viewBox="0 0 24 24" fill="#f5c518" width="10" height="10"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>${movie.rating}</span>
                </div>
                <div class="movie-card-overlay">
                    <button class="play-btn-small">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
            </div>
            <div class="movie-card-info">
                <h4 class="movie-card-title">${movie.title}</h4>
                <span class="movie-card-year">${movie.year}</span>
            </div>
            <div class="movie-card-actions">
                <button class="btn-primary btn-sm">Watch Now</button>
                <button class="btn-circle btn-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
        `;
        card.addEventListener('click', () => openModal(movie));
        return card;
    }

    // ==========================================
    // DISCOVER PAGE
    // ==========================================
    function renderDiscoverFilters() {
        const container = $('#discover-filters');
        container.innerHTML = '<button class="filter-pill active" data-filter="all">All</button>';
        
        GENRES.forEach(genre => {
            const pill = document.createElement('button');
            pill.className = 'filter-pill';
            pill.dataset.filter = genre;
            pill.textContent = genre;
            container.appendChild(pill);
        });

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-pill')) {
                $$('.filter-pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                const filter = e.target.dataset.filter;
                state.activeGenre = filter === 'all' ? null : filter;
                renderDiscover();
            }
        });
    }

    function renderDiscover() {
        let movies = getFilteredMovies();
        if (state.activeGenre) {
            movies = movies.filter(m => m.genres.includes(state.activeGenre));
        }

        const container = $('#discover-grid');
        container.innerHTML = '';

        if (movies.length === 0) {
            container.innerHTML = '<p class="empty-state">No movies found matching your criteria</p>';
            return;
        }

        movies.forEach((movie, i) => {
            const card = createMovieCard(movie, i);
            container.appendChild(card);
        });
    }

    // ==========================================
    // COMMUNITY PAGE (ANALYTICS)
    // ==========================================
    function renderCommunity() {
        const movies = getFilteredMovies();
        
        // KPI Stats
        animateCounter('stat-total-movies', movies.length);
        animateCounter('stat-avg-rating', (movies.reduce((s, m) => s + m.rating, 0) / movies.length).toFixed(1));
        animateCounter('stat-avg-runtime', Math.round(movies.reduce((s, m) => s + m.runtime, 0) / movies.length) + ' min');
        animateCounter('stat-total-revenue', '$' + (movies.reduce((s, m) => s + m.revenue, 0) / 1000).toFixed(1) + 'B');

        // Charts
        renderRatingChart(movies);
        renderGenreChart(movies);
        renderScatterChart(movies);
        renderYearChart(movies);
    }

    function animateCounter(id, targetValue) {
        const el = document.getElementById(id);
        if (!el) return;
        
        const isString = typeof targetValue === 'string';
        if (isString) {
            el.textContent = targetValue;
            return;
        }

        let current = 0;
        const increment = targetValue / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }
            el.textContent = Number.isInteger(targetValue) ? Math.round(current) : current.toFixed(1);
        }, 30);
    }

    // ==========================================
    // CHART RENDERING (Canvas-based)
    // ==========================================
    function renderRatingChart(movies) {
        const canvas = document.getElementById('chart-ratings');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);

        // Create rating buckets
        const buckets = {};
        for (let r = 6; r <= 9; r += 0.5) {
            buckets[r.toFixed(1)] = 0;
        }
        movies.forEach(m => {
            const bucket = (Math.round(m.rating * 2) / 2).toFixed(1);
            if (buckets[bucket] !== undefined) buckets[bucket]++;
        });

        const labels = Object.keys(buckets);
        const values = Object.values(buckets);
        const maxVal = Math.max(...values, 1);

        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;
        const barW = chartW / labels.length * 0.7;
        const gap = chartW / labels.length * 0.3;

        // Draw bars
        values.forEach((val, i) => {
            const barH = (val / maxVal) * chartH;
            const x = padding.left + i * (barW + gap) + gap / 2;
            const y = padding.top + chartH - barH;

            const gradient = ctx.createLinearGradient(x, y, x, y + barH);
            gradient.addColorStop(0, '#e50914');
            gradient.addColorStop(1, '#8b0000');
            ctx.fillStyle = gradient;
            roundedRect(ctx, x, y, barW, barH, 4);

            // Label
            ctx.fillStyle = '#8b8b8b';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW / 2, h - 10);

            // Value on top
            if (val > 0) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '11px Inter, sans-serif';
                ctx.fillText(val, x + barW / 2, y - 5);
            }
        });
    }

    function renderGenreChart(movies) {
        const canvas = document.getElementById('chart-genres');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);

        // Count genres
        const genreCounts = {};
        movies.forEach(m => {
            m.genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        });

        const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const total = sorted.reduce((s, [, v]) => s + v, 0);
        const colors = ['#e50914', '#ff4444', '#ff6b6b', '#f5c518', '#00b4d8', '#7209b7', '#06d6a0', '#118ab2'];

        // Draw donut chart
        const cx = w * 0.35;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - 20;
        const innerRadius = radius * 0.55;
        let startAngle = -Math.PI / 2;

        sorted.forEach(([genre, count], i) => {
            const sliceAngle = (count / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.arc(cx, cy, innerRadius, startAngle + sliceAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            startAngle += sliceAngle;
        });

        // Center text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total, cx, cy - 8);
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#8b8b8b';
        ctx.fillText('Total', cx, cy + 12);

        // Legend
        const legendX = w * 0.65;
        let legendY = 30;
        sorted.forEach(([genre, count], i) => {
            ctx.fillStyle = colors[i % colors.length];
            roundedRect(ctx, legendX, legendY, 12, 12, 3);

            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${genre} (${count})`, legendX + 20, legendY + 6);
            legendY += 28;
        });
    }

    function renderScatterChart(movies) {
        const canvas = document.getElementById('chart-scatter');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);

        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const maxRevenue = Math.max(...movies.map(m => m.revenue), 100);
        const minRating = Math.min(...movies.map(m => m.rating));
        const maxRating = Math.max(...movies.map(m => m.rating));

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        // Axis labels
        ctx.fillStyle = '#8b8b8b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Rating →', w / 2, h - 5);
        ctx.save();
        ctx.translate(12, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Revenue ($M) →', 0, 0);
        ctx.restore();

        // Draw dots
        movies.forEach(movie => {
            const x = padding.left + ((movie.rating - minRating) / (maxRating - minRating)) * chartW;
            const y = padding.top + chartH - (movie.revenue / maxRevenue) * chartH;

            // Glow
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
            glow.addColorStop(0, 'rgba(229, 9, 20, 0.4)');
            glow.addColorStop(1, 'rgba(229, 9, 20, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Dot
            ctx.fillStyle = '#e50914';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#e50914';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    function renderYearChart(movies) {
        const canvas = document.getElementById('chart-years');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;

        ctx.clearRect(0, 0, w, h);

        // Count by decade
        const decades = {};
        movies.forEach(m => {
            const decade = Math.floor(m.year / 10) * 10 + 's';
            decades[decade] = (decades[decade] || 0) + 1;
        });

        const labels = Object.keys(decades).sort();
        const values = labels.map(l => decades[l]);
        const maxVal = Math.max(...values, 1);

        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#e50914';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const points = [];
        labels.forEach((label, i) => {
            const x = padding.left + (i / (labels.length - 1 || 1)) * chartW;
            const y = padding.top + chartH - (values[i] / maxVal) * chartH;
            points.push({ x, y });
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill area
        ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
        ctx.lineTo(points[0].x, padding.top + chartH);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        areaGrad.addColorStop(0, 'rgba(229, 9, 20, 0.3)');
        areaGrad.addColorStop(1, 'rgba(229, 9, 20, 0)');
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Draw dots and labels
        points.forEach((p, i) => {
            ctx.fillStyle = '#e50914';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Value
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(values[i], p.x, p.y - 12);

            // Label
            ctx.fillStyle = '#8b8b8b';
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(labels[i], p.x, h - 10);
        });
    }

    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    // ==========================================
    // TOP RATED PAGE
    // ==========================================
    function renderTopRatedPage() {
        const movies = [...getFilteredMovies()].sort((a, b) => b.rating - a.rating);
        const container = $('#top-rated-grid');
        container.innerHTML = '';

        movies.forEach((movie, i) => {
            const card = createMovieCard(movie, i);
            container.appendChild(card);
        });
    }

    // ==========================================
    // RIGHT PANEL
    // ==========================================
    function renderServices() {
        const container = $('#services-list');
        container.innerHTML = '';

        MEDIA_SERVICES.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.innerHTML = `
                <span class="service-icon">${service.icon}</span>
                <span class="service-name">${service.name}</span>
            `;
            item.addEventListener('click', () => {
                $$('.service-item').forEach(s => s.classList.remove('active'));
                if (state.activeService === service.name) {
                    state.activeService = null;
                } else {
                    item.classList.add('active');
                    state.activeService = service.name;
                }
                refreshCurrentPage();
            });
            container.appendChild(item);
        });
    }

    function renderGenres() {
        const container = $('#genres-list');
        container.innerHTML = '';

        GENRES.forEach((genre, i) => {
            const tag = document.createElement('button');
            tag.className = 'genre-tag' + (i === 0 ? ' active' : '');
            tag.textContent = genre;
            tag.addEventListener('click', () => {
                $$('.genre-tag').forEach(t => t.classList.remove('active'));
                if (state.activeGenre === genre) {
                    state.activeGenre = null;
                } else {
                    tag.classList.add('active');
                    state.activeGenre = genre;
                }
                refreshCurrentPage();
            });
            container.appendChild(tag);
        });
    }

    // ==========================================
    // FILTERING
    // ==========================================
    function getFilteredMovies() {
        let movies = [...MOVIES_DATA];

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            movies = movies.filter(m =>
                m.title.toLowerCase().includes(q) ||
                m.director.toLowerCase().includes(q) ||
                m.cast.some(c => c.toLowerCase().includes(q)) ||
                m.genres.some(g => g.toLowerCase().includes(q))
            );
        }

        if (state.activeGenre) {
            movies = movies.filter(m => m.genres.includes(state.activeGenre));
        }

        if (state.activeService) {
            movies = movies.filter(m => m.mediaService === state.activeService);
        }

        return movies;
    }

    function refreshCurrentPage() {
        switch(state.currentPage) {
            case 'home': renderHome(); break;
            case 'discover': renderDiscover(); break;
            case 'community': renderCommunity(); break;
            case 'top-rated': renderTopRatedPage(); break;
        }
    }

    // ==========================================
    // SEARCH
    // ==========================================
    function bindSearch() {
        const input = $('#search-input');
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.searchQuery = input.value.trim();
                refreshCurrentPage();
            }, 300);
        });
    }

    // ==========================================
    // TOP BAR TABS
    // ==========================================
    function bindTopBarTabs() {
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // ==========================================
    // THEME TOGGLE
    // ==========================================
    function bindThemeToggle() {
        const checkbox = $('#theme-checkbox');
        checkbox.addEventListener('change', () => {
            state.isDarkMode = checkbox.checked;
            document.body.classList.toggle('light-theme', !state.isDarkMode);
        });
    }

    // ==========================================
    // MOVIE MODAL
    // ==========================================
    function bindModal() {
        $('#modal-close').addEventListener('click', closeModal);
        $('#movie-modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function openModal(movie) {
        const overlay = $('#movie-modal-overlay');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        $('#modal-backdrop').style.backgroundImage = `url(${movie.backdrop})`;
        $('#modal-poster-img').src = movie.poster;
        $('#modal-poster-img').alt = movie.title;
        $('#modal-title').textContent = movie.title;
        $('#modal-year').textContent = movie.year;
        $('#modal-runtime').textContent = `${movie.runtime} min`;
        $('#modal-certificate').textContent = movie.certificate;
        $('#modal-rating-value').textContent = movie.rating;
        $('#modal-votes').textContent = `${(movie.votes / 1000).toFixed(0)}K votes`;
        $('#modal-overview').textContent = movie.overview;
        $('#modal-director').textContent = movie.director;
        $('#modal-cast').textContent = movie.cast.join(', ');

        const genresContainer = $('#modal-genres');
        genresContainer.innerHTML = '';
        movie.genres.forEach(g => {
            const pill = document.createElement('span');
            pill.className = 'genre-pill';
            pill.textContent = g;
            genresContainer.appendChild(pill);
        });

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    function closeModal() {
        const overlay = $('#movie-modal-overlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==========================================
    // SCROLL ANIMATIONS
    // ==========================================
    function animateOnScroll() {
        const mainContent = $('#main-content');
        if (!mainContent) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            root: mainContent,
            threshold: 0.1
        });

        // Observe sections
        $$('.content-section').forEach(section => {
            observer.observe(section);
        });
    }

    // ==========================================
    // BOOT
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
