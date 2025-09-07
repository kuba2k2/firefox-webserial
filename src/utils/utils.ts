import { SerialPortData } from "../serial/types"
import { ExtendedSerialPortFilter, SerialPortFilter } from "./types"

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
/**
 * Validates a SerialPortFilter according to Web Serial API specification
 * @param filter The filter to validate
 * @throws TypeError if the filter is invalid
 */
export function validateSerialPortFilter(filter: SerialPortFilter): void {
	// Rule 1: Mutual exclusivity - Bluetooth and USB filters cannot be combined
	if (filter.bluetoothServiceClassId) {
		if (filter.usbVendorId !== undefined) {
			throw new TypeError(
				"Cannot specify both bluetoothServiceClassId and usbVendorId in the same filter"
			)
		}
		if (filter.usbProductId !== undefined) {
			throw new TypeError(
				"Cannot specify both bluetoothServiceClassId and usbProductId in the same filter"
			)
		}
		return // Bluetooth filter is valid if it has service class ID
	}

	// Rule 2: USB dependency - If usbProductId is specified, usbVendorId must also be specified
	if (filter.usbProductId !== undefined && filter.usbVendorId === undefined) {
		throw new TypeError(
			"usbVendorId is required when usbProductId is specified"
		)
	}

	// Rule 3: Empty filter validation - usbVendorId is required for USB filters
	if (
		filter.usbVendorId === undefined &&
		filter.usbProductId === undefined &&
		filter.bluetoothServiceClassId === undefined
	) {
		throw new TypeError(
			"Filter cannot be empty - at least one property must be specified"
		)
	}
}

/**
 * Validates an array of SerialPortFilters
 * @param filters Array of filters to validate
 * @throws TypeError if any filter is invalid
 */
export function validateSerialPortFilters(filters: SerialPortFilter[]): void {
	if (!filters || filters.length === 0) return

	for (const filter of filters) {
		validateSerialPortFilter(filter)
	}
}

export function checkPortMatch(
	port: SerialPortData,
	filter: ExtendedSerialPortFilter
): boolean {
	// Check USB vendor ID
	if (
		filter.usbVendorId !== undefined &&
		filter.usbVendorId !== port.usb?.vid
	) {
		return false
	}

	// Check USB product ID
	if (
		filter.usbProductId !== undefined &&
		filter.usbProductId !== port.usb?.pid
	) {
		return false
	}

	// Check Bluetooth service class ID
	// Note: The Web Serial API spec expects bluetoothServiceClassId to be a service class UUID,
	// but libserialport only provides device addresses. For now, we're comparing against the address
	// until proper Bluetooth service discovery is implemented in the native layer.
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
