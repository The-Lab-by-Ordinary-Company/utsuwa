// Scroll-reveal action. Fires once when an element enters the viewport,
// staggered by an optional delay. Bails out to "always visible" when the
// user prefers reduced motion or IntersectionObserver isn't around.
export function reveal(node: HTMLElement, delay = 0) {
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('revealed');
		return;
	}
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		node.classList.add('revealed');
		return;
	}
	node.style.setProperty('--reveal-delay', `${delay}ms`);
	const obs = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('revealed');
					obs.unobserve(node);
				}
			}
		},
		{ threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
	);
	obs.observe(node);
	return { destroy: () => obs.disconnect() };
}
