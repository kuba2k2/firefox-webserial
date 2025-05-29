import { debugLog } from "../utils/logging"
import { catchIgnore } from "../utils/utils"
import { SerialTransport } from "./types"

export class SerialSource implements UnderlyingSource<Uint8Array> {
	type: undefined
	controller: ReadableStreamController<Uint8Array> = null
	buffer: Uint8Array = null
	bufferUsed: number = 0
	wantData: boolean = false

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

		const bufferSize = controller.desiredSize
		this.buffer = new Uint8Array(bufferSize)
		this.bufferUsed = 0
		this.wantData = false

		this.transport_.sourceFeedData = (data) => {
			if (this.bufferUsed + data.length >= bufferSize) {
				// the buffer would overflow
				const newSize = bufferSize - this.bufferUsed
				const newData = data.slice(0, newSize)
				// cut from data whatever fits in the buffer
				data = data.slice(newSize)
				// write it at the end
				this.buffer.set(newData, this.bufferUsed)
				// reset the buffer usage
				this.bufferUsed = 0
				// pass the entire buffer to the controller
				controller.enqueue(new Uint8Array(this.buffer))
			}
			if (data.length > 0) {
				// the buffer will NOT overflow anymore, whatever's left in 'data' will fit
				this.buffer.set(data, this.bufferUsed)
				this.bufferUsed += data.length
				// if reader is waiting for data, enqueue it using pull()
				if (this.wantData) this.pull(controller)
			}
		}
	}

	pull(controller: ReadableStreamController<Uint8Array>) {
		if (this.bufferUsed == 0) {
			// nothing to read, but the reader is waiting for data
			this.wantData = true
			return
		}
		// consume the entire buffer
		const newData = this.buffer.slice(0, this.bufferUsed)
		this.bufferUsed = 0
		// enqueue after consume, since it may unblock and call pull()
		controller.enqueue(newData)
		this.wantData = false
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
