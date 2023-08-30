import { BackgroundRequest } from "../utils/types"

export async function sendToBackground(
	message: BackgroundRequest
): Promise<any> {
	return await browser.runtime.sendMessage(message)
}
