import { choosePort, listPortsNative } from "./messaging"
import { getNativeParamsFromBackground } from "./messaging/native"
import {
	extendPromiseFromBackground,
	rejectPromiseFromBackground,
	resolvePromiseFromBackground,
} from "./messaging/promises"
import {
	clearPortAuthKeyCache,
	getPortAuthKey,
	readOriginAuth,
	writeOriginAuth,
} from "./utils/auth"
import { BackgroundRequest, ExtendedSerialPortFilter } from "./utils/types"
import { checkPortMatch, validateSerialPortFilters } from "./utils/utils"

console.clear()

class MessageHandler {
	/**
	 * Get native app state & parameters.
	 *
	 * ACCESS:
	 * - Page Script (via Content Script)
	 * - Popup Script
	 */
	async getNativeParams() {
		return await getNativeParamsFromBackground()
	}

	/**
	 * List authorized ports.
	 *
	 * ACCESS:
	 * - Page Script (via Content Script)
	 */
	async getPorts({ origin }: BackgroundRequest) {
		const originAuth = await readOriginAuth(origin)
		if (Object.keys(originAuth).length == 0) return []

		const ports = await listPortsNative()
		const authPorts = ports.filter((port) => port.id in originAuth)

		for (const port of authPorts) {
			port.isPaired = true
			port.authKey = await getPortAuthKey(port)
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
		// Validate filters according to Web Serial API specification
		if (options?.filters) {
			validateSerialPortFilters(options.filters)
		}

		const port = await choosePort(origin, options)
		await writeOriginAuth(origin, port)

		port.isPaired = true
		port.authKey = await getPortAuthKey(port)
		return port
	}

	/**
	 * List all available ports.
	 *
	 * ACCESS:
	 * - Popup Script
	 */
	async listAvailablePorts({ origin, options }: BackgroundRequest) {
		// Validate filters according to Web Serial API specification
		if (options?.filters) {
			validateSerialPortFilters(options.filters)
		}

		const originAuth = await readOriginAuth(origin)
		const nativePorts = await listPortsNative()

		const ports = nativePorts.filter((port) => {
			if (!options?.filters) return true

			return options.filters.some((filter: ExtendedSerialPortFilter) =>
				checkPortMatch(port, filter)
			)
		})

		for (const port of ports) {
			port.isPaired = port.id in originAuth
		}
		return ports
	}

	/**
	 * Clear local port authKey cache.
	 *
	 * ACCESS:
	 * - Background Script (via sendNative())
	 */
	async clearAuthKeyCache() {
		clearPortAuthKeyCache()
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

browser.runtime.getBackgroundPage().then((window) => {
	window.addEventListener("message", async (ev) => {
		const handler = new MessageHandler()
		const message: BackgroundRequest = ev.data
		return await handler[message.action](message)
	})
})
