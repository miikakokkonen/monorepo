import { expect, test } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { updateBranchPointers } from "./update-branch-pointers.js";

test("the branch pointer for a change should be updated", async () => {
	const lix = await openLixInMemory({});

	const mainBranch = await lix.db
		.selectFrom("branch")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-1",
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const branchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// the head of the change is change-1
	expect(branchChangePointers.length).toBe(1);
	expect(branchChangePointers[0]?.change_id).toBe("change-1");

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-2",
				type: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const updatedBranchChangePointers = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// the head of the change is updated to change-2
	expect(updatedBranchChangePointers.length).toBe(1);
	expect(updatedBranchChangePointers[0]?.change_id).toBe("change-2");

	await lix.db.transaction().execute(async (trx) => {
		const changes = await trx
			.insertInto("change")
			.values({
				id: "change-3",
				type: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			})
			.returningAll()
			.execute();

		await updateBranchPointers({
			lix: { db: trx },
			branch: mainBranch,
			changes,
		});
	});

	const updatedBranchChangePointers2 = await lix.db
		.selectFrom("branch_change_pointer")
		.selectAll()
		.where("branch_id", "=", mainBranch.id)
		.execute();

	// inserting a new entity should add a new change pointer
	// while not updating the old one
	expect(updatedBranchChangePointers2.length).toBe(2);
	expect(updatedBranchChangePointers2[0]?.change_id).toBe("change-2");
	expect(updatedBranchChangePointers2[1]?.change_id).toBe("change-3");
});
