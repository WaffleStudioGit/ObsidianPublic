/** Match GFM / Obsidian task list items that are checked. */
const CHECKED_TASK =
	/^(\s*(?:[-*+]|\d+[.)])\s+)\[(?:x|X)\](\s)/;

/**
 * Replace checked task markers with unchecked ones.
 * Skips fenced code blocks (``` / ~~~) so examples are left alone.
 */
export function uncheckTodosInMarkdown(content: string): {
	updated: string;
	changedCount: number;
} {
	const lines = content.split("\n");
	let inFence = false;
	let fenceMarker = "";
	let changedCount = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);

		if (fenceMatch) {
			const marker = fenceMatch[2][0];
			const length = fenceMatch[2].length;
			if (!inFence) {
				inFence = true;
				fenceMarker = marker.repeat(length);
			} else if (
				fenceMatch[2][0] === fenceMarker[0] &&
				fenceMatch[2].length >= fenceMarker.length &&
				fenceMatch[3].trim() === ""
			) {
				inFence = false;
				fenceMarker = "";
			}
			continue;
		}

		if (inFence) continue;

		const next = line.replace(CHECKED_TASK, (_, prefix: string, space: string) => {
			changedCount += 1;
			return `${prefix}[ ]${space}`;
		});

		if (next !== line) {
			lines[i] = next;
		}
	}

	return {
		updated: lines.join("\n"),
		changedCount,
	};
}

export function parseFolderList(raw: string): string[] {
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim().replace(/^\/+|\/+$/g, ""))
		.filter(Boolean);
}

export function pathMatchesFolders(path: string, folders: string[]): boolean {
	if (folders.length === 0) return false;
	return folders.some((folder) => {
		if (folder === "" || folder === ".") return true;
		return path === folder || path.startsWith(folder + "/");
	});
}
