type ModuleType = "SERIAL" | "NATIVE" | "SOCKET" | "STREAM"

// [log, rx, tx]
const colors: Record<ModuleType, [string, string, string]> = {
	SERIAL: ["#C62817", "#C62817", "#C62817"],
	NATIVE: ["", "#5BC0DE", "#F0AD4E"],
	SOCKET: ["#1ED760", "#5BC0DE", "#F0AD4E"],
	STREAM: ["#FE5A00", "", ""],
}

function getNow(): string {
	return new Date().toISOString().substring(11, 23)
}

function buf2hex(data: Uint8Array) {
	return [...data].map((x) => x.toString(16).padStart(2, "0")).join(" ")
}

function log(...args: any[]) {
	if ("wsdebug" in window) {
		console.log(...args)
	}
}

export function debugLog(module: ModuleType, type: string, ...message: any[]) {
	log(
		`%s / %c%s -- %s:`,
		getNow(),
		`color: ${colors[module][0]}; font-weight: bold`,
		module,
		type,
		...message
	)
}

export function debugRx(module: ModuleType, data: Uint8Array | object) {
	if (data instanceof Uint8Array) {
		log(
			`%s / %c%s -> RX(%3d):`,
			getNow(),
			`color: ${colors[module][1]}; font-weight: bold`,
			module,
			data.length,
			buf2hex(data)
		)
	} else {
		log(
			`%s / %c%s -> RX(obj):`,
			getNow(),
			`color: ${colors[module][1]}; font-weight: bold`,
			module,
			data
		)
	}
}

export function debugTx(module: ModuleType, data: Uint8Array | object) {
	if (data instanceof Uint8Array) {
		log(
			`%s / %c%s <- TX(%3d):`,
			getNow(),
			`color: ${colors[module][2]}; font-weight: bold`,
			module,
			data.length,
			buf2hex(data)
		)
	} else {
		log(
			`%s / %c%s <- TX(obj):`,
			getNow(),
			`color: ${colors[module][2]}; font-weight: bold`,
			module,
			data
		)
	}
}
