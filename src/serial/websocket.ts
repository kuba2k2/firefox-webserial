import { debugLog, debugRx, debugTx } from "../utils/logging"
import { SerialOpcode, SerialTransport } from "./types"

export class SerialWebSocket extends EventTarget implements SerialTransport {
	private ws_: WebSocket | null = null

	private promise_?: Promise<Uint8Array>
	private resolve_?: (value: Uint8Array) => void
	private reject_?: (reason?: any) => void

	sourceFeedData?: (data: Uint8Array) => void

	public get connected(): boolean {
		return this.ws_ !== null && this.ws_.readyState === WebSocket.OPEN
	}

	async connect(): Promise<void> {
		debugLog("SOCKET", "state", "Connecting socket")

		if (this.connected) await this.disconnect()

		const params = await WebSerialPolyfill.getNativeParams()
		if (params.state !== "connected")
			throw Error("Native application not connected")

		await new Promise((resolve, reject) => {
			this.ws_ = new WebSocket(`ws://localhost:${params.wsPort}`)
			this.ws_.binaryType = "arraybuffer"
			this.ws_.onmessage = this.receive.bind(this)
			this.ws_.onopen = resolve
			this.ws_.onerror = reject
		})

		debugLog("SOCKET", "state", "Connected socket")
		this.ws_.onerror = () => {
			debugLog("SOCKET", "state", "WS error")
			this.disconnect()
		}
		this.ws_.onclose = () => {
			debugLog("SOCKET", "state", "WS close")
			this.disconnect()
		}
	}

	async disconnect(): Promise<void> {
		if (this.reject_) this.reject_(new Error("Disconnecting"))
		this.dispatchEvent(new Event("disconnect"))
		if (this.ws_) {
			debugLog("SOCKET", "state", "Disconnecting socket...")
			// remove onclose and onerror listeners, as they would call disconnect() again
			this.ws_.onclose = null
			this.ws_.onerror = null
			this.ws_.close()
			this.ws_ = null
			debugLog("SOCKET", "state", "Disconnected socket")
		}
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
			if (this.sourceFeedData) this.sourceFeedData(data.subarray(1))
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
			if (this.reject_)
				this.reject_(new Error("Timeout waiting for native response"))
			this.clearPromise()
		}, 5000)

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
