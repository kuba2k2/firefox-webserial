import { SerialTransport } from "./types"

export class SerialSink implements UnderlyingSink<Uint8Array> {
	private transport_: SerialTransport
	private onError_: () => void

	public constructor(transport: SerialTransport, onError: () => void) {
		this.transport_ = transport
		this.onError_ = onError
	}

	async write(
		chunk: Uint8Array,
		controller: WritableStreamDefaultController
	): Promise<void> {
		try {
			await this.transport_.sendData(chunk)
		} catch (e) {
			controller.error(e)
			this.onError_()
		}
	}
}
