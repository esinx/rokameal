export const appendedIfNotEmpty = (array: string[], append: string) =>
	append.length > 0 ? [...array, append] : array
