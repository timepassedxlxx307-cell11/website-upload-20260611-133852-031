(() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };

  ready(() => {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
    applySearchQuery();
  });

  function setupMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const nav = document.querySelector("[data-mobile-nav]");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", () => {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    const root = document.querySelector("[data-hero]");

    if (!root) {
      return;
    }

    const slides = Array.from(root.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));

    if (slides.length <= 1) {
      return;
    }

    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const start = () => {
      timer = window.setInterval(() => show(index + 1), 5200);
    };

    const restart = () => {
      window.clearInterval(timer);
      start();
    };

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const nextIndex = Number(dot.dataset.heroDot || 0);
        show(nextIndex);
        restart();
      });
    });

    root.addEventListener("mouseenter", () => window.clearInterval(timer));
    root.addEventListener("mouseleave", start);

    start();
  }

  function setupFilters() {
    const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));

    panels.forEach((panel) => {
      const scope = panel.parentElement.querySelector("[data-filter-scope]");
      const emptyState = panel.parentElement.querySelector("[data-empty-state]");
      const searchInput = panel.querySelector("[data-filter-search]");
      const categorySelect = panel.querySelector("[data-filter-category]");
      const regionSelect = panel.querySelector("[data-filter-region]");
      const typeSelect = panel.querySelector("[data-filter-type]");

      if (!scope) {
        return;
      }

      const cards = Array.from(scope.querySelectorAll(".filter-card"));

      const filter = () => {
        const query = normalize(searchInput ? searchInput.value : "");
        const category = categorySelect ? categorySelect.value : "";
        const region = regionSelect ? regionSelect.value : "";
        const type = typeSelect ? typeSelect.value : "";
        let visibleCount = 0;

        cards.forEach((card) => {
          const text = normalize(card.dataset.search || card.textContent || "");
          const matchesQuery = !query || text.includes(query);
          const matchesCategory = !category || card.dataset.category === category;
          const matchesRegion = !region || card.dataset.region === region;
          const matchesType = !type || card.dataset.type === type;
          const visible = matchesQuery && matchesCategory && matchesRegion && matchesType;

          card.classList.toggle("is-hidden-card", !visible);

          if (visible) {
            visibleCount += 1;
          }
        });

        if (emptyState) {
          emptyState.hidden = visibleCount > 0;
        }
      };

      [searchInput, categorySelect, regionSelect, typeSelect].forEach((control) => {
        if (control) {
          control.addEventListener("input", filter);
          control.addEventListener("change", filter);
        }
      });

      filter();
    });
  }

  function applySearchQuery() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");

    if (!query) {
      return;
    }

    const input = document.querySelector("[data-filter-search]");

    if (input) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setupPlayer() {
    const players = Array.from(document.querySelectorAll("[data-player]"));

    players.forEach((root) => {
      const video = root.querySelector("video");
      const button = root.querySelector("[data-play-button]");
      const message = root.querySelector("[data-player-message]");
      const source = root.dataset.src;
      let hlsInstance = null;
      let initialized = false;

      if (!video || !source) {
        return;
      }

      const setMessage = (text) => {
        if (message) {
          message.textContent = text || "";
        }
      };

      const initialize = () => {
        if (initialized) {
          return Promise.resolve();
        }

        initialized = true;
        setMessage("正在加载播放源");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          setMessage("");
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

          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            setMessage("");
          });

          hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setMessage("网络加载异常，正在重试");
              hlsInstance.startLoad();
              return;
            }

            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setMessage("媒体解析异常，正在恢复");
              hlsInstance.recoverMediaError();
              return;
            }

            setMessage("当前浏览器无法播放该视频");
          });

          return Promise.resolve();
        }

        setMessage("当前浏览器不支持 HLS 播放");
        return Promise.resolve();
      };

      const play = () => {
        initialize().then(() => {
          const playPromise = video.play();

          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              setMessage("请再次点击播放按钮");
            });
          }
        });
      };

      if (button) {
        button.addEventListener("click", play);
      }

      root.addEventListener("click", (event) => {
        if (event.target === video) {
          return;
        }

        if (button && button.contains(event.target)) {
          return;
        }
      });

      video.addEventListener("play", () => {
        if (button) {
          button.classList.add("is-hidden");
        }
      });

      video.addEventListener("pause", () => {
        if (button && video.currentTime === 0) {
          button.classList.remove("is-hidden");
        }
      });

      window.addEventListener("beforeunload", () => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }
})();
