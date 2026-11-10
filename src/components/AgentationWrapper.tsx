"use client";

import dynamic from "next/dynamic";

const Agentation = dynamic(
	() => import("agentation").then((mod) => mod.Agentation),
	{ ssr: false },
);

/**
 * Development-only annotation bridge. Renders the in-app marker tool and
 * forwards annotations to the local agentation-mcp server so Coding agents
 * can read them via agentation_get_pending / agentation_watch_annotations.
 */
export default function AgentationWrapper() {
	if (process.env.NODE_ENV !== "development") return null;

	return <Agentation endpoint="http://localhost:4747" />;
}
