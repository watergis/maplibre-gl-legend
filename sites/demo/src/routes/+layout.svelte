<script lang="ts">
	import { resolve } from '$app/paths';
	import { siGithub, siX } from 'simple-icons';

	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import LightSwitch from '#lib/LightSwitch.svelte';
	import '../app.css';

	interface Props {
		data: PageData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	let year = new Date().getFullYear();
</script>

<svelte:head>
	<title>{data.metadata.title}</title>
	<meta property="og:site_name" content={data.metadata.description} />
	<meta property="og:type" content="article" />
	<meta name="description" content={data.metadata.description} />
	<meta property="og:description" content={data.metadata.description} />
	<meta name="twitter:description" content={data.metadata.description} />
	<meta property="og:title" content={data.metadata.title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.metadata.title} />
</svelte:head>

<div class="h-dvh grid grid-rows-[auto_1fr_auto]">
	<header class="sticky top-0 z-10">
		<AppBar>
			<AppBar.Toolbar class="grid-cols-[1fr_auto]">
				<AppBar.Headline class="min-w-0">
					<a
						href={resolve('/')}
						class="block truncate font-bold text-sm sm:text-base md:text-xl uppercase"
					>
						{data.metadata.title}
					</a>
				</AppBar.Headline>
				<AppBar.Trail>
					<nav class="flex justify-end gap-1">
						<LightSwitch />
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						{#each data.nav as link (link.href)}
							<a
								class="btn hover:preset-tonal px-1 md:px-2"
								href={link.href}
								target="_blank"
								title={link.icon}
								aria-label={link.icon}
							>
								<span class="block w-6 h-6 fill-current">
									{#if link.icon === 'github'}
										<!-- eslint-disable svelte/no-at-html-tags -->
										{@html siGithub.svg}
									{:else if link.icon === 'twitter' || link.icon === 'x'}
										<!-- eslint-disable svelte/no-at-html-tags -->
										{@html siX.svg}
									{/if}
								</span>
							</a>
						{/each}
					</nav>
				</AppBar.Trail>
			</AppBar.Toolbar>
		</AppBar>
	</header>

	<main class="w-screen overflow-y-auto">
		{@render children?.()}
	</main>

	<footer class="bg-surface-50 dark:bg-surface-900 p-4">
		<p class="text-center w-full">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				class="text-blue-800 dark:text-surface-50 visited:text-purple-800 dark:visited:text-error-400"
				href={data.metadata.contact}
				target="_blank"
			>
				©{year}
				{data.metadata.author}
			</a>
		</p>
	</footer>
</div>
