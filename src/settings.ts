import { App, PluginSettingTab, Setting, TextAreaComponent } from "obsidian";
import type MidnightTodoResetPlugin from "./main";

export interface MidnightTodoResetSettings {
	enabled: boolean;
	/** Local clock hour (0–23) when todos should reset. Default 0 = midnight. */
	resetHour: number;
	/** Local clock minute (0–59). Default 0. */
	resetMinute: number;
	/** If set, only notes under these vault-relative folder prefixes are touched (one per line). Empty = entire vault. */
	includeFolders: string;
	/** Vault-relative folder prefixes to skip (one per line). */
	excludeFolders: string;
	showNotice: boolean;
	/** ISO date string (YYYY-MM-DD) of the last successful reset for the configured reset time. */
	lastResetDate: string;
}

export const DEFAULT_SETTINGS: MidnightTodoResetSettings = {
	enabled: true,
	resetHour: 0,
	resetMinute: 0,
	includeFolders: "",
	excludeFolders: "",
	showNotice: true,
	lastResetDate: "",
};

export class MidnightTodoResetSettingTab extends PluginSettingTab {
	plugin: MidnightTodoResetPlugin;

	constructor(app: App, plugin: MidnightTodoResetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Midnight Todo Reset" });

		new Setting(containerEl)
			.setName("Enable automatic reset")
			.setDesc("Uncheck completed todos when the daily reset time is reached.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.reschedule();
				}),
			);

		new Setting(containerEl)
			.setName("Reset hour")
			.setDesc("Local hour (0–23). Default 0 is midnight.")
			.addSlider((slider) =>
				slider
					.setLimits(0, 23, 1)
					.setValue(this.plugin.settings.resetHour)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.resetHour = value;
						await this.plugin.saveSettings();
						this.plugin.reschedule();
					}),
			);

		new Setting(containerEl)
			.setName("Reset minute")
			.setDesc("Local minute (0–59).")
			.addSlider((slider) =>
				slider
					.setLimits(0, 59, 1)
					.setValue(this.plugin.settings.resetMinute)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.resetMinute = value;
						await this.plugin.saveSettings();
						this.plugin.reschedule();
					}),
			);

		new Setting(containerEl)
			.setName("Include folders")
			.setDesc(
				"Only reset todos in these folders (one vault-relative path per line). Leave empty to include the whole vault.",
			)
			.addTextArea((text: TextAreaComponent) => {
				text
					.setPlaceholder("Daily\nTasks")
					.setValue(this.plugin.settings.includeFolders)
					.onChange(async (value) => {
						this.plugin.settings.includeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
				text.inputEl.style.width = "100%";
			});

		new Setting(containerEl)
			.setName("Exclude folders")
			.setDesc("Skip these folders (one vault-relative path per line).")
			.addTextArea((text: TextAreaComponent) => {
				text
					.setPlaceholder("Archive\nTemplates")
					.setValue(this.plugin.settings.excludeFolders)
					.onChange(async (value) => {
						this.plugin.settings.excludeFolders = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 4;
				text.inputEl.style.width = "100%";
			});

		new Setting(containerEl)
			.setName("Show notice")
			.setDesc("Show a brief notice after each automatic or manual reset.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showNotice).onChange(async (value) => {
					this.plugin.settings.showNotice = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Reset todos now")
			.setDesc("Immediately uncheck completed todos in the configured folders.")
			.addButton((button) =>
				button.setButtonText("Run now").setCta().onClick(async () => {
					button.setDisabled(true);
					await this.plugin.runReset({ force: true, reason: "manual" });
					button.setDisabled(false);
				}),
			);

		const last = this.plugin.settings.lastResetDate || "never";
		containerEl.createEl("p", {
			text: `Last reset date: ${last}`,
			cls: "setting-item-description",
		});
	}
}
