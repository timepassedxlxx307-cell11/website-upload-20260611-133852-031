(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) return;
    var active = 0;
    var timer = null;
    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === active);
      });
    }
    function play() {
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        if (timer) window.clearInterval(timer);
        show(i);
        play();
      });
    });
    hero.addEventListener("mouseenter", function () {
      if (timer) window.clearInterval(timer);
    });
    hero.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function setupGlobalSearch() {
    var input = document.querySelector("[data-global-search]");
    var box = document.querySelector("[data-search-results]");
    var index = window.SITE_SEARCH_INDEX || [];
    if (!input || !box || !index.length) return;
    function render(items) {
      if (!items.length) {
        box.innerHTML = "";
        box.classList.remove("is-visible");
        return;
      }
      box.innerHTML = items.slice(0, 12).map(function (item) {
        return '<a class="search-result" href="./' + item.url + '">' +
          '<img src="' + item.cover + '" alt="' + item.title.replace(/"/g, "&quot;") + '海报">' +
          '<span><strong>' + item.title + '</strong><em>' + item.year + ' · ' + item.region + ' · ' + item.genre + '</em></span>' +
          '</a>';
      }).join("");
      box.classList.add("is-visible");
    }
    input.addEventListener("input", function () {
      var q = normalize(input.value);
      if (!q) {
        render([]);
        return;
      }
      render(index.filter(function (item) {
        return normalize(item.title + " " + item.region + " " + item.year + " " + item.genre + " " + item.tags).indexOf(q) !== -1;
      }));
    });
    document.addEventListener("click", function (event) {
      if (!box.contains(event.target) && event.target !== input) {
        box.classList.remove("is-visible");
      }
    });
  }

  function setupPageFilters() {
    var input = document.querySelector("[data-page-filter]");
    var region = document.querySelector("[data-filter-region]");
    var year = document.querySelector("[data-filter-year]");
    var list = document.querySelector("[data-card-list]");
    var empty = document.querySelector("[data-empty-state]");
    if (!list) return;
    var cards = Array.prototype.slice.call(list.querySelectorAll("[data-card]"));
    function apply() {
      var q = normalize(input && input.value);
      var r = normalize(region && region.value);
      var y = normalize(year && year.value);
      var shown = 0;
      cards.forEach(function (card) {
        var text = normalize((card.dataset.title || "") + " " + (card.dataset.genre || "") + " " + (card.dataset.region || "") + " " + (card.dataset.year || ""));
        var ok = (!q || text.indexOf(q) !== -1) && (!r || normalize(card.dataset.region).indexOf(r) !== -1) && (!y || normalize(card.dataset.year) === y);
        card.style.display = ok ? "" : "none";
        if (ok) shown += 1;
      });
      if (empty) empty.classList.toggle("is-visible", shown === 0);
    }
    [input, region, year].forEach(function (control) {
      if (control) control.addEventListener("input", apply);
      if (control) control.addEventListener("change", apply);
    });
  }

  function setupCategorySearch() {
    var input = document.querySelector("[data-category-search]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-category-card]"));
    if (!input || !cards.length) return;
    input.addEventListener("input", function () {
      var q = normalize(input.value);
      cards.forEach(function (card) {
        card.style.display = !q || normalize(card.dataset.name).indexOf(q) !== -1 ? "" : "none";
      });
    });
  }

  window.setupMoviePlayer = function (videoId, coverId, sourceUrl) {
    var video = document.getElementById(videoId);
    var cover = document.getElementById(coverId);
    if (!video || !cover || !sourceUrl) return;
    var hls = null;
    function attach() {
      if (video.getAttribute("data-ready") === "1") return;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
      } else {
        video.src = sourceUrl;
      }
      video.setAttribute("data-ready", "1");
    }
    function start() {
      attach();
      cover.classList.add("is-hidden");
      video.controls = true;
      var task = video.play();
      if (task && typeof task.catch === "function") {
        task.catch(function () {
          cover.classList.remove("is-hidden");
        });
      }
    }
    cover.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (video.paused) start();
    });
    window.addEventListener("beforeunload", function () {
      if (hls) hls.destroy();
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupGlobalSearch();
    setupPageFilters();
    setupCategorySearch();
  });
})();
