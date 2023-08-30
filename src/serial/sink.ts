import { debugLog } from "../utils/logging"
import { catchIgnore } from "../utils/utils"
import { SerialTransport } from "./types"

export class SerialSink implements UnderlyingSink<Uint8Array> {
	controller: WritableStreamDefaultController = null

	public constructor(
		private transport_: SerialTransport,
		private onClose_: () => void
	) {
		debugLog("STREAM", "sink", "CONSTRUCTOR")
		this.onDisconnect = this.onDisconnect.bind(this)
		this.transport_.addEventListener("disconnect", this.onDisconnect)
	}

	onDisconnect() {
		debugLog("STREAM", "sink", "onDisconnect()")
		catchIgnore(this.controller?.error)
		this.controller = null
		this.close()
	}

	start(controller: WritableStreamDefaultController) {
		debugLog("STREAM", "sink", "start()")
		this.controller = controller
	}

	async write(
		chunk: Uint8Array,
		controller: WritableStreamDefaultController
	): Promise<void> {
		try {
			await this.transport_.sendData(chunk)
		} catch (e) {
			debugLog("STREAM", "sink", "write() ERROR", e)
			controller.error(e)
			this.onClose_()
		}
	}

	close() {
		debugLog("STREAM", "sink", "close()")
		this.transport_.removeEventListener("disconnect", this.onDisconnect)
		this.onClose_()
	}

	abort() {
		debugLog("STREAM", "sink", "abort()")
		this.close()
	}
}
