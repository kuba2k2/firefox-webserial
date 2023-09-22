export async function catchIgnore<T>(
	promise: Promise<T> | (() => void)
): Promise<void> {
	try {
		await promise
	} catch {
		// ignore
	}
}

export function sleep(milliseconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})
}
