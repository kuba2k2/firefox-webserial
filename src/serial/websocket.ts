import { debugRx, debugTx } from "../utils/logging"
import { SerialOpcode, SerialTransport } from "./types"

export class SerialWebSocket implements SerialTransport {
	private ws_: WebSocket | null = null

	private promise_?: Promise<Uint8Array>
	private resolve_?: (value: Uint8Array) => void
	private reject_?: (reason?: any) => void

	ondata?: (data: Uint8Array) => void
	onclose?: () => void

	public get connected(): boolean {
		return this.ws_ !== null && this.ws_.readyState === WebSocket.OPEN
	}

	async connect(): Promise<void> {
		if (this.connected) await this.disconnect()
		await new Promise((resolve, reject) => {
			this.ws_ = new WebSocket("ws://localhost:23290")
			this.ws_.binaryType = "arraybuffer"
			this.ws_.onmessage = this.receive.bind(this)
			this.ws_.onopen = resolve
			this.ws_.onerror = reject
		})
	}

	async disconnect(): Promise<void> {
		this.ws_?.close()
		this.ws_ = null
		if (this.onclose) this.onclose()
		this.clearPromise()
	}

	private clearPromise() {
		this.promise_ = null
		this.resolve_ = null
		this.reject_ = null
	}

	private async receive(ev: MessageEvent<ArrayBuffer>) {
		const data = new Uint8Array(ev.data)
		debugRx("SOCKET", data)
		if (data[0] == SerialOpcode.WSM_DATA) {
			if (this.ondata) this.ondata(data.subarray(1))
			return
		}
		if (data[0] >= SerialOpcode.WSM_ERROR) {
			if (this.reject_) {
				const decoder = new TextDecoder()
				let message = `Native error ${data[0]}`
				switch (data[0]) {
					case SerialOpcode.WSM_ERR_OPCODE:
						message = "Invalid operation"
						break
					case SerialOpcode.WSM_ERR_AUTH:
						message = "Port not found (auth)"
						break
					case SerialOpcode.WSM_ERR_IS_OPEN:
						message = "Port is already open"
						break
					case SerialOpcode.WSM_ERR_NOT_OPEN:
						message = "Port is not open"
						break
					default:
						message =
							decoder.decode(data.subarray(1)) + ` (${data[0]})`
				}
				this.reject_(new Error(message))
			} else {
				await this.disconnect()
			}

			this.clearPromise()
			return
		}
		if (this.resolve_) this.resolve_(data)
		this.clearPromise()
	}

	async send(msg: Uint8Array): Promise<Uint8Array> {
		if (!this.connected) throw Error("Not connected")

		// await this.promise_
		this.promise_ = new Promise<Uint8Array>((resolve, reject) => {
			this.resolve_ = resolve
			this.reject_ = reject
			this.ws_.send(msg.buffer)
			debugTx("SOCKET", msg)
		})

		const timeout = setTimeout(() => {
			if (this.reject_) this.reject_(new Error("Timeout"))
			this.clearPromise()
		}, 1000)

		const response = await this.promise_
		clearTimeout(timeout)
		this.clearPromise()
		return response
	}

	async sendData(data: Uint8Array): Promise<Uint8Array> {
		const msg = new Uint8Array(data.length + 2)
		msg[0] = SerialOpcode.WSM_DATA
		msg[1] = 0
		msg.set(data, 2)
		return await this.send(msg)
	}
}
