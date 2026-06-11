(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function setupMenu() {
    var button = one('[data-menu-button]');
    var panel = one('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('open');
    });
  }

  function setupHero() {
    var slides = all('[data-hero-slide]');
    var dots = all('[data-hero-dot]');
    var prev = one('[data-hero-prev]');
    var next = one('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    start();
  }

  function setupFilters() {
    var grid = one('[data-filter-grid]');
    if (!grid) {
      return;
    }
    var search = one('#pageSearch');
    var year = one('#yearFilter');
    var type = one('#typeFilter');
    var region = one('#regionFilter');
    var cards = all('[data-filter-card]', grid);
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q');

    if (initial && search) {
      search.value = initial;
    }

    function text(card, name) {
      return (card.getAttribute(name) || '').toLowerCase();
    }

    function apply() {
      var query = search ? search.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      var regionValue = region ? region.value : '';

      cards.forEach(function (card) {
        var haystack = [text(card, 'data-title'), text(card, 'data-tags'), text(card, 'data-year'), text(card, 'data-type'), text(card, 'data-region')].join(' ');
        var matched = true;
        if (query && haystack.indexOf(query) === -1) {
          matched = false;
        }
        if (yearValue && text(card, 'data-year') !== yearValue.toLowerCase()) {
          matched = false;
        }
        if (typeValue && text(card, 'data-type') !== typeValue.toLowerCase()) {
          matched = false;
        }
        if (regionValue && text(card, 'data-region') !== regionValue.toLowerCase()) {
          matched = false;
        }
        card.style.display = matched ? '' : 'none';
      });
    }

    [search, year, type, region].forEach(function (control) {
      if (!control) {
        return;
      }
      control.addEventListener('input', apply);
      control.addEventListener('change', apply);
    });

    apply();
  }

  window.initMoviePlayer = function (source) {
    var video = one('[data-player-video]');
    var button = one('[data-play-button]');
    if (!video || !source) {
      return;
    }
    var ready = false;

    function bind() {
      if (ready) {
        return;
      }
      ready = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function start() {
      bind();
      if (button) {
        button.classList.add('hidden');
      }
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener('click', start);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener('play', function () {
      if (button) {
        button.classList.add('hidden');
      }
    });

    video.addEventListener('pause', function () {
      if (button && video.currentTime === 0) {
        button.classList.remove('hidden');
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
