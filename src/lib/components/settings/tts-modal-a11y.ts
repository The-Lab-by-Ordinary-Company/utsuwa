export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	return Array.from(
		container.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		)
	).filter((el) => !el.hasAttribute('disabled')) as HTMLElement[];
}

export function handleModalKeydown(
	e: KeyboardEvent,
	focusable: HTMLElement[],
	activeElement: Element | null,
	onClose: () => void
): void {
	if (e.key === 'Escape') {
		e.preventDefault();
		onClose();
		return;
	}
	if (e.key !== 'Tab' || focusable.length === 0) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	if (e.shiftKey && activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}
