import { debugLog } from "../utils/logging"
import { catchIgnore } from "../utils/utils"
import { SerialTransport } from "./types"

export class SerialSource implements UnderlyingSource<Uint8Array> {
	type: undefined
	controller: ReadableStreamController<Uint8Array> = null

	public constructor(
		private transport_: SerialTransport,
		private onClose_: () => void
	) {
		// @ts-ignore
		this.type = "bytes"
		this.onDisconnect = this.onDisconnect.bind(this)
		this.transport_.addEventListener("disconnect", this.onDisconnect)
	}

	onDisconnect() {
		debugLog("STREAM", "source", "onDisconnect()")
		this.cancel()
	}

	start(controller: ReadableStreamController<Uint8Array>) {
		debugLog("STREAM", "source", "start()")
		this.controller = controller
		this.transport_.sourceFeedData = (data) => {
			controller.enqueue(data)
		}
	}

	cancel(_reason?: any) {
		debugLog("STREAM", "source", "cancel()")
		catchIgnore(this.controller?.close)
		this.controller = null
		this.transport_.removeEventListener("disconnect", this.onDisconnect)
		this.transport_.sourceFeedData = null
		this.onClose_()
	}
}
