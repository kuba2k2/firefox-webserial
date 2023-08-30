export async function catchIgnore<T>(
	promise: Promise<T> | (() => void)
): Promise<void> {
	try {
		await promise
	} catch {
		// ignore
	}
}
