/// <reference path="../webserial.d.ts" />

import { SerialSink } from "./serial/sink"
import { SerialSource } from "./serial/source"
import { SerialOpcode, SerialPortData, SerialTransport } from "./serial/types"
import { SerialWebSocket } from "./serial/websocket"
import { pack } from "python-struct"

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
		try {
			await this.close()
		} catch {
			this
		}

		// assume 8-N-1 as defaults
		if (options.dataBits === undefined) options.dataBits = 8
		if (options.parity === undefined) options.parity = "none"
		if (options.stopBits === undefined) options.stopBits = 1

		try {
			// connect & open the port
			this.options_ = options
			this.transport_ = new SerialWebSocket()
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
			try {
				await this.close()
			} catch {
				this
			}
			throw e
		}
	}

	public async close(): Promise<void> {
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

		try {
			// indicate that the client is not ready
			await this.setSignals({
				dataTerminalReady: false,
				requestToSend: false,
			})

			// close & disconnect the port
			await this.transport_.send(
				pack("<B", [SerialOpcode.WSM_PORT_CLOSE])
			)
		} catch {
			this
		}
		await this.transport_.disconnect()
		this.transport_ = null
		this.options_ = null
	}

	public async setSignals(signals: SerialOutputSignals): Promise<void> {
		this.outputSignals_ = { ...this.outputSignals_, ...signals }
		if (
			signals.dataTerminalReady !== undefined ||
			signals.requestToSend !== undefined
		) {
			await this.transport_.send(
				pack("<BBB", [
					SerialOpcode.WSM_SET_SIGNALS,
					signals.dataTerminalReady,
					signals.requestToSend,
				])
			)
		}
		if (signals.break !== undefined) {
			await this.transport_.send(
				pack("<B", [
					signals.break
						? SerialOpcode.WSM_START_BREAK
						: SerialOpcode.WSM_END_BREAK,
				])
			)
		}
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

	async getPorts(): Promise<SerialPort[]> {
		const ports = await WebSerialPolyfill.getPorts()
		return ports.map((port) => new SerialPort(port))
	}

	async requestPort(options?: SerialPortRequestOptions): Promise<SerialPort> {
		const port = await WebSerialPolyfill.requestPort(options)
		return new SerialPort(port)
	}
}

// @ts-ignore
navigator.serial = new Serial()
