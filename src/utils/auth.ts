import { authGrant } from "../messaging"
import { SerialPortAuth, SerialPortData } from "../serial/types"

let authKeyCache: { [key: string]: string } = {}

export async function readOriginAuth(origin: string): Promise<SerialPortAuth> {
	const { originAuth } = await browser.storage.local.get("originAuth")
	if (!originAuth || !originAuth[origin]) return {}
	return originAuth[origin]
}

export async function writeOriginAuth(
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

export async function getPortAuthKey(port: SerialPortData): Promise<string> {
	if (port.id in authKeyCache) {
		return authKeyCache[port.id]
	} else {
		const authKey = await authGrant(port.name)
		authKeyCache[port.id] = authKey
		return authKey
	}
}

export function clearPortAuthKeyCache(): void {
	authKeyCache = {}
}
