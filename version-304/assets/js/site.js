(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var links = document.querySelector("[data-nav-links]");
    if (!toggle || !links) {
      return;
    }
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
  }

  function initHero() {
    var track = document.querySelector("[data-hero-track]");
    if (!track) {
      return;
    }
    var slides = Array.prototype.slice.call(track.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var previous = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    var current = 0;

    function render() {
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (dot, index) {
        dot.classList.toggle("active", index === current);
      });
    }

    function move(step) {
      current = (current + step + slides.length) % slides.length;
      render();
    }

    if (previous) {
      previous.addEventListener("click", function () {
        move(-1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        move(1);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        current = index;
        render();
      });
    });
    if (slides.length > 1) {
      window.setInterval(function () {
        move(1);
      }, 6200);
    }
    render();
  }

  function initFilters() {
    var input = document.querySelector("[data-filter-input]");
    var yearSelect = document.querySelector("[data-filter-year]");
    var regionSelect = document.querySelector("[data-filter-region]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
    var empty = document.querySelector("[data-empty]");
    if (!cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var queryValue = params.get("q") || "";
    var yearValue = params.get("year") || "";
    if (input && queryValue) {
      input.value = queryValue;
    }
    if (yearSelect && yearValue) {
      yearSelect.value = yearValue;
    }

    function apply() {
      var query = normalize(input && input.value);
      var year = normalize(yearSelect && yearSelect.value);
      var region = normalize(regionSelect && regionSelect.value);
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        var cardYear = normalize(card.getAttribute("data-year"));
        var cardRegion = normalize(card.getAttribute("data-region"));
        var matched = true;
        if (query && text.indexOf(query) === -1) {
          matched = false;
        }
        if (year && cardYear !== year) {
          matched = false;
        }
        if (region && cardRegion.indexOf(region) === -1) {
          matched = false;
        }
        card.style.display = matched ? "" : "none";
        if (matched) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle("show", visible === 0);
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
    if (regionSelect) {
      regionSelect.addEventListener("change", apply);
    }
    apply();
  }

  function initHomeSearch() {
    var form = document.querySelector("[data-home-search]");
    if (!form) {
      return;
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector("input");
      var value = input ? input.value.trim() : "";
      var target = form.getAttribute("action") || "catalog.html";
      window.location.href = value ? target + "?q=" + encodeURIComponent(value) : target;
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var button = player.querySelector("[data-play-button]");
      var src = player.getAttribute("data-video");
      var loaded = false;
      var hlsInstance = null;

      function start() {
        if (!video || !src) {
          return;
        }
        if (!loaded) {
          loaded = true;
          player.classList.add("is-loading");
          if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ maxBufferLength: 36 });
            hlsInstance.loadSource(src);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
            video.play().catch(function () {});
          } else {
            video.src = src;
            video.play().catch(function () {});
          }
        } else {
          video.play().catch(function () {});
        }
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", start);
        video.addEventListener("play", function () {
          player.classList.add("is-playing");
        });
        video.addEventListener("pause", function () {
          player.classList.remove("is-playing");
        });
        video.addEventListener("ended", function () {
          player.classList.remove("is-playing");
        });
      }
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
    initHomeSearch();
    initPlayers();
  });
})();
