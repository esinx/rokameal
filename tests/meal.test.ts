import { config } from 'dotenv'

import { BASE_CODES, MealFetcher } from '../src'

config()

test('Loads meals successfully (today)', async () => {
	const mealFetcher = new MealFetcher(process.env.TESTING_KEY)
	const result = await mealFetcher.getMeal(BASE_CODES[0], new Date())
	expect(result).toHaveProperty('breakfast')
	expect(result).toHaveProperty('lunch')
	expect(result).toHaveProperty('dinner')
})

/* test(
	'Loads all meals successfully (today)',
	async () => {
		const mealFetcher = new MealFetcher(process.env.TESTING_KEY)
		const results = await Promise.all(
			BASE_CODES.map(async (code) => ({
				code,
				meal: await mealFetcher.getMeal(code, new Date()),
			})),
		)
		for (const result of results) {
			expect(result.meal).toHaveProperty('breakfast')
			expect(result.meal).toHaveProperty('lunch')
			expect(result.meal).toHaveProperty('dinner')
		}
	},
	10 * 60 * 1000,
) */

const parseHrtimeToSeconds = (hrtime) => hrtime[0] + hrtime[1] / 1e9

test('Loads meals successfully from cache and is faster (today)', async () => {
	const mealFetcher = new MealFetcher(process.env.TESTING_KEY)
	const startTime = process.hrtime()
	await mealFetcher.getMeal(BASE_CODES[0], new Date())
	const elapsed = parseHrtimeToSeconds(process.hrtime(startTime))
	const cache = mealFetcher.exportCache()
	const mealFetcher2 = new MealFetcher(process.env.TESTING_KEY, cache)
	const startTime2 = process.hrtime()
	await mealFetcher2.getMeal(BASE_CODES[0], new Date())
	const elapsed2 = parseHrtimeToSeconds(process.hrtime(startTime2))
	expect(elapsed2).toBeLessThan(elapsed)
	console.log(`cached data was ${elapsed - elapsed2}s faster`)
})
