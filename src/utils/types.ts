import { SerialPortData } from "../serial/types"

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

/**
 * Check if a port matches the given filter
 * @param port The serial port to check
 * @param filter The filter to match against
 * @returns true if the port matches the filter, false otherwise
 */
export function checkPortMatch(
	port: SerialPortData,
	filter: ExtendedSerialPortFilter
): boolean {
	// Check USB vendor ID
	if (filter.usbVendorId && filter.usbVendorId !== port.usb?.vid) {
		return false
	}

	// Check USB product ID
	if (filter.usbProductId && filter.usbProductId !== port.usb?.pid) {
		return false
	}

	// Check Bluetooth service class ID
	if (
		filter.bluetoothServiceClassId &&
		filter.bluetoothServiceClassId !== port.bluetooth?.address
	) {
		return false
	}

	// Check extended properties
	if (filter.id && filter.id !== port.id) {
		return false
	}

	if (filter.name && filter.name !== port.name) {
		return false
	}

	if (filter.transport && filter.transport !== port.transport) {
		return false
	}

	return true
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
