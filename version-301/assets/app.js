(function () {
    var header = document.querySelector('[data-header]');
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    function updateHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 18) {
            header.classList.add('is-scrolled');
        } else {
            header.classList.remove('is-scrolled');
        }
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var previous = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var activeSlide = 0;
    var timer = null;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        activeSlide = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === activeSlide);
        });
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('is-active', dotIndex === activeSlide);
        });
    }

    function queueSlide() {
        if (timer) {
            window.clearInterval(timer);
        }
        if (slides.length > 1) {
            timer = window.setInterval(function () {
                showSlide(activeSlide + 1);
            }, 5200);
        }
    }

    if (slides.length) {
        showSlide(0);
        queueSlide();
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
                queueSlide();
            });
        });
        if (previous) {
            previous.addEventListener('click', function () {
                showSlide(activeSlide - 1);
                queueSlide();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                showSlide(activeSlide + 1);
                queueSlide();
            });
        }
    }

    var panel = document.querySelector('[data-filter-panel]');
    if (panel) {
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        var input = panel.querySelector('[data-search-input]');
        var buttons = Array.prototype.slice.call(panel.querySelectorAll('[data-filter-button]'));
        var noResults = document.querySelector('[data-no-results]');
        var state = {
            region: 'all',
            type: 'all',
            year: 'all'
        };

        function normalize(value) {
            return String(value || '').trim().toLowerCase();
        }

        function applyFilters() {
            var query = normalize(input ? input.value : '');
            var visible = 0;
            cards.forEach(function (card) {
                var title = normalize(card.getAttribute('data-title'));
                var region = normalize(card.getAttribute('data-region'));
                var type = normalize(card.getAttribute('data-type'));
                var year = normalize(card.getAttribute('data-year'));
                var genre = normalize(card.getAttribute('data-genre'));
                var tags = normalize(card.getAttribute('data-tags'));
                var text = [title, region, type, year, genre, tags].join(' ');
                var matchQuery = !query || text.indexOf(query) !== -1;
                var matchRegion = state.region === 'all' || region === normalize(state.region);
                var matchType = state.type === 'all' || type === normalize(state.type);
                var matchYear = state.year === 'all' || year === normalize(state.year);
                var matched = matchQuery && matchRegion && matchType && matchYear;
                card.style.display = matched ? '' : 'none';
                if (matched) {
                    visible += 1;
                }
            });
            if (noResults) {
                noResults.classList.toggle('is-visible', visible === 0);
            }
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                var region = button.getAttribute('data-filter-region');
                var type = button.getAttribute('data-filter-type');
                var year = button.getAttribute('data-filter-year');
                if (region !== null) {
                    state.region = region;
                    buttons.filter(function (item) {
                        return item.getAttribute('data-filter-region') !== null;
                    }).forEach(function (item) {
                        item.classList.toggle('is-active', item === button);
                    });
                }
                if (type !== null) {
                    state.type = type;
                    buttons.filter(function (item) {
                        return item.getAttribute('data-filter-type') !== null;
                    }).forEach(function (item) {
                        item.classList.toggle('is-active', item === button);
                    });
                }
                if (year !== null) {
                    state.year = year;
                    buttons.filter(function (item) {
                        return item.getAttribute('data-filter-year') !== null;
                    }).forEach(function (item) {
                        item.classList.toggle('is-active', item === button);
                    });
                }
                applyFilters();
            });
        });

        if (input) {
            input.addEventListener('input', applyFilters);
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query) {
                input.value = query;
            }
        }

        applyFilters();
    }

    window.startMoviePlayer = function (videoId, coverId, url) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        var loaded = false;
        var hls = null;

        if (!video) {
            return;
        }

        function attach() {
            if (loaded) {
                return;
            }
            loaded = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }
        }

        function play() {
            attach();
            if (cover) {
                cover.classList.add('is-hidden');
            }
            video.setAttribute('controls', 'controls');
            var request = video.play();
            if (request && typeof request.catch === 'function') {
                request.catch(function () {});
            }
        }

        if (cover) {
            cover.addEventListener('click', play);
        }
        video.addEventListener('click', function () {
            if (!loaded) {
                play();
            }
        });
        window.addEventListener('beforeunload', function () {
            if (hls && typeof hls.destroy === 'function') {
                hls.destroy();
            }
        });
    };
}());
