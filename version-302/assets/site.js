(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function initMenu() {
        var toggle = document.querySelector(".mobile-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
            toggle.textContent = panel.classList.contains("is-open") ? "×" : "☰";
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
        var next = hero.querySelector(".hero-next");
        var prev = hero.querySelector(".hero-prev");
        var index = 0;
        var timer;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === index);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                var target = parseInt(dot.getAttribute("data-hero-target"), 10);
                show(target);
                restart();
            });
        });

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        restart();
    }

    function getText(card) {
        return [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-genre") || "",
            card.textContent || ""
        ].join(" ").toLowerCase();
    }

    function initFilters() {
        var grids = Array.prototype.slice.call(document.querySelectorAll(".filter-grid"));
        if (!grids.length) {
            return;
        }
        var searchInputs = Array.prototype.slice.call(document.querySelectorAll(".grid-search"));
        var sortSelects = Array.prototype.slice.call(document.querySelectorAll(".grid-sort"));
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";
        searchInputs.forEach(function (input) {
            if (input.name === "q" || input.classList.contains("main-search-input")) {
                input.value = initialQuery;
            }
        });

        function currentQuery() {
            var active = searchInputs.find(function (input) {
                return input.value.trim().length > 0;
            });
            return active ? active.value.trim().toLowerCase() : "";
        }

        function currentSort() {
            var select = sortSelects.find(function (item) {
                return item.value;
            });
            return select ? select.value : "default";
        }

        function apply() {
            var query = currentQuery();
            var sort = currentSort();
            grids.forEach(function (grid) {
                var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
                cards.forEach(function (card) {
                    var matched = !query || getText(card).indexOf(query) !== -1;
                    card.hidden = !matched;
                });
                if (sort !== "default") {
                    cards.sort(function (a, b) {
                        var av = Number(a.getAttribute("data-" + sort)) || 0;
                        var bv = Number(b.getAttribute("data-" + sort)) || 0;
                        return bv - av;
                    }).forEach(function (card) {
                        grid.appendChild(card);
                    });
                }
                var visible = cards.some(function (card) {
                    return !card.hidden;
                });
                var empty = grid.parentElement.querySelector(".empty-state");
                if (empty) {
                    empty.hidden = visible;
                }
            });
        }

        searchInputs.forEach(function (input) {
            input.addEventListener("input", apply);
        });
        sortSelects.forEach(function (select) {
            select.addEventListener("change", apply);
        });
        apply();
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var cover = player.querySelector(".player-cover");
            var error = player.querySelector(".player-error");
            if (!video || !cover) {
                return;
            }
            var url = video.getAttribute("data-video-url");
            var hlsInstance = null;
            var loading = false;

            function fail() {
                loading = false;
                if (error) {
                    error.hidden = false;
                }
            }

            function beginPlayback() {
                video.controls = true;
                cover.classList.add("is-hidden");
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        cover.classList.remove("is-hidden");
                    });
                }
            }

            function attachAndPlay() {
                if (!url || loading) {
                    return;
                }
                if (video.getAttribute("data-ready") === "1") {
                    beginPlayback();
                    return;
                }
                loading = true;
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        maxBufferLength: 30,
                        backBufferLength: 30,
                        enableWorker: true
                    });
                    hlsInstance.loadSource(url);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        loading = false;
                        video.setAttribute("data-ready", "1");
                        beginPlayback();
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
                        if (data && data.fatal) {
                            fail();
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = url;
                    video.setAttribute("data-ready", "1");
                    video.addEventListener("loadedmetadata", function () {
                        loading = false;
                        beginPlayback();
                    }, { once: true });
                    video.addEventListener("error", fail, { once: true });
                } else {
                    video.src = url;
                    video.setAttribute("data-ready", "1");
                    video.addEventListener("loadedmetadata", function () {
                        loading = false;
                        beginPlayback();
                    }, { once: true });
                    video.addEventListener("error", fail, { once: true });
                }
            }

            cover.addEventListener("click", attachAndPlay);
            player.addEventListener("click", function (event) {
                if (event.target === video && video.getAttribute("data-ready") !== "1") {
                    attachAndPlay();
                }
            });
            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initFilters();
        initPlayers();
    });
})();
