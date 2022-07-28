export const appendedIfNotEmpty = (array: string[], append: string) =>
	append.length > 0 ? [...array, append] : array

export const extractNumbers = (str: string) =>
	Number(str.replace(/[^0-9\.]/g, ''))
