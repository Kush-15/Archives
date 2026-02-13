// GSAP animations on page load with luxury feel
gsap.registerPlugin();

// Hero animations - elegant and slow
gsap.to("#hero-title", { opacity: 1, y: -30, duration: 2.5, delay: 0.5, ease: "power3.out" });
gsap.to("#hero-subtitle", { opacity: 1, y: -20, duration: 2, delay: 1.5, ease: "power3.out" });
gsap.to("#hero-btn", { opacity: 1, scale: 1.1, duration: 2, delay: 2.5, ease: "elastic.out(1, 0.3)" });

// Product cards stagger animation - luxurious entrance
gsap.to(".product-card", {
    opacity: 1,
    rotationY: 0,
    duration: 2,
    stagger: 0.7,
    delay: 3,
    ease: "back.out(1.7)"
});

// Simple mobile menu toggle (basic JS)
const menuBtn = document.querySelector('button.md\\:hidden');
const nav = document.querySelector('nav');
if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('hidden');
    });
}
