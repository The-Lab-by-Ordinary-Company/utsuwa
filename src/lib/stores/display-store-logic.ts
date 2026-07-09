import {
	DEFAULT_CHAT_DISPLAY_MODE,
	DEFAULT_SIDEBAR_POSITION,
	type ChatDisplayMode,
	type SidebarPosition
} from './display-types.ts';

export interface ChatDisplaySnapshot {
	chatDisplayMode: ChatDisplayMode;
	sidebarPosition: SidebarPosition;
}

export function setChatDisplayMode(
	current: ChatDisplaySnapshot,
	mode: ChatDisplayMode
): ChatDisplaySnapshot {
	return { ...current, chatDisplayMode: mode };
}

export function setSidebarPosition(
	current: ChatDisplaySnapshot,
	pos: SidebarPosition
): ChatDisplaySnapshot {
	return { ...current, sidebarPosition: pos };
}

export function resetChatDisplay(): ChatDisplaySnapshot {
	return {
		chatDisplayMode: DEFAULT_CHAT_DISPLAY_MODE,
		sidebarPosition: DEFAULT_SIDEBAR_POSITION
	};
}
