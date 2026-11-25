import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Compile todos.ts to a temp CJS module with esbuild for a quick sanity check.
const esbuild = createRequire(import.meta.url)("esbuild");
const outfile = join(tmpdir(), `todos-test-${process.pid}.cjs`);

await esbuild.build({
	entryPoints: ["src/todos.ts"],
	bundle: true,
	format: "cjs",
	platform: "node",
	outfile,
	logLevel: "silent",
});

const {
	uncheckTodosInMarkdown,
	parseFolderList,
	pathMatchesFolders,
} = createRequire(import.meta.url)(outfile);

{
	const input = [
		"# Today",
		"- [x] Done",
		"- [ ] Open",
		"- [X] Also done",
		"  * [x] Nested",
		"1. [x] Numbered",
		"```",
		"- [x] In code",
		"```",
		"Text with [x] not a task",
	].join("\n");

	const { updated, changedCount } = uncheckTodosInMarkdown(input);
	assert.equal(changedCount, 4);
	assert.match(updated, /- \[ \] Done/);
	assert.match(updated, /- \[ \] Also done/);
	assert.match(updated, /\* \[ \] Nested/);
	assert.match(updated, /1\. \[ \] Numbered/);
	assert.match(updated, /- \[x\] In code/);
	assert.match(updated, /- \[ \] Open/);
}

{
	const folders = parseFolderList(" Daily \n\nTasks/\n");
	assert.deepEqual(folders, ["Daily", "Tasks"]);
	assert.equal(pathMatchesFolders("Daily/note.md", folders), true);
	assert.equal(pathMatchesFolders("Other/note.md", folders), false);
}

unlinkSync(outfile);
console.log("todos.test.mjs: ok");
