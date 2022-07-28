import { BASE_CODES } from './constants'
import { appendedIfNotEmpty } from './utils'

import fetch from 'cross-fetch'
import { DateTime } from 'luxon'

type MealRow = {
	dinr_cal: string
	lunc: string
	sum_cal: string
	adspcfd: string
	adspcfd_cal: string
	dates: string
	lunc_cal: string
	brst: string
	dinr: string
	brst_cal: string
}

type OpenDataResponse = {
	[key: string]: {
		list_total_count: number
		row: MealRow[]
	}
}

type MealData = Record<
	'breakfast' | 'lunch' | 'dinner',
	{
		menu: string[]
		calories: string
	}
>
type DailyMealRecord = Record<string, MealData>
type MealCache = Record<typeof BASE_CODES[number], Record<string, MealData>>

const parseData = (rows: MealRow[]): DailyMealRecord =>
	rows.reduce(
		(acc, cur) => ({
			...acc,
			[cur.dates]: acc[cur.dates]
				? {
						breakfast: {
							menus: appendedIfNotEmpty(acc[cur.dates].breakfast.menus, cur.brst),
							calories: cur.brst_cal,
						},
						lunch: {
							menus: appendedIfNotEmpty(acc[cur.dates].lunch.menus, cur.lunc),
							calories: cur.lunc_cal,
						},
						dinner: {
							menus: appendedIfNotEmpty(acc[cur.dates].dinner.menus, cur.dinr),
							calories: cur.dinr_cal,
						},
				  }
				: {
						breakfast: {
							menus: appendedIfNotEmpty([], cur.brst),
							calories: cur.brst_cal,
						},
						lunch: {
							menus: appendedIfNotEmpty([], cur.lunc),
							calories: cur.lunc_cal,
						},
						dinner: {
							menus: appendedIfNotEmpty([], cur.dinr),
							calories: cur.dinr_cal,
						},
				  },
		}),
		{},
	)

export const cleanMenuName = (name: string) => name.replace(/\(\d\d\)/g, '')

export class MealFetcher {
	private authKey: string
	private cache: Map<typeof BASE_CODES[number] | string, Map<string, MealData>>

	constructor(authKey: string, cache?: Partial<MealCache>) {
		this.authKey = authKey
		this.cache = new Map(
			cache
				? Object.entries(cache).map(([baseCode, records]) => [
						baseCode,
						new Map(Object.entries(records)),
				  ])
				: [],
		)
	}

	private buildURL(
		baseCode: typeof BASE_CODES[number],
		start: number,
		end: number,
	) {
		if (!this.authKey) {
			throw new Error(
				'missing authKey: make sure that you initialized MealFetcher with an authKey',
			)
		}
		return `https://openapi.mnd.go.kr/${this.authKey}/json/DS_TB_MNDT_DATEBYMLSVC_${baseCode}/${start}/${end}`
	}

	private toFormattedDate(date: Date) {
		return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd')
	}

	async preloadMeal(
		baseCode: typeof BASE_CODES[number],
	): Promise<Map<string, MealData>> {
		const url = this.buildURL(baseCode, 0, 1)
		const estimate = await fetch(url)
		const estimateData = (await estimate.json()) as OpenDataResponse
		const { list_total_count } =
			estimateData[`DS_TB_MNDT_DATEBYMLSVC_${baseCode}`]
		const fullURL = this.buildURL(baseCode, 0, list_total_count)
		const full = await fetch(fullURL)
		const fullData = (await full.json()) as OpenDataResponse
		this.cache.set(
			baseCode,
			new Map(
				Object.entries(
					parseData(fullData[`DS_TB_MNDT_DATEBYMLSVC_${baseCode}`].row),
				),
			),
		)
		return this.cache.get(baseCode)
	}

	async getMeal(baseCode: typeof BASE_CODES[number], date: Date) {
		const formattedDate = this.toFormattedDate(date)
		if (this.cache.get(baseCode)?.has(formattedDate)) {
			return this.cache.get(baseCode).get(formattedDate)
		} else {
			const record = await this.preloadMeal(baseCode)
			const meal = record.get(formattedDate)
			if (!meal) {
				throw new Error(`Unable to find meal data for: ${baseCode} on ${date}`)
			}
			return meal
		}
	}

	exportCache(): MealCache {
		return Object.fromEntries(
			Array.from(this.cache.entries()).map(([baseCode, records]) => [
				baseCode,
				Object.fromEntries(Array.from(records.entries())),
			]),
		) as MealCache
	}
}
