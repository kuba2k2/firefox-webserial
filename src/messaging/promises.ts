import { v4 } from "uuid"

const promises: {
	[key: string]: [
		(value: unknown) => void,
		(reason?: any) => void,
		NodeJS.Timeout?
	]
} = {}

export function keepPromise<T>(timeoutMs: number = 5000): [string, Promise<T>] {
	const id = v4()
	const promise = new Promise<T>((resolve, reject) => {
		let timeout: NodeJS.Timeout
		if (timeoutMs != 0) {
			timeout = setTimeout(function () {
				resolvePromiseFromBackground(id, new Error("Timeout"))
			}, timeoutMs)
		}
		promises[id] = [resolve, reject, timeout]
	})
	return [id, promise]
}

export function extendPromiseFromBackground(id: string, timeoutMs: number) {
	if (!(id in promises)) {
		console.error("Promise id", id, "missing in extendPromise")
		return
	}
	const [_1, _2, timeout] = promises[id]
	if (!timeout) return
	clearTimeout(timeout)
	promises[id][2] = setTimeout(function () {
		resolvePromiseFromBackground(id, new Error("Timeout"))
	}, timeoutMs)
}

export function resolvePromiseFromBackground(id: string, value: any) {
	if (!(id in promises)) {
		console.error("Promise id", id, "missing in resolvePromise")
		return
	}
	const [resolve, _, timeout] = promises[id]
	resolve(value)
	clearTimeout(timeout)
	delete promises[id]
}

export function rejectPromiseFromBackground(id: string, reason?: any) {
	if (!(id in promises)) {
		console.error("Promise id", id, "missing in rejectPromise")
		return
	}
	const [_, reject, timeout] = promises[id]
	reject(reason)
	clearTimeout(timeout)
	delete promises[id]
}
