const detailCarousel = document.querySelector("[data-detail-carousel]");

if (detailCarousel) {
  const slides = Array.from(detailCarousel.querySelectorAll(".detail-slide"));
  const previousButton = detailCarousel.querySelector(".detail-arrow-left");
  const nextButton = detailCarousel.querySelector(".detail-arrow-right");
  const dots = Array.from(document.querySelectorAll("[data-detail-dot]"));
  const info = document.querySelector(".detail-carousel-info");
  const title = document.querySelector("[data-detail-title]");
  const copy = document.querySelector("[data-detail-copy]");
  const slideText = [
    {
      title: "Shimano 7 velocidades",
      copy: "Cambios suaves y precisos para cada recorrido.",
    },
    {
      title: "Sistema de plegado",
      copy: "Plegado simple y seguro para moverte mejor.",
    },
    {
      title: "Cuadro de aluminio",
      copy: "Ligero, resistente y listo para la ciudad.",
    },
    {
      title: "Frenos V-Brake",
      copy: "Control confiable en cada frenada urbana.",
    },
    {
      title: "Manubrio ajustable",
      copy: "Comodidad adaptable para distintas posturas.",
    },
    {
      title: "Asiento comfort",
      copy: "M\u00e1s comodidad para tus recorridos diarios.",
    },
  ];
  let activeIndex = 0;
  let touchStartX = null;

  const wrapIndex = (index) => (index + slides.length) % slides.length;

  const setDetailSlide = (index) => {
    activeIndex = wrapIndex(index);
    const previousIndex = wrapIndex(activeIndex - 1);
    const nextIndex = wrapIndex(activeIndex + 1);

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeIndex);
      slide.classList.toggle("is-prev", slideIndex === previousIndex);
      slide.classList.toggle("is-next", slideIndex === nextIndex);
      slide.classList.toggle("is-hidden-left", slideIndex !== activeIndex && slideIndex !== previousIndex && slideIndex < activeIndex);
      slide.classList.toggle("is-hidden-right", slideIndex !== activeIndex && slideIndex !== nextIndex && slideIndex > activeIndex);

      if (activeIndex === 0 && slideIndex === slides.length - 1) {
        slide.classList.remove("is-hidden-right");
      }

      if (activeIndex === slides.length - 1 && slideIndex === 0) {
        slide.classList.remove("is-hidden-left");
      }
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });

    if (title && copy && info) {
      info.classList.add("is-changing");
      window.setTimeout(() => {
        title.textContent = slideText[activeIndex].title;
        copy.textContent = slideText[activeIndex].copy;
        info.classList.remove("is-changing");
      }, 160);
    }
  };

  previousButton?.addEventListener("click", () => setDetailSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => setDetailSlide(activeIndex + 1));

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      setDetailSlide(Number(dot.dataset.detailDot));
    });
  });

  detailCarousel.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0]?.clientX ?? null;
  }, { passive: true });

  detailCarousel.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) > 44) {
      setDetailSlide(activeIndex + (deltaX < 0 ? 1 : -1));
    }

    touchStartX = null;
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (!detailCarousel.matches(":hover")) return;

    if (event.key === "ArrowRight") {
      setDetailSlide(activeIndex + 1);
    }

    if (event.key === "ArrowLeft") {
      setDetailSlide(activeIndex - 1);
    }
  });

  setDetailSlide(0);
}

const foldExploded = document.querySelector(".fold-exploded");
const foldStage = document.querySelector("[data-fold-exploded]");
const foldParts = {
  rear: document.querySelector('[data-fold-part="rear"]'),
  front: document.querySelector('[data-fold-part="front"]'),
  frame: document.querySelector('[data-fold-part="frame"]'),
  seat: document.querySelector('[data-fold-part="seat"]'),
  handlebar: document.querySelector('[data-fold-part="handlebar"]'),
  pedal: document.querySelector('[data-fold-part="pedal"]'),
};

if (foldExploded && foldStage && Object.values(foldParts).every(Boolean)) {
  let isFoldTicking = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileFold = window.matchMedia("(max-width: 760px)");

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, progress) => start + (end - start) * progress;
  const easeInOut = (progress) => 0.5 - Math.cos(progress * Math.PI) / 2;

  const partMotion = {
    rear: { x: [210, 0], y: [-34, 0], r: [-7, 0], s: [0.76, 1] },
    front: { x: [-312, 0], y: [-18, 0], r: [-18, 0], s: [0.78, 1] },
    frame: { x: [-80, 0], y: [48, 0], r: [-48, 0], s: [0.78, 1] },
    seat: { x: [116, 0], y: [205, 0], r: [18, 0], s: [0.82, 1] },
    handlebar: { x: [-208, 0], y: [205, 0], r: [-74, 0], s: [0.82, 1] },
    pedal: { x: [-72, 0], y: [-6, 0], r: [-130, 0], s: [0.85, 1] },
  };

  const setFoldProgress = (rawProgress) => {
    const progress = reducedMotion.matches ? 1 : easeInOut(clamp(rawProgress));
    const stageScale = foldStage.getBoundingClientRect().width / 960;
    const blurWindow = progress > 0.18 && progress < 0.68 ? Math.sin(((progress - 0.18) / 0.5) * Math.PI) : 0;
    const blur = Math.max(0, blurWindow) * 2.6;

    Object.entries(foldParts).forEach(([name, element]) => {
      const motion = partMotion[name];
      const x = lerp(motion.x[0], motion.x[1], progress) * stageScale;
      const y = lerp(motion.y[0], motion.y[1], progress) * stageScale;
      const rotate = lerp(motion.r[0], motion.r[1], progress);
      const scale = lerp(motion.s[0], motion.s[1], progress);

      element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      element.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
      element.style.opacity = `${lerp(0.94, 1, progress).toFixed(3)}`;
    });
  };

  const updateFoldExploded = () => {
    if (mobileFold.matches) {
      setFoldProgress(1);
      return;
    }

    const rect = foldExploded.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollDistance = Math.max(rect.height - viewportHeight, 1);
    const progress = clamp(-rect.top / scrollDistance);

    setFoldProgress(progress);
  };

  const requestFoldUpdate = () => {
    if (isFoldTicking) return;

    isFoldTicking = true;
    window.requestAnimationFrame(() => {
      updateFoldExploded();
      isFoldTicking = false;
    });
  };

  window.addEventListener("scroll", requestFoldUpdate, { passive: true });
  window.addEventListener("resize", requestFoldUpdate);
  reducedMotion.addEventListener("change", requestFoldUpdate);
  mobileFold.addEventListener("change", requestFoldUpdate);
  updateFoldExploded();
}

const carryStory = document.querySelector(".carry-story");

if (carryStory) {
  let isCarryTicking = false;

  const updateCarryParallax = () => {
    const rect = carryStory.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const offset = (clampedProgress - 0.5) * -42;

    carryStory.style.setProperty("--carry-parallax", `${offset.toFixed(2)}px`);
  };

  const requestCarryUpdate = () => {
    if (isCarryTicking) return;

    isCarryTicking = true;
    window.requestAnimationFrame(() => {
      updateCarryParallax();
      isCarryTicking = false;
    });
  };

  window.addEventListener("scroll", requestCarryUpdate, { passive: true });
  window.addEventListener("resize", requestCarryUpdate);
  updateCarryParallax();
}


const foldProcess = document.querySelector('[data-fold-process]');
const foldProcessButton = document.querySelector('[data-fold-process-button]');

if (foldProcess && foldProcessButton) {
  const foldSteps = Array.from(foldProcess.querySelectorAll('[data-fold-step]'));
  let foldProcessTimer = null;
  let foldProcessIndex = 0;

  const setFoldProcessStep = (index) => {
    foldProcessIndex = index % foldSteps.length;
    foldSteps.forEach((step, stepIndex) => {
      step.classList.toggle('is-active', stepIndex === foldProcessIndex);
    });
  };

  foldProcessButton.addEventListener('click', () => {
    window.clearInterval(foldProcessTimer);
    setFoldProcessStep(0);
    foldProcessTimer = window.setInterval(() => {
      setFoldProcessStep(foldProcessIndex + 1);
      if (foldProcessIndex === foldSteps.length - 1) {
        window.clearInterval(foldProcessTimer);
        foldProcessTimer = null;
      }
    }, 850);
  });
}
