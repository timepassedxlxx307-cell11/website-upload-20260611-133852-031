(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var menuButton = document.querySelector("[data-mobile-menu-button]");
        var nav = document.querySelector("[data-site-nav]");

        if (menuButton && nav) {
            menuButton.addEventListener("click", function () {
                nav.classList.toggle("open");
            });
        }

        initHeroCarousel();
        initMovieLists();
        applySearchQuery();
    });

    function initHeroCarousel() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }

        var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
        var prev = carousel.querySelector("[data-hero-prev]");
        var next = carousel.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === index);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5500);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        carousel.addEventListener("mouseenter", stop);
        carousel.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initMovieLists() {
        var sections = Array.prototype.slice.call(document.querySelectorAll(".list-section"));

        sections.forEach(function (section) {
            var list = section.querySelector("[data-movie-list]");
            var input = section.querySelector(".movie-search-input");
            var buttons = Array.prototype.slice.call(section.querySelectorAll(".filter-button"));
            var count = section.querySelector(".result-count");
            var empty = section.querySelector("[data-empty-state]");
            var sortSelect = section.querySelector("[data-sort-select]");
            var currentFilter = "all";

            if (!list) {
                return;
            }

            var cards = Array.prototype.slice.call(list.children);
            var originalCards = cards.slice();

            function normalize(value) {
                return String(value || "").toLowerCase().trim();
            }

            function cardMatchesFilter(card) {
                if (currentFilter === "all") {
                    return true;
                }

                var kind = card.getAttribute("data-kind") || "";
                var search = card.getAttribute("data-search") || "";
                return kind.indexOf(currentFilter) !== -1 || search.indexOf(currentFilter) !== -1;
            }

            function applySort() {
                var mode = sortSelect ? sortSelect.value : "default";
                var sorted = originalCards.slice();

                if (mode === "year-desc") {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
                    });
                }

                if (mode === "heat-desc") {
                    sorted.sort(function (a, b) {
                        return Number(b.getAttribute("data-heat") || 0) - Number(a.getAttribute("data-heat") || 0);
                    });
                }

                if (mode === "title-asc") {
                    sorted.sort(function (a, b) {
                        var aTitle = normalize(a.getAttribute("data-search")).charAt(0);
                        var bTitle = normalize(b.getAttribute("data-search")).charAt(0);
                        return aTitle.localeCompare(bTitle, "zh-Hans-CN");
                    });
                }

                sorted.forEach(function (card) {
                    list.appendChild(card);
                });

                cards = Array.prototype.slice.call(list.children);
            }

            function applyFilters() {
                var query = normalize(input ? input.value : "");
                var visible = 0;

                cards.forEach(function (card) {
                    var search = normalize(card.getAttribute("data-search"));
                    var matched = (!query || search.indexOf(query) !== -1) && cardMatchesFilter(card);
                    card.style.display = matched ? "" : "none";

                    if (matched) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = "当前显示 " + visible + " 部作品";
                }

                if (empty) {
                    empty.classList.toggle("show", visible === 0);
                }
            }

            if (input) {
                input.addEventListener("input", applyFilters);
            }

            buttons.forEach(function (button) {
                button.addEventListener("click", function () {
                    buttons.forEach(function (item) {
                        item.classList.remove("active");
                    });

                    button.classList.add("active");
                    currentFilter = button.getAttribute("data-filter") || "all";
                    applyFilters();
                });
            });

            if (sortSelect) {
                sortSelect.addEventListener("change", function () {
                    applySort();
                    applyFilters();
                });
            }

            applySort();
            applyFilters();
        });
    }

    function applySearchQuery() {
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");

        if (!query) {
            return;
        }

        var input = document.querySelector(".movie-search-input");
        if (input) {
            input.value = query;
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    }

    window.initMoviePlayer = function (videoId, overlayId, sourceUrl) {
        var video = document.getElementById(videoId);
        var overlay = document.getElementById(overlayId);
        var hlsInstance = null;
        var isBound = false;

        if (!video || !sourceUrl) {
            return;
        }

        function bindVideo() {
            if (isBound) {
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = sourceUrl;
                isBound = true;
                return;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
                isBound = true;
                return;
            }

            video.src = sourceUrl;
            isBound = true;
        }

        function startPlayback() {
            bindVideo();

            if (overlay) {
                overlay.classList.add("hidden");
            }

            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        if (overlay) {
            overlay.addEventListener("click", startPlayback);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                startPlayback();
            }
        });

        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("hidden");
            }
        });

        window.addEventListener("pagehide", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
                hlsInstance = null;
            }
        });
    };
})();
