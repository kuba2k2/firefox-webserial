import { SerialTransport } from "./types"

export class SerialSource implements UnderlyingSource<Uint8Array> {
	private transport_: SerialTransport
	private onError_: () => void

	type: undefined

	public constructor(transport: SerialTransport, onError: () => void) {
		this.transport_ = transport
		this.onError_ = onError
		// @ts-ignore
		this.type = "bytes"
	}

	start(controller: ReadableStreamController<Uint8Array>) {
		this.transport_.ondata = (data) => {
			controller.enqueue(data)
		}
		this.transport_.onclose = () => {
			controller.close()
			this.transport_.onclose = null
		}
	}

	cancel(_reason?: any) {
		this.transport_.ondata = null
		this.transport_.onclose = null
	}
}
