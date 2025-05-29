import { rejectPromise } from "."
import { PopupRequest } from "../utils/types"
import { keepPromise } from "./promises"

const windows: { [key: number]: string } = {}

const onRemovedListener = async (windowId: number) => {
	if (!(windowId in windows)) return
	const id = windows[windowId]
	delete windows[windowId]
	await rejectPromise(id, new Error("No port selected by the user."))
}

export async function sendToPopup(message: PopupRequest): Promise<any> {
	const [id, promise]: [string, Promise<any>] = keepPromise()
	const url = new URL(browser.runtime.getURL("dist/index.html"))
	url.searchParams.set("id", id)
	url.searchParams.set("message", btoa(JSON.stringify(message)))

	const anchor = await browser.windows.getCurrent()
	const win = await browser.windows.create({
		url: [url.href],
		type: "popup",
		top: anchor.top,
		left: anchor.left,
		width: 400,
		height: 400,
		allowScriptsToClose: true,
	})

	windows[win.id] = id
	if (!browser.windows.onRemoved.hasListener(onRemovedListener))
		browser.windows.onRemoved.addListener(onRemovedListener)

	try {
		const response = await promise
		delete windows[win.id]
		return response
	} catch (e) {
		delete windows[win.id]
		throw e
	}
}
