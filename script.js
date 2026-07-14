// ===== Subtle scroll-driven jump shot =====
(function () {
  var ball = document.getElementById("ball");
  var rim = document.getElementById("rim");
  var progress = document.getElementById("progress");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Trajectory in viewport fractions. P0 = release (resting), C = arc apex.
  // The rim entry is read from the live rim element so the shot always lands.
  // Resting spot differs by width so the ball never sits on top of hero text.
  var Cf = { x: 0.72, y: 0.04 };
  function releasePoint() {
    var narrow = vw < 680;
    return { x: (narrow ? 0.9 : 0.52) * vw, y: (narrow ? 0.86 : 0.8) * vh };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function bez(p0, c, p1, t) { var mt = 1 - t; return mt * mt * p0 + 2 * mt * t * c + t * t * p1; }

  var hasSwished = false;
  var vw = window.innerWidth;
  var vh = window.innerHeight;

  function render(p) {
    var t = p;

    var rr = rim.getBoundingClientRect();
    var P1 = { x: rr.left + rr.width * 0.5, y: rr.top + rr.height * 0.42 };
    var P0 = releasePoint();
    var C = { x: Cf.x * vw, y: Cf.y * vh };

    var px = bez(P0.x, C.x, P1.x, t);
    var py = bez(P0.y, C.y, P1.y, t);

    var scale = lerp(1, 0.42, t);   // recedes toward the rim
    var rot = t * 540;              // gentle spin

    ball.style.transform =
      "translate(" + px + "px," + py + "px) translate(-50%,-50%) rotate(" + rot + "deg) scale(" + scale + ")";
    // keep the ball faint; fade it out through the net at the very end
    var base = 0.5;
    ball.style.opacity = String(t > 0.95 ? clamp((1 - t) / 0.05, 0, 1) * base : base);

    if (progress) progress.style.width = (p * 100).toFixed(1) + "%";

    if (t > 0.96 && !hasSwished) {
      hasSwished = true;
      rim.classList.add("swish");
      setTimeout(function () { rim.classList.remove("swish"); }, 720);
    }
    if (t < 0.9) hasSwished = false;
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - vh;
      render(max > 0 ? clamp(window.scrollY / max, 0, 1) : 0);
      ticking = false;
    });
  }
  function onResize() { vw = window.innerWidth; vh = window.innerHeight; onScroll(); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  render(0);

  // ===== Reveal on scroll =====
  var revealEls = document.querySelectorAll(
    ".section-head, .xp-item, .skill-group, .proj, .card, .contact-links, .contact-sub, .contact-title"
  );
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  var yEl = document.getElementById("year");
  if (yEl) yEl.textContent = new Date().getFullYear();
})();
