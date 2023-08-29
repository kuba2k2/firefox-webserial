import { PopupRequest } from "../types"

export type CommonProps = {
	resolve: (value: any) => void
	reject: (reason?: any) => void
} & PopupRequest
