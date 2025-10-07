import {suite} from "uvu";
import * as Assert from "uvu/assert";

import {Edit} from "../src/edit.js";
import {Keyer} from "../src/keyer.js";

const test = suite("Keyer");
test("keyAt/transform", () => {
	const keyer = new Keyer();

	const key1 = keyer.keyAt(0);
	const key2 = keyer.keyAt(3);
	const key3 = keyer.keyAt(6);
	const key4 = keyer.keyAt(9);

	const keys1 = new Map([
		[0, key1],
		[3, key2],
		[6, key3],
		[9, key4],
	]);

	Assert.equal(keyer.keys, keys1);
	// "01\n34\n 67\n90"
	//          ^
	// "01\n34\n\n67\n90"
	// Initial simulated text would be "01\n34\n67\n90" (based on positions 0,3,6,9)
	const edit = Edit.builder("01\n34\n67\n90")
		.retain(6)
		.insert("\n")
		.retain(4)
		.build();

	keyer.transform(edit);
	const keys2 = new Map([
		[0, key1],
		[3, key2],
		[7, key3],
		[10, key4],
	]);

	Assert.equal(keyer.keys, keys2);
	const key5 = keyer.keyAt(6);
	keys2.set(6, key5);

	Assert.equal(keyer.keys, keys2);
	// After previous transform and key5 addition, simulated text would be "01\n34\n\n67\n90"
	const edit1 = Edit.builder("01\n34\n\n67\n90")
		.retain(5)
		.delete(2)
		.retain(4)
		.build();

	keyer.transform(edit1);
	const keys3 = new Map([
		[0, key1],
		[3, key2],
		[8, key4],
	]);
	Assert.equal(keyer.keys, keys3);
});

test.run();
