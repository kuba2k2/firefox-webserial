import { v4 } from "uuid"
import { clearAuthKeyCache, rejectPromise, resolvePromise } from "."
import { debugLog, debugRx, debugTx } from "../utils/logging"
import { NativeParams, NativeRequest } from "../utils/types"
import { catchIgnore } from "../utils/utils"
import { keepPromise } from "./promises"

const NATIVE_PROTOCOL = 2

let globalPort: browser.runtime.Port = undefined

type RawNativeResponse = {
	id?: string
	data?: any
	error?: number
}

let nativeParams: NativeParams = {
	state: "checking",
}

async function setNativeParams(params: NativeParams) {
	params.platform = nativeParams.platform
	nativeParams = params
	debugLog("NATIVE", "setNativeParams", params)
}

async function getNativePort(): Promise<browser.runtime.Port> {
	if (!nativeParams.platform) {
		nativeParams.platform = await browser.runtime.getPlatformInfo()
	}

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

	// update native params
	await setNativeParams({ state: "checking" })

	globalPort = await new Promise((resolve, reject) => {
		let isOutdated = false

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
					const error = `Native protocol incompatible: expected v${NATIVE_PROTOCOL}, found v${protocol}`
					debugLog("NATIVE", "onMessage", error)

					await setNativeParams({
						state: "outdated",
						version,
						protocol,
					})
					isOutdated = true
					newPort.disconnect()

					reject(new Error(error))
					return
				}
				const wsPort = message.data?.wsPort
				debugLog(
					"NATIVE",
					"onMessage",
					`Connection successful: native v${version} @ port ${wsPort}`
				)
				await setNativeParams({
					state: "connected",
					version,
					protocol,
					wsPort,
				})
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

		const onDisconnect = async (port: browser.runtime.Port) => {
			debugLog("NATIVE", "onDisconnect", "Disconnected:", port.error)
			if (isOutdated) return
			globalPort = null

			const error = `${port.error}`
			if (error.includes("No such native application"))
				await setNativeParams({
					state: "not-installed",
					error: port.error,
				})
			else await setNativeParams({ state: "error", error: port.error })

			reject(port.error)
		}
		if (newPort.error !== null) {
			onDisconnect(newPort)
		} else {
			newPort.onDisconnect.addListener(onDisconnect)
		}
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

export async function getNativeParamsFromBackground(): Promise<NativeParams> {
	// ignore errors, which are reflected in nativeParams instead
	await catchIgnore(getNativePort())
	return nativeParams
}
