import { PopupRequest } from "../utils/types"

export type CommonProps = {
	resolve: (value: any) => void
	reject: (reason?: any) => void
} & PopupRequest
