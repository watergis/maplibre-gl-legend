import { describe, expect, it } from 'vitest';
import { classSummary, testLayer } from '../test-utils';

const RED = 'rgba(255,0,0,1)';
const GREEN = 'rgba(0,255,0,1)';
const BLUE = 'rgba(0,0,255,1)';
const n = ['get', 'n'];

describe('classifyLayer: case with ranges', () => {
	it('finds a feature for the fallback of ranges on one field', () => {
		const fill = testLayer('fill', {
			'fill-color': [
				'case',
				['all', ['>=', n, 0], ['<', n, 10]],
				'#f00',
				['all', ['>=', n, 10], ['<', n, 100]],
				'#0f0',
				'#00f'
			]
		});
		const classes = classSummary(fill, 0, 'fill-color');
		expect(classes.map((c) => c.value)).toEqual([RED, GREEN, BLUE]);
		expect(classes[2]).toEqual({ kind: 'default', properties: { n: -1 }, value: BLUE });
	});

	it('substitutes a branch which an earlier condition shadows', () => {
		const fill = testLayer('fill', {
			'fill-color': ['case', ['<', n, 20], '#f00', ['<', n, 10], '#0f0', '#00f']
		});
		expect(classSummary(fill, 0, 'fill-color')).toEqual([
			{ kind: 'category', properties: { n: 19 }, value: RED },
			// no feature reaches `n < 10`: its output stands in for the node
			{ kind: 'category', properties: {}, value: GREEN },
			{ kind: 'default', properties: { n: 20 }, value: BLUE }
		]);
	});
});
