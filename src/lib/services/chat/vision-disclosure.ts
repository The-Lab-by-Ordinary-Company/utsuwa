import { getLLMProvider } from '$lib/services/providers/registry';

// Disclose-and-allow. Showing her something on a cloud model means the image
// leaves the device for that one inference. We say so plainly (warm, not a
// legal banner), let the user proceed, and offer a setting to restrict to local.

export interface VisionDisclosure {
	/** Whether the image leaves the device to be seen. */
	leavesDevice: boolean;
	providerName: string;
	headline: string;
	detail: string;
}

export function visionDisclosure(providerId: string): VisionDisclosure {
	const provider = getLLMProvider(providerId);
	const leavesDevice = !provider?.isLocal;
	const providerName = provider?.name ?? 'this provider';

	if (!leavesDevice) {
		return {
			leavesDevice,
			providerName,
			headline: 'She sees this on your machine',
			detail: `${providerName} runs locally, so the image stays on your device. Nothing is uploaded.`
		};
	}

	return {
		leavesDevice,
		providerName,
		headline: `She sees this through ${providerName}`,
		detail: `To look at it, this image is sent to ${providerName} for a moment, so it leaves your device. Utsuwa keeps it locally as a keepsake, and you can have her forget it anytime. For fully on-device, use a local vision model like Ollama or LM Studio.`
	};
}
