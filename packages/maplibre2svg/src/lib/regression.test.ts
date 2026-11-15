/// <reference types="vite/client" />
/**
 * Snapshots of the SVG which every story draws, so that a change of the code which changes the
 * output shows. The stories are run with their render helpers replaced by recorders, and their
 * legends drawn here without the network: images, glyphs, text widths and image encoding are
 * deterministic stand-ins.
 */
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { encodeGlyphs, fixtureGlyph } from './assets/glyphs/fixture';
import { createLayerLegend, createLegendCache, legendToSvg, type LegendImage } from './index';

interface Recorded {
	layers: LayerSpecification[];
	args: Record<string, unknown>;
	setup: { options?: unknown; style?: Partial<StyleSpecification> };
}

const recorded: Recorded[] = [];

vi.mock('../stories/utils/render/index.ts', async (importOriginal) => {
	const original = await importOriginal<Record<string, unknown>>();
	const record = (layers: LayerSpecification[], args: unknown, setup: unknown = {}) => {
		recorded.push({
			layers,
			args: args as Recorded['args'],
			setup: setup as Recorded['setup']
		});
		return document.createElement('div');
	};
	return {
		...original,
		renderLegend: (layer: LayerSpecification, args: unknown, setup?: unknown) =>
			record([layer], args, setup),
		renderLayers: (layers: LayerSpecification[], args: unknown, setup?: unknown) =>
			record(layers, args, setup)
	};
});

/** An image of 6 × 4 pixels whose colors come from its id; ids with `sdf` are SDF icons */
function syntheticImage(id: string): LegendImage {
	let hash = 2166136261;
	for (const ch of id) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
	const [width, height] = [6, 4];
	const data = new Uint8ClampedArray(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		data.set(
			[(hash >> 16) & 255, (hash >> 8) & 255, (hash + i * 7) & 255, i % 3 ? 255 : 128],
			i * 4
		);
	}
	return { data, width, height, pixelRatio: 1, sdf: id.includes('sdf') };
}

const IMAGE_IDS = ['hatch', 'airport_11', 'railway_11', 'circle-sdf', 'marker_15'];

const images = {
	getImage: (id: string) => syntheticImage(id),
	listImages: () => IMAGE_IDS
};

vi.mock('../stories/utils/sprite.ts', async (importOriginal) => {
	const original = await importOriginal<Record<string, unknown>>();
	const fake = {
		getImage: (id: string) => syntheticImage(id),
		listImages: () => IMAGE_IDS
	};
	return {
		...original,
		storyImages: () => Promise.resolve(fake),
		withImages: () => ({ options: Promise.resolve(fake) }),
		loadStyle: () => Promise.reject(new Error('no network in tests'))
	};
});

/** Names an image by its size and a hash of all its pixels */
function encode(rgba: Uint8ClampedArray, width: number, height: number) {
	let hash = 2166136261;
	for (const byte of rgba) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
	return `data:image/x-test,${width}x${height}/${hash.toString(16)}`;
}

/** A glyph PBF with a glyph for every code point of the range in the URL */
async function fetchGlyphs(url: string): Promise<ArrayBuffer> {
	const match = /(\d+)-(\d+)\.pbf/.exec(url);
	const start = match ? Number(match[1]) : 0;
	const glyphs = [];
	for (let id = start; id < start + 256; id++) {
		glyphs.push(fixtureGlyph(id, { width: 3 + (id % 4), height: 5 + (id % 3) }, 40 + (id % 200)));
	}
	const bytes = encodeGlyphs(glyphs);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const measureText = (text: string, font: string) => {
	const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 12);
	return text.length * size * 0.55;
};

/** Ids made unique per page, numbered in order of appearance instead */
function normalizeIds(svg: string) {
	const ids = new Map<string, string>();
	return svg.replace(/m2s-[a-z0-9]+-([a-z-]+)-\d+/g, (id, prefix: string) => {
		if (!ids.has(id)) ids.set(id, `m2s-${prefix}-${ids.size + 1}`);
		return ids.get(id) as string;
	});
}

const stories = import.meta.glob<Record<string, unknown>>('../stories/**/*.stories.ts', {
	eager: true
});

/** Stories which load a real style: they need the network */
const SKIPPED_TITLES = new Set(['Example Maplibre Style']);

interface Story {
	name?: string;
	args?: Record<string, unknown>;
	render?: (args: Record<string, unknown>) => unknown;
}

function collect() {
	const cases: { name: string; record: Recorded }[] = [];
	for (const [file, mod] of Object.entries(stories)) {
		const meta = mod.default as { title: string; args?: Record<string, unknown> };
		if (SKIPPED_TITLES.has(meta.title)) continue;
		for (const [exportName, value] of Object.entries(mod)) {
			const story = value as Story | undefined;
			if (exportName === 'default' || !story || typeof story.render !== 'function') continue;
			const before = recorded.length;
			story.render({ ...meta.args, ...story.args });
			recorded.slice(before).forEach((record, i) => {
				cases.push({ name: `${meta.title} / ${exportName} #${i} (${file})`, record });
			});
		}
	}
	return cases;
}

describe('the SVG of every story', () => {
	const cases = collect();

	it('finds the stories', () => {
		expect(cases.length).toBeGreaterThan(50);
	});

	it.each(cases)('$name', async ({ record }) => {
		const extra = (await Promise.resolve(record.setup.options ?? {})) as Record<string, unknown>;
		const style: StyleSpecification = {
			version: 8,
			sources: {},
			...record.setup.style,
			layers: record.layers
		};
		const options = {
			...images,
			...extra,
			getImage: images.getImage,
			listImages: images.listImages,
			zoom: record.args.zoom as number,
			defaultLabel: (record.args.defaultLabel as string) || 'Other',
			imageEncoder: encode,
			fetchGlyphs,
			measureText,
			loadImage: () => Promise.resolve(true),
			pixelRatio: 2,
			cache: createLegendCache()
		};
		const legends = await Promise.all(
			record.layers.map((layer) => createLayerLegend(layer, style, options))
		);
		const entries = legends.map((legend) => ({
			layerId: legend.layerId,
			type: legend.type,
			label: legend.label,
			entries: legend.entries.map((entry) => ({
				label: entry.label,
				kind: entry.kind,
				width: entry.width,
				height: entry.height,
				ramp: entry.ramp,
				svg: normalizeIds(entry.svg.outerHTML)
			}))
		}));
		const combined = normalizeIds(legendToSvg(legends, { measureText }).outerHTML);
		expect({ entries, combined }).toMatchSnapshot();
	});
});
