import { SerialPortData } from "./src/serial/types";
import { NativeParams } from "./src/utils/types";

export { }

declare global {
	interface WebSerialPolyfill {
		getNativeParams: () => Promise<NativeParams>
		getPorts: () => Promise<SerialPortData[]>
		requestPort: (options?: SerialPortRequestOptions) => Promise<SerialPortData>
	}

	interface Window {
		WebSerialPolyfill: WebSerialPolyfill
		wrappedJSObject: Window
	}

	const WebSerialPolyfill: WebSerialPolyfill

	function cloneInto<T>(obj: T, target: object, options?: object): T
	function exportFunction<T>(obj: T, target: object): T
}
