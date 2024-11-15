import { expect, test, vi } from "vitest";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { newLixFile } from "./new-lix.js";
import type { DetectedChange, LixPlugin } from "../plugin/lix-plugin.js";

test("should use queue and settled correctly", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: async ({ before, after }) => {
			const textBefore = before
				? new TextDecoder().decode(before?.data)
				: undefined;
			const textAfter = after
				? new TextDecoder().decode(after.data)
				: undefined;

			if (textBefore === textAfter) {
				return [];
			}

			return [
				{
					schema: {
						key: "text",
						type: "json",
					},
					entity_id: "test",
					snapshot: textAfter ? { text: textAfter } : undefined,
				},
			];
		},
	};

	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.selectAll()
		.executeTakeFirstOrThrow();

	const enc = new TextEncoder();
	const dataInitial = enc.encode("insert text");
	await lix.db
		.insertInto("file")
		.values({ id: "test", path: "test.txt", data: dataInitial })
		.execute();

	const queue = await lix.db.selectFrom("change_queue").selectAll().execute();
	expect(queue).toEqual([
		{
			id: 1,
			file_id: "test",
			metadata: null,
			path: "test.txt",
			data_after: dataInitial,
			data_before: null,
		},
	]);
	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	// TODO QUEUE check if the replacement of file_internal was expected
	const internalFilesAfter = await lix.db
		.selectFrom("file")
		.selectAll()
		.execute();

	expect(internalFilesAfter).toEqual([
		{
			data: internalFilesAfter[0]?.data,
			id: "test",
			path: "test.txt",
			metadata: null,
			skip_change_extraction: null,
		},
	]);

	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	expect(changes).toEqual([
		expect.objectContaining({
			entity_id: "test",
			schema_key: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			content: {
				text: "insert text",
			},
		}),
	]);

	const dataUpdate1 = enc.encode("updated text");
	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate1 })
		.where("id", "=", "test")
		.execute();

	const beforeQueueTick = await lix.db
		.selectFrom("change_queue")
		.selectAll()
		.execute();

	expect(beforeQueueTick.length).toBe(1);

	const afterQueueTick = await lix.db
		.selectFrom("change_queue")
		.selectAll()
		.execute();
	expect(afterQueueTick.length).toBe(0);

	const dataUpdate1Again = dataUpdate1;
	// re apply same change
	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate1Again })
		.where("id", "=", "test")
		.execute();

	const dataUpdate2 = enc.encode("seond text update");
	await lix.db
		.updateTable("file")
		.set({ data: dataUpdate2 })
		.where("id", "=", "test")
		.execute();

	const queue2 = await lix.db.selectFrom("change_queue").selectAll().execute();
	expect(queue2).toEqual([
		{
			id: 3,
			file_id: "test",
			path: "test.txt",
			metadata: null,
			data_before: dataUpdate1,
			data_after: dataUpdate1Again,
		},
		{
			id: 4,
			file_id: "test",
			path: "test.txt",
			metadata: null,
			data_before: dataUpdate1Again,
			data_after: dataUpdate2,
		},
	]);

	await lix.settled();

	expect(
		(await lix.db.selectFrom("change_queue").selectAll().execute()).length,
	).toBe(0);

	const updatedChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	const updatedEdges = await lix.db
		.selectFrom("change_graph_edge")
		.selectAll()
		.execute();

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.execute();

	expect(updatedChanges).toEqual([
		expect.objectContaining({
			entity_id: "test",
			schema_key: "text",
			file_id: "test",
			plugin_key: "mock-plugin",
			content: {
				text: "insert text",
			},
		}),
		expect.objectContaining({
			entity_id: "test",
			file_id: "test",
			plugin_key: "mock-plugin",
			schema_key: "text",
			content: {
				text: "updated text",
			},
		}),
		expect.objectContaining({
			file_id: "test",
			entity_id: "test",
			plugin_key: "mock-plugin",
			schema_key: "text",
			content: {
				text: "seond text update",
			},
		}),
	]);

	expect(updatedEdges).toEqual([
		// 0 is the parent of 1
		// 1 is the parent of 2
		{ parent_id: updatedChanges[0]?.id, child_id: updatedChanges[1]?.id },
		{ parent_id: updatedChanges[1]?.id, child_id: updatedChanges[2]?.id },
	]);

	// the branch change pointers points to the last change
	expect(branchChangePointers).toEqual([
		expect.objectContaining({
			branch_id: currentBranch.id,
			change_id: updatedChanges[2]?.id,
		}),
	]);
});

test.todo("changes should contain the author", async () => {
	const mockPlugin: LixPlugin = {
		key: "mock-plugin",
		detectChangesGlob: "*",
		detectChanges: vi.fn().mockResolvedValue([
			{
				schema: {
					key: "mock",
					type: "json",
				},
				entity_id: "mock",
				snapshot: {
					text: "value1",
				},
			},
			{
				schema: {
					key: "mock",
					type: "json",
				},
				entity_id: "mock",
				snapshot: {
					text: "value2",
				},
			},
		] satisfies DetectedChange[]),
	};
	const lix = await openLixInMemory({
		blob: await newLixFile(),
		providePlugins: [mockPlugin],
	});

	// testing an insert

	await lix.db
		.insertInto("file")
		.values({
			id: "mock",
			data: new Uint8Array(),
			path: "/mock-file.json",
		})
		.execute();

	await lix.settled();

	// const changes1 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes1[0]?.author).toBe("some-id");

	// testing an update

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await lix.settled();

	// const changes2 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes2[1]?.author).toBe("some-id");

	await lix.db
		.updateTable("file")
		.set({
			data: new Uint8Array(),
		})
		.where("id", "=", "mock")
		.execute();

	await lix.settled();

	// const changes3 = await lix.db.selectFrom("change").selectAll().execute();

	// expect(changes3.at(-1)?.author).toBe("some-other-id");
});
