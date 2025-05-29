/// <reference path="../webserial.d.ts" />

import { SerialSink } from "./serial/sink"
import { SerialSource } from "./serial/source"
import { SerialOpcode, SerialPortData, SerialTransport } from "./serial/types"
import { SerialWebSocket } from "./serial/websocket"
import { pack } from "python-struct"
import { debugLog } from "./utils/logging"
import { catchIgnore } from "./utils/utils"

export class SerialPort extends EventTarget {
	onconnect: EventListener
	ondisconnect: EventListener

	private port_: SerialPortData
	private transport_: SerialTransport | null
	private readable_: ReadableStream<Uint8Array> | null
	private writable_: WritableStream<Uint8Array> | null

	private options_: SerialOptions | null
	private outputSignals_: SerialOutputSignals
	private inputSignals_: SerialInputSignals

	private onTransportDisconnectBound: () => void

	public constructor(port: SerialPortData) {
		super()
		this.port_ = port
		this.transport_ = null
		this.readable_ = null
		this.writable_ = null
		this.options_ = null
		this.outputSignals_ = {
			dataTerminalReady: false,
			requestToSend: false,
			break: false,
		}
		this.inputSignals_ = {
			dataCarrierDetect: false,
			clearToSend: false,
			ringIndicator: false,
			dataSetReady: false,
		}
		this.onTransportDisconnectBound = this.onTransportDisconnect.bind(this)
	}

	private get state_(): "closed" | "opening" | "opened" {
		if (this.transport_ === null) return "closed"
		if (this.transport_.connected !== true) return "opening"
		return "opened"
	}

	public get readable(): ReadableStream<Uint8Array> {
		if (this.readable_ !== null) return this.readable_
		if (this.state_ !== "opened") return null
		this.readable_ = new ReadableStream<Uint8Array>(
			new SerialSource(this.transport_, () => {
				this.readable_ = null
			}),
			{
				highWaterMark: this.options_?.bufferSize ?? 255,
			}
		)
		return this.readable_
	}

	public get writable(): WritableStream<Uint8Array> {
		if (this.writable_ !== null) return this.writable_
		if (this.state_ !== "opened") return null
		this.writable_ = new WritableStream<Uint8Array>(
			new SerialSink(this.transport_, () => {
				this.writable_ = null
			}),
			new ByteLengthQueuingStrategy({
				highWaterMark: this.options_?.bufferSize ?? 255,
			})
		)
		return this.writable_
	}

	public getInfo(): SerialPortInfo {
		const info: SerialPortInfo = {}
		if (this.port_.transport == "USB") {
			info.usbVendorId = this.port_.usb?.vid
			info.usbProductId = this.port_.usb?.pid
		}
		return info
	}

	public async open(options: SerialOptions): Promise<void> {
		debugLog(
			"SERIAL",
			"open",
			"options:",
			options,
			"transport:",
			this.transport_
		)
		if (this.transport_ !== null && this.transport_.connected)
			throw new DOMException(
				"The port is already open.",
				"InvalidStateError"
			)
		if (
			options.dataBits !== undefined &&
			![7, 8].includes(options.dataBits)
		)
			throw new TypeError("Requested number of data bits must be 7 or 8.")
		if (
			options.stopBits !== undefined &&
			![1, 2].includes(options.stopBits)
		)
			throw new TypeError("Requested number of stop bits must be 1 or 2.")
		if (options.bufferSize !== undefined && options.bufferSize <= 0)
			throw new TypeError(
				`Requested buffer size (${options.bufferSize} bytes) must be greater than zero.`
			)

		// close the socket if it's open somehow
		if (this.transport_ !== null) await catchIgnore(this.close())

		// assume 8-N-1 as defaults
		if (options.dataBits === undefined) options.dataBits = 8
		if (options.parity === undefined) options.parity = "none"
		if (options.stopBits === undefined) options.stopBits = 1

		try {
			// connect & open the port
			this.options_ = options
			this.transport_ = new SerialWebSocket()
			this.transport_.addEventListener(
				"disconnect",
				this.onTransportDisconnectBound
			)
			await this.transport_.connect()
			await this.transport_.send(
				pack(`<B${this.port_.authKey.length + 1}s`, [
					SerialOpcode.WSM_PORT_OPEN,
					this.port_.authKey,
				])
			)

			// configure port options
			await this.transport_.send(
				pack("<BIBBB", [
					SerialOpcode.WSM_SET_CONFIG,
					options.baudRate,
					options.dataBits,
					options.parity === "even"
						? 2
						: options.parity === "odd"
						? 1
						: 0,
					options.stopBits,
				])
			)

			// indicate that the client is ready
			await this.setSignals({ dataTerminalReady: true })
		} catch (e) {
			// close upon errors during opening, then throw the error
			await catchIgnore(this.close())
			throw e
		}
	}

	private async onTransportDisconnect(): Promise<void> {
		if (this.transport_ !== null) await catchIgnore(this.close())
	}

	public async close(): Promise<void> {
		debugLog("SERIAL", "close", "transport:", this.transport_)
		if (this.transport_ === null)
			throw new DOMException(
				"The port is already closed.",
				"InvalidStateError"
			)

		const promises = []
		if (this.readable_) promises.push(this.readable_.cancel())
		if (this.writable_) promises.push(this.writable_.abort())
		await Promise.all(promises)
		this.readable_ = null
		this.writable_ = null

		// indicate that the client is not ready
		await catchIgnore(
			this.setSignals({
				dataTerminalReady: false,
				requestToSend: false,
			})
		)

		// close & disconnect the port
		await catchIgnore(
			this.transport_.send(pack("<B", [SerialOpcode.WSM_PORT_CLOSE]))
		)

		// remove ondisconnect listener, as it would call close() again
		this.transport_.removeEventListener(
			"disconnect",
			this.onTransportDisconnectBound
		)

		debugLog("SERIAL", "close", "Disconnecting transport...")
		await this.transport_.disconnect()
		debugLog("SERIAL", "close", "Disconnected transport")
		this.transport_ = null
		this.options_ = null
	}

	public async setSignals(signals: SerialOutputSignals): Promise<void> {
		const {
			dataTerminalReady: oldDTR,
			requestToSend: oldRTS,
			break: oldBRK,
		} = this.outputSignals_
		const {
			dataTerminalReady: newDTR,
			requestToSend: newRTS,
			break: newBRK,
		} = signals

		if (
			(newDTR !== undefined && oldDTR !== newDTR) ||
			(newRTS !== undefined && oldRTS !== newRTS)
		) {
			debugLog(
				"SERIAL",
				"signals",
				`DTR: ${newDTR ?? oldDTR}, RTS: ${newRTS ?? oldRTS}`
			)
			await this.transport_.send(
				pack("<BBB", [
					SerialOpcode.WSM_SET_SIGNALS,
					newDTR ?? oldDTR,
					newRTS ?? oldRTS,
				])
			)
		}
		if (newBRK !== undefined && oldBRK !== newBRK) {
			await this.transport_.send(
				pack("<B", [
					newBRK ?? oldBRK
						? SerialOpcode.WSM_START_BREAK
						: SerialOpcode.WSM_END_BREAK,
				])
			)
		}

		this.outputSignals_ = { ...this.outputSignals_, ...signals }
	}

	public async getSignals(): Promise<SerialInputSignals> {
		return this.inputSignals_
	}

	public async forget(): Promise<void> {
		console.log("Not implemented")
	}
}

class Serial extends EventTarget {
	onconnect: EventListener
	ondisconnect: EventListener

	private async translateError<T>(promise: Promise<T>): Promise<T> {
		try {
			return await promise
		} catch (e) {
			const message = (e as Error).message
			let name = "WebSerialError"
			switch (message) {
				case "No port selected by the user.":
					name = "NotFoundError"
					break
			}
			throw new DOMException(message, name)
		}
	}

	async getPorts(): Promise<SerialPort[]> {
		const ports = await this.translateError(WebSerialPolyfill.getPorts())
		return ports.map((port) => new SerialPort(port))
	}

	async requestPort(options?: SerialPortRequestOptions): Promise<SerialPort> {
		const port = await this.translateError(
			WebSerialPolyfill.requestPort(options)
		)
		return new SerialPort(port)
	}
}

// @ts-ignore
navigator.serial = new Serial()
