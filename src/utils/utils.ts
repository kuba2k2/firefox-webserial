import { SerialPortData } from "../serial/types"
import { ExtendedSerialPortFilter } from "./types"

export async function catchIgnore<T>(
	promise: Promise<T> | (() => void)
): Promise<void> {
	try {
		await promise
	} catch {
		// ignore
	}
}

export function sleep(milliseconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})
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
