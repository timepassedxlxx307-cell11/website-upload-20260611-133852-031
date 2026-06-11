(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function bindMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      toggle.textContent = panel.classList.contains("is-open") ? "×" : "☰";
    });
  }

  function bindHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var prev = slider.querySelector("[data-hero-prev]");
    var next = slider.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

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

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function bindFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var section = panel.closest("section") || document;
      var input = panel.querySelector("[data-filter-input]");
      var yearSelect = panel.querySelector("[data-year-filter]");
      var typeSelect = panel.querySelector("[data-type-filter]");
      var regionSelect = panel.querySelector("[data-region-filter]");
      var cards = Array.prototype.slice.call(section.querySelectorAll("[data-movie-card]"));
      var empty = section.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var year = yearSelect ? yearSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        var region = regionSelect ? regionSelect.value : "";
        var visible = 0;

        cards.forEach(function (card) {
          var search = (card.getAttribute("data-search") || "").toLowerCase();
          var cardYear = card.getAttribute("data-year") || "";
          var cardType = card.getAttribute("data-type") || "";
          var cardRegion = card.getAttribute("data-region") || "";
          var matched = true;

          if (keyword && search.indexOf(keyword) === -1) {
            matched = false;
          }
          if (year && cardYear !== year) {
            matched = false;
          }
          if (type && cardType !== type) {
            matched = false;
          }
          if (region && cardRegion !== region) {
            matched = false;
          }

          card.style.display = matched ? "" : "none";
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      [input, yearSelect, typeSelect, regionSelect].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      apply();
    });
  }

  function bindImages() {
    var images = Array.prototype.slice.call(document.querySelectorAll("[data-cover-image]"));
    images.forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("is-empty");
        image.removeAttribute("src");
      }, { once: true });
    });
  }

  function bindPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
    players.forEach(function (shell) {
      var video = shell.querySelector("video[data-stream]");
      var button = shell.querySelector(".player-button");
      if (!video || !button) {
        return;
      }
      var source = video.getAttribute("data-stream");
      var loaded = false;
      var hlsInstance = null;

      function load() {
        if (loaded || !source) {
          return;
        }
        loaded = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({ enableWorker: true });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
        } else {
          video.src = source;
        }
      }

      function play() {
        load();
        var started = video.play();
        if (started && typeof started.then === "function") {
          started.then(function () {
            shell.classList.add("is-playing");
          }).catch(function () {
            shell.classList.remove("is-playing");
          });
        } else {
          shell.classList.add("is-playing");
        }
      }

      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        play();
      });

      shell.addEventListener("click", function (event) {
        if (event.target === video) {
          load();
          return;
        }
        if (!shell.classList.contains("is-playing")) {
          play();
        }
      });

      video.addEventListener("play", function () {
        shell.classList.add("is-playing");
      });

      video.addEventListener("pause", function () {
        shell.classList.remove("is-playing");
      });

      video.addEventListener("ended", function () {
        shell.classList.remove("is-playing");
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    bindMobileMenu();
    bindHero();
    bindFilters();
    bindImages();
    bindPlayers();
  });
})();
