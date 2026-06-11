(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase().trim();
  }

  function initMobileMenu() {
    var button = document.querySelector("[data-mobile-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initSearch() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-search-input]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var emptyTips = Array.prototype.slice.call(document.querySelectorAll("[data-empty-tip]"));
    if (!inputs.length || !cards.length) {
      return;
    }
    var apply = function (value) {
      var query = normalize(value);
      var visible = 0;
      cards.forEach(function (card) {
        var text = normalize(card.textContent + " " + card.dataset.title + " " + card.dataset.year + " " + card.dataset.genre + " " + card.dataset.region + " " + card.dataset.type + " " + card.dataset.tags);
        var matched = !query || text.indexOf(query) !== -1;
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      emptyTips.forEach(function (tip) {
        tip.hidden = visible !== 0;
      });
      inputs.forEach(function (input) {
        if (input.value !== value) {
          input.value = value;
        }
      });
    };
    inputs.forEach(function (input) {
      input.addEventListener("input", function () {
        apply(input.value);
      });
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    var timer;
    var show = function (next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    };
    var play = function () {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    };
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });
    play();
  }

  window.initPlayer = function (url) {
    var video = document.querySelector("[data-player]");
    var cover = document.querySelector("[data-player-cover]");
    var status = document.querySelector("[data-player-status]");
    var attached = false;
    var hlsInstance = null;
    if (!video || !url) {
      return;
    }
    var setStatus = function (message) {
      if (status) {
        status.textContent = message || "";
      }
    };
    var attach = function () {
      if (attached) {
        return;
      }
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setStatus("播放连接正在恢复");
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setStatus("播放画面正在恢复");
            hlsInstance.recoverMediaError();
          } else {
            setStatus("播放暂时不可用");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else {
        setStatus("播放暂时不可用");
      }
    };
    var begin = function () {
      attach();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          setStatus("点击播放器开始观看");
        });
      }
    };
    attach();
    if (cover) {
      cover.addEventListener("click", begin);
    }
    video.addEventListener("play", function () {
      if (cover) {
        cover.classList.add("is-hidden");
      }
      setStatus("");
    });
    video.addEventListener("error", function () {
      setStatus("播放暂时不可用");
    });
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    initMobileMenu();
    initSearch();
    initHero();
  });
})();
