import { Notice, Plugin, TFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	MidnightTodoResetSettingTab,
	type MidnightTodoResetSettings,
} from "./settings";
import {
	parseFolderList,
	pathMatchesFolders,
	uncheckTodosInMarkdown,
} from "./todos";

interface ResetResult {
	filesChanged: number;
	todosUnchecked: number;
}

export default class MidnightTodoResetPlugin extends Plugin {
	settings: MidnightTodoResetSettings = DEFAULT_SETTINGS;
	private timerId: number | null = null;
	private running = false;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new MidnightTodoResetSettingTab(this.app, this));

		this.addCommand({
			id: "reset-todos-now",
			name: "Reset todos now",
			callback: async () => {
				await this.runReset({ force: true, reason: "manual" });
			},
		});

		this.app.workspace.onLayoutReady(() => {
			void this.catchUpIfNeeded();
			this.reschedule();
		});
	}

	onunload(): void {
		this.clearTimer();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	reschedule(): void {
		this.clearTimer();

		if (!this.settings.enabled) return;

		const delay = msUntilNextReset(
			this.settings.resetHour,
			this.settings.resetMinute,
		);

		this.timerId = window.setTimeout(() => {
			void this.onScheduledFire();
		}, delay);
	}

	private async onScheduledFire(): Promise<void> {
		await this.runReset({ force: false, reason: "scheduled" });
		this.reschedule();
	}

	private async catchUpIfNeeded(): Promise<void> {
		if (!this.settings.enabled) return;

		const todayKey = localDateKey(new Date());
		if (this.settings.lastResetDate === todayKey) return;

		// Only catch up after today's configured reset time has passed.
		if (!hasReachedTodaysReset(this.settings.resetHour, this.settings.resetMinute)) {
			return;
		}

		await this.runReset({ force: false, reason: "catch-up" });
	}

	async runReset(opts: {
		force: boolean;
		reason: "scheduled" | "catch-up" | "manual";
	}): Promise<ResetResult> {
		if (this.running) {
			return { filesChanged: 0, todosUnchecked: 0 };
		}

		const todayKey = localDateKey(new Date());
		if (!opts.force && this.settings.lastResetDate === todayKey) {
			return { filesChanged: 0, todosUnchecked: 0 };
		}

		this.running = true;
		try {
			const result = await this.uncheckVaultTodos();

			this.settings.lastResetDate = todayKey;
			await this.saveSettings();

			if (this.settings.showNotice) {
				const verb = opts.reason === "manual" ? "Reset" : "Midnight reset";
				new Notice(
					`${verb}: unchecked ${result.todosUnchecked} todo${result.todosUnchecked === 1 ? "" : "s"} in ${result.filesChanged} note${result.filesChanged === 1 ? "" : "s"}.`,
				);
			}

			return result;
		} finally {
			this.running = false;
		}
	}

	private async uncheckVaultTodos(): Promise<ResetResult> {
		const include = parseFolderList(this.settings.includeFolders);
		const exclude = parseFolderList(this.settings.excludeFolders);

		const files = this.app.vault.getMarkdownFiles().filter((file) => {
			if (exclude.length > 0 && pathMatchesFolders(file.path, exclude)) {
				return false;
			}
			if (include.length > 0 && !pathMatchesFolders(file.path, include)) {
				return false;
			}
			return true;
		});

		let filesChanged = 0;
		let todosUnchecked = 0;

		for (const file of files) {
			const changed = await this.uncheckFile(file);
			if (changed.count > 0) {
				filesChanged += 1;
				todosUnchecked += changed.count;
			}
		}

		return { filesChanged, todosUnchecked };
	}

	private async uncheckFile(file: TFile): Promise<{ count: number }> {
		let count = 0;

		await this.app.vault.process(file, (data) => {
			const { updated, changedCount } = uncheckTodosInMarkdown(data);
			count = changedCount;
			return changedCount > 0 ? updated : data;
		});

		return { count };
	}

	private clearTimer(): void {
		if (this.timerId !== null) {
			window.clearTimeout(this.timerId);
			this.timerId = null;
		}
	}
}

export function localDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function msUntilNextReset(hour: number, minute: number): number {
	const now = new Date();
	const next = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hour,
		minute,
		0,
		0,
	);

	if (next.getTime() <= now.getTime()) {
		next.setDate(next.getDate() + 1);
	}

	return Math.max(1_000, next.getTime() - now.getTime());
}

export function hasReachedTodaysReset(hour: number, minute: number): boolean {
	const now = new Date();
	const todayReset = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		hour,
		minute,
		0,
		0,
	);
	return now.getTime() >= todayReset.getTime();
}
