import { resizeArray } from "./utils";

describe("utils", () => {
	describe("resizeArray", () => {
		test("1", () => {
			expect(resizeArray([2, 4, 6, 8, 10], 2)).toEqual([4, 8]);
		});

		test("2", () => {
			expect(resizeArray([1, 2, 3, 4, 5, 6, 7], 1)).toEqual([4]);
		});

		test("3", () => {
			expect(resizeArray([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([2, 4, 6]);
		});

		test("4", () => {
			expect(
				resizeArray(
					[
						1,
						2,
						3,
						4,
						5,
						6,
						7,
						8,
						9,
						10,
						11,
						12,
						13,
						14,
						15,
						16,
						17,
						18,
						19,
						20,
					],
					5
				)
			).toEqual([4, 7, 10, 14, 17]);
		});

		test("5", () =>
			expect(resizeArray([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)).toEqual([
				3,
				7,
			]));

		test("6", () =>
			expect(resizeArray([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual([
				3,
				5,
				7,
			]));
	});
});
