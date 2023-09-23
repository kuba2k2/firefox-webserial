import { getNativeParams, getPorts, requestPort } from "./messaging"

// @ts-ignore
window.wrappedJSObject.navigator.serial = cloneInto({}, window.navigator, {})

document.addEventListener("readystatechange", () => {
	if (document.readyState == "interactive") {
		const script = document.createElement("script")
		script.src = browser.runtime.getURL("dist/webserial.polyfill.js")
		document.head.prepend(script)
	}
})

function wrapPromise<T>(promise: Promise<T>): Promise<T> {
	return new window.Promise(
		exportFunction((resolve, reject) => {
			promise
				.then((value) => {
					resolve(cloneInto(value, window))
				})
				.catch((reason) => {
					reject(cloneInto(reason, window))
				})
		}, window.wrappedJSObject)
	)
}

window.WebSerialPolyfill = {
	getNativeParams: () => {
		return wrapPromise(getNativeParams())
	},
	getPorts: () => {
		return wrapPromise(getPorts(window.location.origin))
	},
	requestPort: (options?: SerialPortRequestOptions) => {
		return wrapPromise(requestPort(window.location.origin, options))
	},
}

window.wrappedJSObject.WebSerialPolyfill = cloneInto(
	window.WebSerialPolyfill,
	window,
	{ cloneFunctions: true }
)
