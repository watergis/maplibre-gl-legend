/**
 * A minimal reader of protocol buffers: enough for the glyph PBF (varints, zigzag varints and
 * length-delimited fields), so that no dependency is needed
 */
export class PbfReader {
	pos = 0;
	readonly end: number;

	constructor(readonly buf: Uint8Array) {
		this.end = buf.length;
	}

	get done() {
		return this.pos >= this.end;
	}

	readVarint(): number {
		let result = 0;
		let factor = 1;
		for (let i = 0; i < 10; i++) {
			if (this.pos >= this.end) throw new Error('pbf: truncated varint');
			const byte = this.buf[this.pos++];
			result += (byte & 0x7f) * factor;
			if (byte < 0x80) return result;
			factor *= 128;
		}
		throw new Error('pbf: varint too long');
	}

	/** a `sint32` / `sint64`, zigzag-encoded */
	readSVarint(): number {
		const n = this.readVarint();
		return n % 2 === 1 ? (n + 1) / -2 : n / 2;
	}

	readBytes(): Uint8Array {
		const length = this.readVarint();
		const start = this.pos;
		this.pos += length;
		if (this.pos > this.end) throw new Error('pbf: truncated bytes');
		return this.buf.subarray(start, this.pos);
	}

	/** the field number and wire type of the next field */
	readTag(): { field: number; type: number } {
		const tag = this.readVarint();
		return { field: Math.floor(tag / 8), type: tag % 8 };
	}

	skip(type: number) {
		if (type === 0) this.readVarint();
		else if (type === 2) this.readBytes();
		else if (type === 1) this.pos += 8;
		else if (type === 5) this.pos += 4;
		else throw new Error(`pbf: unknown wire type ${type}`);
	}
}
