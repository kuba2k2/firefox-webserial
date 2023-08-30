export type SerialPortData = {
	id: string
	name: string
	description?: string
	transport: "NATIVE" | "USB" | "BLUETOOTH"
	usb?: {
		bus?: number
		address?: number
		vid?: number
		pid?: number
		manufacturer?: string
		product?: string
		serial?: string
	}
	bluetooth?: {
		address?: string
	}
	authKey?: string
	isPaired?: boolean
}

export type SerialPortAuth = {
	[key: string]: {
		name: string
		description?: string
	}
}

export interface SerialTransport extends EventTarget {
	connected: boolean
	sourceFeedData?: (data: Uint8Array) => void
	connect(): Promise<void>
	disconnect(): Promise<void>
	send(msg: Uint8Array): Promise<Uint8Array>
	sendData(data: Uint8Array): Promise<Uint8Array>
}

export enum SerialOpcode {
	WSM_OK = 0,
	WSM_PORT_OPEN = 10,
	WSM_PORT_CLOSE = 11,
	WSM_SET_CONFIG = 20,
	WSM_SET_SIGNALS = 30,
	WSM_GET_SIGNALS = 31,
	WSM_START_BREAK = 40,
	WSM_END_BREAK = 41,
	WSM_DATA = 50,
	WSM_DRAIN = 51,
	WSM_ERROR = 128,
	WSM_ERR_OPCODE = 129,
	WSM_ERR_AUTH = 130,
	WSM_ERR_IS_OPEN = 131,
	WSM_ERR_NOT_OPEN = 132,
}
