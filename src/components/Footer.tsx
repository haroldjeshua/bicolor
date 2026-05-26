"use client";

import { GithubLogoIcon, XLogoIcon } from "@phosphor-icons/react";

export function Footer() {
	return (
		<footer className="bg-background fixed bottom-2 inset-x-0 z-40 pointer-events-none flex justify-center">
			<div className="border border-foreground/20 px-2 md:px-3 py-1.5 flex items-center justify-center md:justify-between gap-x-2 md:gap-x-4 gap-y-1 text-[10px] md:text-xs font-mono pointer-events-auto flex-wrap w-[95vw] md:w-auto max-w-max">
				<span className="text-foreground/40 whitespace-nowrap">
					&copy; 2026 &middot;{" "}
				</span>
				<span className="text-foreground/40 whitespace-nowrap">
					Built by{" "}
					<a
						href="https://harv.computer"
						target="_blank"
						rel="noopener noreferrer"
						className="text-foreground/60 hover:text-foreground transition-colors"
					>
						harv
					</a>{" "}
					in Bicol, &#127477;&#127469;
				</span>
				<span className="flex items-center gap-1.5">
					<a
						href="https://github.com/haroldjeshua/bicolor"
						target="_blank"
						rel="noopener noreferrer"
						className="text-foreground/60 hover:text-foreground transition-colors"
						aria-label="GitHub"
					>
						<GithubLogoIcon size={14} />
					</a>
					<a
						href="https://x.com/haroldjeshua"
						target="_blank"
						rel="noopener noreferrer"
						className="text-foreground/60 hover:text-foreground transition-colors"
						aria-label="X / Twitter"
					>
						<XLogoIcon size={14} />
					</a>
				</span>
			</div>
		</footer>
	);
}
