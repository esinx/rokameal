# rokameal

> 박병장님 오늘 아침밥은 돈김볶에 계란국이지말입니다.

사실 대회 나가려다가 이게 없나...? 싶어서 만들었어요. 배치 작업에 최적화된 군-밥 라이브러리!

## Getting Started

> PREREQUISITE: https://opendata.mnd.go.kr/ 에서 API키를 먼저 받아주세요

```
yarn add rokameal
```

```typescript
import { MealFetcher } from 'rokameal'

const main = async () => {
	const mealFetcher = new MealFetcher(YOUR_API_KEY_HERE)
	const mealData = mealFetcher.getMeal('ATC', new Date()) // 육훈소
	console.log(`박병장님 오늘 아침메뉴는 ${meal.breakfast.join(', ')}입니다`)
}
```

## Features

- Written in 100% pure TypeScript
- Cache read/write using `Map`
- Export cache to disk using JSON
- Complete list of all `BASE_CODES`
