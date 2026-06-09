document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("siteHeader");
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  const sections = document.querySelectorAll("section[id]");
  const revealItems = document.querySelectorAll(
    ".feature-card, .layer-card, .impact-card, .pricing-card, .cta-card, .demo-gallery"
  );
  const counters = document.querySelectorAll("[data-count]");

  /* Sticky navbar background on scroll */
  const updateHeader = () => {
    if (!header) return;

    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader);


  /* Smooth close mobile nav after click */
  navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    // Do not close the mobile navbar when clicking dropdown toggles
    if (link.classList.contains("dropdown-toggle")) {
      return;
    }

    const navbarCollapse = document.querySelector(".navbar-collapse");

    if (navbarCollapse && navbarCollapse.classList.contains("show")) {
      const bootstrapCollapse =
        bootstrap.Collapse.getInstance(navbarCollapse) ||
        new bootstrap.Collapse(navbarCollapse);

      bootstrapCollapse.hide();
    }
  });
});

  /* Active nav link on scroll */
/* Active nav link on scroll — homepage section links only */
const sectionLinks = document.querySelectorAll(
  '.navbar-nav .nav-link[href^="#"]:not(.dropdown-toggle)'
);

const pageSections = document.querySelectorAll("main section[id]");

const setActiveSectionNav = () => {
  if (!sectionLinks.length || !pageSections.length) return;

  let currentSectionId = "";

  pageSections.forEach((section) => {
    const sectionTop = section.offsetTop - 140;

    if (window.scrollY >= sectionTop) {
      currentSectionId = section.getAttribute("id");
    }
  });

  sectionLinks.forEach((link) => {
    link.classList.remove("active");

    if (link.getAttribute("href") === `#${currentSectionId}`) {
      link.classList.add("active");
    }
  });
};

window.addEventListener("scroll", setActiveSectionNav);
setActiveSectionNav();
/* Active nav link by current page URL */
const currentPath = window.location.pathname;

document.querySelectorAll(".navbar-nav a[href]").forEach((link) => {
  const href = link.getAttribute("href");

  if (!href || href === "#" || href.startsWith("#")) return;

  const linkPath = new URL(link.href, window.location.origin).pathname;

  if (linkPath === currentPath) {
    link.classList.add("active");

    const parentDropdown = link.closest(".dropdown");
    const dropdownToggle = parentDropdown?.querySelector(".dropdown-toggle");

    if (dropdownToggle) {
      dropdownToggle.classList.add("active");
    }
  }
});
  /* Reveal animation */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14
    }
  );

  revealItems.forEach((item) => {
    item.classList.add("reveal");
    revealObserver.observe(item);
  });


  /* Animated counters */
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count);
    const duration = 1200;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * target);

      counter.textContent = value;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target;
      }
    };

    requestAnimationFrame(update);
  };

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5
    }
  );

  counters.forEach((counter) => counterObserver.observe(counter));


  /* Product image tilt effect */
  const demoCards = document.querySelectorAll(".browser-card, .layer-card");

  demoCards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateX = ((y / rect.height) - 0.5) * -4;
      const rotateY = ((x / rect.width) - 0.5) * 4;

      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
});

// /* Copy contact email */
const copyEmailButtons = document.querySelectorAll(".contact-copy-btn");

copyEmailButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const email = button.dataset.email;

    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);

      const originalText = button.textContent;
      button.textContent = "Copied";
      button.classList.add("copied");

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 1600);
    } catch (error) {
      button.textContent = "Copy failed";
    }
  });
});