import { debugLog, debugRx, debugTx } from "../utils/logging"
import { clearAuthKeyCache, rejectPromise, resolvePromise } from "."
import { NativeRequest } from "../utils/types"
import { keepPromise } from "./promises"
import { v4 } from "uuid"

const NATIVE_PROTOCOL = 1

let globalPort: browser.runtime.Port = undefined

type RawNativeResponse = {
	id?: string
	data?: any
	error?: number
}

async function getNativePort(): Promise<browser.runtime.Port> {
	if (globalPort != undefined && globalPort.error == null) return globalPort

	const newPort = browser.runtime.connectNative("io.github.kuba2k2.webserial")

	// clear local authKey cache, as the native app is starting fresh
	await clearAuthKeyCache()

	// post a ping message to check if the connection succeeds
	const pingRequest: NativeRequest = {
		action: "ping",
		id: v4(),
	}
	newPort.postMessage(pingRequest)

	globalPort = await new Promise((resolve, reject) => {
		newPort.onMessage.addListener(async (message: RawNativeResponse) => {
			if (!message.id) {
				if (message.data) debugRx("NATIVE", message.data)
				return
			}

			debugRx("NATIVE", message)

			if (message.id == pingRequest.id) {
				const version = message.data?.version
				const protocol = message.data?.protocol
				if (protocol !== NATIVE_PROTOCOL) {
					newPort.disconnect()
					const error = `Native protocol incompatible: expected v${NATIVE_PROTOCOL}, found v${protocol}`
					debugLog("NATIVE", "onMessage", error)
					reject(new Error(error))
					return
				}
				debugLog(
					"NATIVE",
					"onMessage",
					`Connection successful: native v${version}`
				)
				resolve(newPort)
				return
			}

			if (message.data !== undefined)
				await resolvePromise(message.id, message.data)

			if (message.error !== undefined)
				await rejectPromise(
					message.id,
					new Error(`Native error ${message.error}`)
				)
		})

		newPort.onDisconnect.addListener((port) => {
			debugLog("NATIVE", "onDisconnect", "Disconnected:", port.error)
			if (globalPort) {
				globalPort = null
				reject(port.error)
			}
		})
	})

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
