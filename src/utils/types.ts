// Extended SerialPortFilter type based on Web Serial API specification
// Standard properties from the spec
export interface SerialPortFilter {
	usbVendorId?: number
	usbProductId?: number
	bluetoothServiceClassId?: string
}

// Extended properties for this implementation
export interface ExtendedSerialPortFilter extends SerialPortFilter {
	id?: string
	name?: string
	transport?: "NATIVE" | "USB" | "BLUETOOTH"
}

export type BackgroundRequest = {
	action:
		| "getNativeParams"
		| "getPorts"
		| "requestPort"
		| "listAvailablePorts"
		| "clearAuthKeyCache"
		| "extendPromise"
		| "resolvePromise"
		| "rejectPromise"
	// getPorts, requestPort, listAvailablePorts
	origin?: string
	options?: SerialPortRequestOptions
	// extendPromise, resolvePromise, rejectPromise
	id?: string
	timeoutMs?: number
	value?: any
	reason?: any
}

export type NativeRequest = {
	action?: "ping" | "listPorts" | "authGrant" | "authRevoke"
	id?: string
	port?: string
}

export type PopupRequest = {
	action?: "choosePort"
	// choosePort
	origin?: string
	options?: SerialPortRequestOptions
}

export type NativeParams = {
	state: "checking" | "not-installed" | "error" | "outdated" | "connected"
	platform?: browser.runtime.PlatformInfo
	error?: any
	version?: string
	protocol?: number
	wsPort?: number
}
