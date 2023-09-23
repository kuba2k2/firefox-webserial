import React from "react"
import { createRoot } from "react-dom/client"
import { extendPromise, rejectPromise, resolvePromise } from "../messaging"
import { SerialPortData } from "../serial/types"
import { PopupRequest } from "../utils/types"
import { PortChooser } from "./pages/PortChooser"

async function renderAndWait<T>(
	component: any,
	message: PopupRequest
): Promise<T> {
	return await new Promise((resolve, reject) => {
		const element = React.createElement(component, {
			resolve,
			reject,
			...message,
		})
		const container = document.getElementById("root")
		const root = createRoot(container)
		root.render(element)
	})
}

class MessageHandler {
	async openPopup() {
		return null
	}

	async choosePort(message: PopupRequest) {
		return await renderAndWait<SerialPortData>(PortChooser, message)
	}
}

export async function startUI() {
	const handler = new MessageHandler()
	const url = new URL(location.href)

	if (url.searchParams.has("id") && url.searchParams.has("message")) {
		const id = url.searchParams.get("id")

		setInterval(async () => {
			await extendPromise(id, 5000)
		}, 2000)

		document.onblur = () => {
			window.close()
		}

		try {
			const message: PopupRequest = JSON.parse(
				atob(url.searchParams.get("message"))
			)
			const response = await handler[message.action](message)
			await resolvePromise(id, response)
		} catch (e) {
			await rejectPromise(id, e)
		}

		window.close()
	} else {
		await handler.openPopup()
	}
}
