/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAtom } from "jotai";
import { projectAtom, selectedProjectPathAtom } from "./state.ts";
import { useMemo, useState } from "react";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import { loadProjectInMemory, newProject } from "@inlang/sdk2";
import {
	SlInput,
	SlButton,
	SlOption,
	SlSelect,
} from "@shoelace-style/shoelace/dist/react";
import { Link } from "react-router-dom";

export default function Layout(props: { children: React.ReactNode }) {
	return (
		<div className="p-6 space-y-4">
			<MenuBar />
			{props.children}
		</div>
	);
}

const MenuBar = () => {
	return (
		<>
			<div className="flex gap-2 mb-12">
				<CreateNewProject />
				<SelectProject />
				<SettingsButton />
			</div>
		</>
	);
};

const SelectProject = () => {
	const [selectedProjectPath, setSelectedProjectPath] = useAtom(
		selectedProjectPathAtom
	);
	const [, setProject] = useAtom(projectAtom);
	const [existingProjects, setExistingProjects] = useState<string[]>([]);

	const getProjects = async () => {
		const projects: string[] = [];
		const opfsRoot = await navigator.storage.getDirectory();
		// @ts-expect-error - TS doesn't know about the keys method
		for await (const name of opfsRoot.keys()) {
			if (name.endsWith(".inlang")) {
				projects.push(name);
			}
		}
		return projects;
	};

	// useEffect(() => {

	// 	getProjects().then((result) => {

	// 	})

	// 		poll({
	// 			every: 2000,
	// 			fn: async () => {
	// 				console.log("poll2")
	// 				const result: string[] = [];
	// 				const opfsRoot = await navigator.storage.getDirectory();
	// 				// @ts-expect-error - TS doesn't know about the keys method
	// 				for await (const name of opfsRoot.keys()) {
	// 					if (name.endsWith(".inlang")) {
	// 						result.push(name);
	// 					}
	// 				}
	// 				return result;
	// 			},
	// 			cb: (value) => {
	// 				console.log("Callback with value:", value);
	// 				setExistingProjects(value);
	// 			},
	// 		});

	// }, []);

	return (
		<>
			<SlSelect
				size="small"
				placeholder={
					selectedProjectPath ? selectedProjectPath : "Select project"
				}
				onSlChange={async (e: any) => {
					setSelectedProjectPath(e.target.value);
					const opfsRoot = await navigator.storage.getDirectory();
					const fileHandle = await opfsRoot.getFileHandle(e.target.value);
					const file = await fileHandle.getFile();
					const project = await loadProjectInMemory({ blob: file });
					setProject(project);
				}}
				onSlShow={async () => {
					const projects = await getProjects();
					setExistingProjects(projects);
				}}
			>
				{existingProjects.map((name) => (
					<SlOption key={name} value={name}>
						{name}
					</SlOption>
				))}
			</SlSelect>
		</>
	);
};

const CreateNewProject = () => {
	const [showDialog, setShowDialog] = useState(false);
	const [fileName, setFileName] = useState("");
	const [loading, setLoading] = useState(false);

	const isValid = useMemo(() => fileName.endsWith(".inlang"), [fileName]);

	const handleCreateNewProject = async () => {
		setLoading(true);
		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
		const writable = await fileHandle.createWritable();
		const file = await newProject();
		await writable.write(file);
		await writable.close();
		setLoading(false);
		setShowDialog(false);
	};

	return (
		<>
			<SlButton
				size="small"
				onClick={() => {
					setShowDialog(true);
				}}
			>
				Create new project
			</SlButton>
			<SlDialog
				label="Create new project"
				open={showDialog}
				onSlRequestClose={() => setShowDialog(false)}
			>
				<SlInput
					label="Filename"
					helpText="The file name must end with .inlang"
					placeholder="happy-elephant.inlang"
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onInput={(e: any) => setFileName(e.target.value)}
				></SlInput>
				<SlButton
					loading={loading}
					variant="primary"
					disabled={!isValid}
					slot="footer"
					onClick={handleCreateNewProject}
				>
					Create project
				</SlButton>
			</SlDialog>
		</>
	);
};

const SettingsButton = () => {
	// check if window.location.pathname === "/settings"
	const isSettingsPage = window.location.pathname === "/settings";

	return (
		<Link to={isSettingsPage ? "/" : "/settings"}>
			<SlButton
				slot="trigger"
				size="small"
				variant={isSettingsPage ? "primary" : "default"}
			>
				Settings
			</SlButton>
		</Link>
	);
};
