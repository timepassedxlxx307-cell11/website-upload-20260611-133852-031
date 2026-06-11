document.addEventListener('DOMContentLoaded', function () {
    initMobileNavigation();
    initHeroCarousel();
    initFilters();
    initPlayer();
});

function initMobileNavigation() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-mobile-nav]');

    if (!toggle || !nav) {
        return;
    }

    toggle.addEventListener('click', function () {
        nav.classList.toggle('is-open');
    });
}

function initHeroCarousel() {
    var carousel = document.querySelector('[data-hero-carousel]');

    if (!carousel) {
        return;
    }

    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var thumbs = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-thumb]'));
    var current = 0;
    var timer = null;

    function showSlide(index) {
        current = (index + slides.length) % slides.length;

        slides.forEach(function (slide, slideIndex) {
            slide.classList.toggle('is-active', slideIndex === current);
        });

        thumbs.forEach(function (thumb, thumbIndex) {
            thumb.classList.toggle('is-active', thumbIndex === current);
        });
    }

    function startTimer() {
        stopTimer();
        timer = window.setInterval(function () {
            showSlide(current + 1);
        }, 5200);
    }

    function stopTimer() {
        if (timer) {
            window.clearInterval(timer);
        }
    }

    thumbs.forEach(function (thumb) {
        thumb.addEventListener('click', function () {
            var index = Number(thumb.getAttribute('data-hero-thumb')) || 0;
            showSlide(index);
            startTimer();
        });
    });

    carousel.addEventListener('mouseenter', stopTimer);
    carousel.addEventListener('mouseleave', startTimer);
    showSlide(0);
    startTimer();
}

function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));

    panels.forEach(function (panel) {
        var input = panel.querySelector('[data-filter-input]');
        var year = panel.querySelector('[data-filter-year]');
        var region = panel.querySelector('[data-filter-region]');
        var type = panel.querySelector('[data-filter-type]');
        var reset = panel.querySelector('[data-filter-reset]');
        var result = panel.querySelector('[data-filter-result]');
        var container = panel.parentElement;
        var cards = Array.prototype.slice.call(container.querySelectorAll('[data-movie-card]'));

        function applyQueryFromLocation() {
            if (!input) {
                return;
            }

            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');

            if (query) {
                input.value = query;
            }
        }

        function applyFilter() {
            var query = input ? input.value.trim().toLowerCase() : '';
            var selectedYear = year ? year.value : '';
            var selectedRegion = region ? region.value : '';
            var selectedType = type ? type.value : '';
            var visibleCount = 0;

            cards.forEach(function (card) {
                var text = card.getAttribute('data-search') || '';
                var cardYear = card.getAttribute('data-year') || '';
                var cardRegion = card.getAttribute('data-region') || '';
                var cardType = card.getAttribute('data-type') || '';
                var visible = true;

                if (query && text.indexOf(query) === -1) {
                    visible = false;
                }

                if (selectedYear && cardYear !== selectedYear) {
                    visible = false;
                }

                if (selectedRegion && cardRegion !== selectedRegion) {
                    visible = false;
                }

                if (selectedType && cardType !== selectedType) {
                    visible = false;
                }

                card.classList.toggle('is-hidden', !visible);

                if (visible) {
                    visibleCount += 1;
                }
            });

            if (result) {
                result.innerHTML = '当前显示 <strong>' + visibleCount + '</strong> 部影片';
            }
        }

        [input, year, region, type].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilter);
                control.addEventListener('change', applyFilter);
            }
        });

        if (reset) {
            reset.addEventListener('click', function () {
                if (input) {
                    input.value = '';
                }

                if (year) {
                    year.value = '';
                }

                if (region) {
                    region.value = '';
                }

                if (type) {
                    type.value = '';
                }

                applyFilter();
            });
        }

        applyQueryFromLocation();
        applyFilter();
    });
}

function initPlayer() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (shell) {
        var video = shell.querySelector('video');
        var button = shell.querySelector('[data-play-button]');
        var message = shell.querySelector('[data-player-message]');
        var source = shell.getAttribute('data-src');
        var hlsInstance = null;

        if (!video || !button || !source) {
            return;
        }

        function setMessage(text) {
            if (message) {
                message.textContent = text || '';
            }
        }

        function bindHlsSource() {
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                return Promise.resolve();
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });

                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);

                return new Promise(function (resolve) {
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        resolve();
                    });
                });
            }

            video.src = source;
            return Promise.resolve();
        }

        function playVideo() {
            shell.classList.add('is-playing');
            video.setAttribute('controls', 'controls');
            setMessage('正在加载播放源...');

            bindHlsSource()
                .then(function () {
                    return video.play();
                })
                .then(function () {
                    setMessage('');
                })
                .catch(function () {
                    shell.classList.remove('is-playing');
                    setMessage('当前浏览器阻止了自动播放，请再次点击播放按钮或切换支持 HLS 的浏览器。');
                });
        }

        button.addEventListener('click', playVideo, { once: true });

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
}
