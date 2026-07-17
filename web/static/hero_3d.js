// hero_3d.js - Feature card slideshow
//
// Zero external dependencies (no GSAP/Three.js) - plain vanilla JS plus
// the CSS transitions in styles_tabs.css. Earlier versions leaned on a
// CDN library, which introduced a failure mode where the whole thing
// silently did nothing if the CDN didn't load; this avoids that.
//
// The logo has been removed - this is now a straightforward slideshow of
// the four feature cards. Navigate by dragging left/right, using the
// arrow buttons, clicking the dots, or arrow keys. Card visibility is
// driven by a `.current` class; the first card is also shown by pure CSS
// (via the `no-js-fallback` class on the stack) so it's never blank even
// if this script fails to run for any reason.

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('logo3dStage'); // now the .orbit-showcase wrapper
    const cardEls = Array.from(document.querySelectorAll('.orbit-card'));
    const dotEls = Array.from(document.querySelectorAll('.orbit-dot'));
    const navLeft = document.getElementById('orbitNavLeft');
    const navRight = document.getElementById('orbitNavRight');

    if (!stage || cardEls.length === 0) {
        console.warn('[hero_3d] Required elements not found:', {
            stage: !!stage, cardCount: cardEls.length
        });
        return;
    }
    console.log('[hero_3d] All required elements found. Card count:', cardEls.length);

    // JS is running, so hand card visibility over to the .current class
    // (removes the CSS-only "first card always visible" fallback).
    const cardStack = document.getElementById('orbitCardStack');
    if (cardStack) cardStack.classList.remove('no-js-fallback');

    const CARD_COUNT = cardEls.length;
    const PX_PER_STEP = 80; // drag distance (px) to move one card
    let currentIndex = 0;

    function showCard(index) {
        cardEls.forEach((card, i) => card.classList.toggle('current', i === index));
    }

    function updateDots() {
        dotEls.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    function updateNavButtons() {
        if (navLeft) navLeft.disabled = currentIndex === 0;
        if (navRight) navRight.disabled = currentIndex === CARD_COUNT - 1;
    }

    function goToIndex(index) {
        index = Math.max(0, Math.min(CARD_COUNT - 1, index));
        if (index === currentIndex) return;
        currentIndex = index;
        showCard(currentIndex);
        updateDots();
        updateNavButtons();
    }

    // Initial state
    showCard(0);
    updateDots();
    updateNavButtons();

    if (navRight) navRight.addEventListener('click', () => goToIndex(currentIndex + 1));
    if (navLeft) navLeft.addEventListener('click', () => goToIndex(currentIndex - 1));
    dotEls.forEach((dot, i) => dot.addEventListener('click', () => goToIndex(i)));

    // ---- Drag / swipe ----
    let dragStartX = null;
    let dragStartIndex = 0;

    function isInteractiveTarget(target) {
        return target && typeof target.closest === 'function' &&
            target.closest('.orbit-nav-btn, .orbit-dot, .orbit-card-tags, a, button');
    }

    function onDragStart(clientX, target) {
        if (isInteractiveTarget(target)) return;
        dragStartX = clientX;
        dragStartIndex = currentIndex;
        stage.classList.add('dragging');
    }

    function onDragMove(clientX) {
        if (dragStartX === null) return;
        const stepsMoved = Math.round((clientX - dragStartX) / PX_PER_STEP);
        // drag left (negative delta) -> advance to next card
        goToIndex(dragStartIndex - stepsMoved);
    }

    function onDragEnd() {
        dragStartX = null;
        stage.classList.remove('dragging');
    }

    stage.addEventListener('mousedown', (e) => onDragStart(e.clientX, e.target));
    window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
    window.addEventListener('mouseup', onDragEnd);

    stage.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientX, e.target), { passive: true });
    stage.addEventListener('touchmove', (e) => onDragMove(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchend', onDragEnd);

    // Keyboard support
    stage.setAttribute('tabindex', '0');
    stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') goToIndex(currentIndex + 1);
        if (e.key === 'ArrowLeft') goToIndex(currentIndex - 1);
    });

    // ---- Floating background particles ----
    const particleContainer = document.getElementById('orbitParticles');
    if (particleContainer) {
        const PARTICLE_COUNT = 18;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = document.createElement('div');
            p.className = 'orbit-particle';
            const size = 2 + Math.random() * 3;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 100}%`;
            p.style.animationDuration = `${8 + Math.random() * 10}s`;
            p.style.animationDelay = `${Math.random() * 10}s`;
            particleContainer.appendChild(p);
        }
    }
});