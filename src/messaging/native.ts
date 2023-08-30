import { debugRx, debugTx } from "../utils/logging"
import { clearAuthKeyCache, rejectPromise, resolvePromise } from "."
import { NativeRequest } from "../utils/types"
import { keepPromise } from "./promises"

let globalPort: browser.runtime.Port = undefined

type RawNativeResponse = {
	id?: string
	data?: any
	error?: number
}

async function getNativePort(): Promise<browser.runtime.Port> {
	if (globalPort != undefined && globalPort.error == null) return globalPort

	const newPort = browser.runtime.connectNative("io.github.kuba2k2.webserial")
	if (newPort.error != null) throw newPort.error

	// clear local authKey cache, as the native app is starting fresh
	await clearAuthKeyCache()

	newPort.onMessage.addListener(async (message: RawNativeResponse) => {
		debugRx("NATIVE", message)
		if (!message.id) return
		if (message.data !== undefined)
			await resolvePromise(message.id, message.data)
		if (message.error !== undefined)
			await rejectPromise(
				message.id,
				new Error(`Native error ${message.error}`)
			)
	})
	newPort.onDisconnect.addListener(() => {
		globalPort = null
	})

	globalPort = newPort
	return globalPort
}

export async function sendToNative(message: NativeRequest): Promise<any> {
	const [id, promise]: [string, Promise<any>] = keepPromise()
	const port = await getNativePort()
	message.id = id
	debugTx("NATIVE", message)
	port.postMessage(message)
	return await promise
}
