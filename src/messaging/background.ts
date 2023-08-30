import { BackgroundRequest } from "../utils/types"

export async function sendToBackground(
	message: BackgroundRequest
): Promise<any> {
	if (
		browser?.runtime?.getBackgroundPage &&
		window === (await browser.runtime.getBackgroundPage())
	)
		return window.postMessage(message)
	return await browser.runtime.sendMessage(message)
}
