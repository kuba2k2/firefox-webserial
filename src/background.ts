import { authGrant, choosePort, listPortsNative } from "./messaging"
import {
	extendPromiseFromBackground,
	rejectPromiseFromBackground,
	resolvePromiseFromBackground,
} from "./messaging/promises"
import { SerialPortAuth, SerialPortData } from "./serial/types"
import { BackgroundRequest } from "./types"

async function getOriginAuth(origin: string): Promise<SerialPortAuth> {
	const { originAuth } = await browser.storage.local.get("originAuth")
	if (!originAuth || !originAuth[origin]) return {}
	return originAuth[origin]
}

async function grantOriginAuth(
	origin: string,
	port: SerialPortData
): Promise<void> {
	let { originAuth } = await browser.storage.local.get("originAuth")
	if (!originAuth) originAuth = {}
	if (!originAuth[origin]) originAuth[origin] = {}
	originAuth[origin][port.id] = {
		name: port.name,
		description: port.description,
	}
	await browser.storage.local.set({ originAuth })
}

const authKeyCache: { [key: string]: string } = {}

class MessageHandler {
	/**
	 * List authorized ports.
	 *
	 * ACCESS:
	 * - Page Script (via Content Script)
	 */
	async getPorts({ origin }: BackgroundRequest) {
		const originAuth = await getOriginAuth(origin)
		if (Object.keys(originAuth).length == 0) return []
		const ports = await listPortsNative()
		const authPorts = ports.filter((port) => port.id in originAuth)
		for (const port of authPorts) {
			port.isPaired = true
			if (port.id in authKeyCache) {
				port.authKey = authKeyCache[port.id]
			} else {
				port.authKey = await authGrant(port.name)
				authKeyCache[port.id] = port.authKey
			}
		}
		return authPorts
	}

	/**
	 * Request authorization for a single port.
	 *
	 * ACCESS:
	 * - Page Script (via Content Script)
	 */
	async requestPort({ origin, options }: BackgroundRequest) {
		const port = await choosePort(origin, options)
		await grantOriginAuth(origin, port)
		port.isPaired = true
		if (port.id in authKeyCache) {
			port.authKey = authKeyCache[port.id]
		} else {
			port.authKey = await authGrant(port.name)
			authKeyCache[port.id] = port.authKey
		}
		return port
	}

	/**
	 * List all available ports.
	 *
	 * ACCESS:
	 * - Popup Script
	 */
	async listAvailablePorts({ origin, options }: BackgroundRequest) {
		const originAuth = await getOriginAuth(origin)
		const ports = await listPortsNative()
		for (const port of ports) {
			port.isPaired = port.id in originAuth
		}
		return ports
	}

	/**
	 * ACCESS:
	 * - Popup Script
	 */
	async extendPromise({ id, timeoutMs }: BackgroundRequest) {
		extendPromiseFromBackground(id, timeoutMs)
	}
	async resolvePromise({ id, value }: BackgroundRequest) {
		resolvePromiseFromBackground(id, value)
	}
	async rejectPromise({ id, reason }: BackgroundRequest) {
		rejectPromiseFromBackground(id, reason)
	}
}

browser.runtime.onMessage.addListener(async (message: BackgroundRequest) => {
	const handler = new MessageHandler()
	return await handler[message.action](message)
})
