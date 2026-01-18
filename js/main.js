/**
 * Stephen Long for Congress TX-8
 * Premium Campaign Website - Main JavaScript
 * $10K Quality with Full Animations
 */

document.addEventListener('DOMContentLoaded', function() {

  // ==================== SCROLL ANIMATIONS ====================
  const animateOnScroll = () => {
    // Note: .district-map is excluded to prevent hiding the Leaflet map container
    const animateElements = document.querySelectorAll(
      '.section-header, .hero-content, .hero-image, .about-grid > *, .issue-card, ' +
      '.why-card, .district-content, .volunteer-option, .news-card, ' +
      '.event-card, .contact-info, .contact-form, .why-card, .endorsement-card, ' +
      '.donate-card, .gallery-item, .about-feature, .district-highlight-item, ' +
      'h1, h2, .btn, .hero-stat, .key-points, .issue-highlight'
    );

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Staggered animation delay based on element index
          const delay = Math.min(index * 0.1, 0.5);
          entry.target.style.transitionDelay = `${delay}s`;
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animateElements.forEach(el => {
      el.classList.add('animate-hidden');
      observer.observe(el);
    });
  };

  // Add animation styles
  const animationStyles = document.createElement('style');
  animationStyles.textContent = `
    .animate-hidden {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                  transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .animate-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Hero Animations */
    .hero-content.animate-hidden {
      transform: translateX(-60px);
    }
    .hero-content.animate-visible {
      transform: translateX(0);
    }

    .hero-image.animate-hidden {
      transform: translateX(60px) scale(0.9);
    }
    .hero-image.animate-visible {
      transform: translateX(0) scale(1);
    }

    /* Stats Counter Animation */
    .hero-stat.animate-hidden {
      transform: translateY(30px) scale(0.9);
    }
    .hero-stat.animate-visible {
      transform: translateY(0) scale(1);
    }

    /* Card Hover Effects */
    .issue-card,
    .why-card,
    .volunteer-option,
    .news-card,
    .event-card {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .issue-card:hover,
    .why-card:hover,
    .volunteer-option:hover {
      transform: translateY(-10px);
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }

    /* Icon Animations */
    .issue-icon,
    .why-icon,
    .volunteer-option i,
    .district-highlight-item i {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .issue-card:hover .issue-icon,
    .why-card:hover .why-icon {
      transform: scale(1.15) rotate(5deg);
    }

    .volunteer-option:hover i {
      transform: scale(1.2);
    }

    /* Link Arrow Animations */
    .issue-link i,
    .news-content .issue-link i {
      transition: transform 0.3s ease;
    }

    .issue-link:hover i,
    .news-content .issue-link:hover i {
      transform: translateX(5px);
    }

    /* Button Pulse Effect */
    @keyframes buttonPulse {
      0%, 100% { box-shadow: 0 4px 15px rgba(196, 30, 58, 0.35); }
      50% { box-shadow: 0 4px 25px rgba(196, 30, 58, 0.55); }
    }

    .btn-primary:not(:hover) {
      animation: buttonPulse 2.5s ease-in-out infinite;
    }

    /* Floating Elements */
    @keyframes gentleFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .hero-image-wrapper {
      animation: gentleFloat 4s ease-in-out infinite;
    }

    /* Image Zoom on Hover */
    .about-image img,
    .gallery-item img {
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .about-image:hover img,
    .gallery-item:hover img {
      transform: scale(1.08);
    }

    /* Badge Animation */
    .about-image-badge {
      animation: badgePulse 3s ease-in-out infinite;
    }

    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    /* Form Input Focus Effects */
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      transform: scale(1.01);
      box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15);
    }

    /* Social Icon Hover */
    .hero-social a,
    .footer-social a {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hero-social a:hover,
    .footer-social a:hover {
      transform: translateY(-5px) scale(1.1);
    }

    /* Navigation Link Effects */
    .nav-desktop a {
      position: relative;
    }

    .nav-desktop a::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #C41E3A, #D4AF37);
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }

    .nav-desktop a:hover::after,
    .nav-desktop a.active::after {
      width: 100%;
    }

    /* CTA Button Glow */
    .nav-cta {
      animation: ctaGlow 2s ease-in-out infinite;
    }

    @keyframes ctaGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.4); }
      50% { box-shadow: 0 0 20px 5px rgba(196, 30, 58, 0.3); }
    }

    /* Loading Skeleton Animation */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton 1.5s ease-in-out infinite;
    }

    @keyframes skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Scroll Progress Indicator */
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 4px;
      background: linear-gradient(90deg, #C41E3A, #D4AF37);
      z-index: 10000;
      transition: width 0.1s linear;
    }

    /* Page Transition */
    .page-transition {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1B365D, #0d1f38);
      z-index: 9999;
      transform: translateY(-100%);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .page-transition.active {
      transform: translateY(0);
    }

    /* Parallax Background */
    .hero::before {
      transition: transform 0.1s linear;
    }

    /* Form Success Animation */
    .form-success {
      background: linear-gradient(135deg, #d4edda, #c3e6cb);
      border: none;
      color: #155724;
      padding: 2.5rem;
      border-radius: 12px;
      text-align: center;
      animation: successBounce 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes successBounce {
      0% { opacity: 0; transform: scale(0.8); }
      50% { transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }

    .form-success p {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    /* Error State */
    input.error,
    textarea.error,
    select.error {
      border-color: #C41E3A !important;
      animation: shake 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }

    /* Mobile Nav Animation */
    .nav-toggle span {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-toggle.active span:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }

    .nav-toggle.active span:nth-child(2) {
      opacity: 0;
      transform: translateX(-20px);
    }

    .nav-toggle.active span:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }

    .nav-mobile {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-mobile.active {
      animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Texas Map Animation */
    .texas-svg {
      animation: mapFloat 6s ease-in-out infinite;
    }

    @keyframes mapFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-5px) rotate(1deg); }
    }

    .district-highlight {
      animation: districtPulse 2s ease-in-out infinite;
    }

    @keyframes districtPulse {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(196, 30, 58, 0.5)); }
      50% { filter: drop-shadow(0 0 20px rgba(196, 30, 58, 0.9)); }
    }

    /* Video Section Animation */
    .video-wrapper {
      transition: transform 0.4s ease, box-shadow 0.4s ease;
    }

    .video-wrapper:hover {
      transform: scale(1.02);
      box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    }

    /* Checkbox Animation */
    .checkbox-group input[type="checkbox"] {
      transition: transform 0.2s ease;
    }

    .checkbox-group input[type="checkbox"]:checked {
      animation: checkPop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes checkPop {
      50% { transform: scale(1.3); }
    }
  `;
  document.head.appendChild(animationStyles);

  // Initialize scroll animations
  animateOnScroll();

  // ==================== DATA-ANIMATE SCROLL OBSERVER ====================
  const initDataAnimations = () => {
    // Animate elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    const staggeredContainers = document.querySelectorAll('[data-animate-stagger]');

    const animateObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          animateObserver.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.15
    });

    animatedElements.forEach(el => animateObserver.observe(el));
    staggeredContainers.forEach(el => animateObserver.observe(el));
  };

  // Initialize data animations
  initDataAnimations();

  // ==================== SCROLL PROGRESS INDICATOR ====================
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;
  });

  // ==================== COUNTER ANIMATION ====================
  const animateCounters = () => {
    const counters = document.querySelectorAll('.hero-stat-number, .countdown-number');

    counters.forEach(counter => {
      const text = counter.textContent;
      const hasNumber = /\d/.test(text);

      if (hasNumber && !counter.dataset.animated) {
        const match = text.match(/(\d+)/);
        if (match) {
          const target = parseInt(match[0]);
          const prefix = text.split(match[0])[0];
          const suffix = text.split(match[0])[1] || '';

          let current = 0;
          const increment = target / 50;
          const duration = 2000;
          const step = duration / 50;

          counter.dataset.animated = 'true';

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              counter.textContent = prefix + target + suffix;
              clearInterval(timer);
            } else {
              counter.textContent = prefix + Math.floor(current) + suffix;
            }
          }, step);
        }
      }
    });
  };

  // Observe stats section for counter animation
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // ==================== PARALLAX EFFECT ====================
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image-wrapper');
    const heroBg = document.querySelector('.hero');

    if (heroImage && scrolled < 600) {
      heroImage.style.transform = `translateY(${scrolled * 0.15}px)`;
    }
  });

  // ==================== MOBILE NAVIGATION ====================
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function() {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      navMobile.classList.toggle('active');
      navToggle.classList.toggle('active');

      // Prevent body scroll when nav is open
      document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function(e) {
      if (!navToggle.contains(e.target) && !navMobile.contains(e.target)) {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close mobile nav when clicking a link
    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ==================== HEADER SCROLL EFFECT ====================
  const header = document.querySelector('.header');
  let lastScroll = 0;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });

  // ==================== SMOOTH SCROLL ====================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // ==================== FORM HANDLING ====================
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.classList.add('error');
          showFieldError(field, 'This field is required');
        } else {
          field.classList.remove('error');
          removeFieldError(field);
        }

        if (field.type === 'email' && field.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(field.value)) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'Please enter a valid email address');
          }
        }

        if (field.type === 'tel' && field.value) {
          const phoneRegex = /^[\d\s\-\(\)\+]+$/;
          if (!phoneRegex.test(field.value)) {
            isValid = false;
            field.classList.add('error');
            showFieldError(field, 'Please enter a valid phone number');
          }
        }
      });

      if (isValid) {
        const successMsg = document.createElement('div');
        successMsg.className = 'form-success';
        successMsg.innerHTML = `
          <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #155724; margin-bottom: 1rem;"></i>
          <p>Thank you! Your submission has been received.</p>
          <p style="font-size: 0.95rem; margin-top: 0.5rem; opacity: 0.8;">We'll be in touch soon.</p>
        `;

        form.innerHTML = '';
        form.appendChild(successMsg);
      }
    });
  });

  function showFieldError(field, message) {
    removeFieldError(field);
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = message;
    error.style.cssText = 'color: #C41E3A; font-size: 0.85rem; margin-top: 0.25rem; display: block;';
    field.parentNode.appendChild(error);
  }

  function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  }

  // ==================== NEWSLETTER SIGNUP ====================
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      const email = emailInput.value;

      if (email) {
        const btn = this.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Subscribed!';
        btn.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';

        setTimeout(() => {
          emailInput.value = '';
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 3000);
      }
    });
  }

  // ==================== PRIMARY COUNTDOWN ====================
  const updatePrimaryCountdown = () => {
    const primaryDate = new Date('2026-03-03T00:00:00');
    const now = new Date();
    const diff = primaryDate - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const countdownEls = document.querySelectorAll('.countdown, .countdown-number');
      countdownEls.forEach(el => {
        if (!el.dataset.custom) {
          el.textContent = `${days}`;
        }
      });
    }
  };

  updatePrimaryCountdown();
  setInterval(updatePrimaryCountdown, 60000);

  // ==================== COPY TO CLIPBOARD ====================
  const copyButtons = document.querySelectorAll('[data-copy]');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const text = this.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        this.style.background = 'linear-gradient(135deg, #28a745, #1e7e34)';
        setTimeout(() => {
          this.textContent = originalText;
          this.style.background = '';
        }, 2000);
      });
    });
  });

  // ==================== ACTIVE NAV HIGHLIGHTING ====================
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath ||
        (currentPath.includes(href) && href !== '/' && href !== '/index.html')) {
      link.classList.add('active');
    }
  });

  // ==================== LAZY LOADING ====================
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
  }

  // ==================== TYPEWRITER EFFECT FOR HERO ====================
  const typewriterEl = document.querySelector('.hero-quote');
  if (typewriterEl && !typewriterEl.dataset.typed) {
    typewriterEl.dataset.typed = 'true';
    const text = typewriterEl.textContent;
    typewriterEl.textContent = '';
    typewriterEl.style.borderRight = '2px solid #D4AF37';

    let i = 0;
    const typeSpeed = 40;

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          typewriterEl.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            typewriterEl.style.borderRight = 'none';
          }, 1000);
        }
      }, typeSpeed);
    }, 1000);
  }

  // ==================== MOUSE TRAIL EFFECT (SUBTLE) ====================
  let mouseTrailEnabled = window.innerWidth > 768;

  if (mouseTrailEnabled) {
    document.addEventListener('mousemove', (e) => {
      // Only on hero section
      const hero = document.querySelector('.hero');
      if (hero && hero.contains(e.target)) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: fixed;
          width: 6px;
          height: 6px;
          background: rgba(212, 175, 55, 0.4);
          border-radius: 50%;
          pointer-events: none;
          left: ${e.clientX}px;
          top: ${e.clientY}px;
          z-index: 9998;
          animation: particleFade 1s ease-out forwards;
        `;
        document.body.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
      }
    });

    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
      @keyframes particleFade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.3) translateY(-30px); }
      }
    `;
    document.head.appendChild(particleStyle);
  }

  console.log('Stephen Long for Congress TX-8 - Website Loaded Successfully');
});
