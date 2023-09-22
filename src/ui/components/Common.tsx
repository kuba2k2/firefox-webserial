import styled from "styled-components"
import { PopupRequest } from "../../utils/types"
import { Button } from "../controls/Button"

export type CommonProps = {
	resolve: (value: any) => void
	reject: (reason?: any) => void
} & PopupRequest

export const MessageContainer = styled.div`
	position: relative;
	min-height: 40px;
	padding-right: 56px;
`

export const ReloadButton = styled(Button)`
	position: absolute;
	top: 50%;
	right: 0;
	transform: translateY(-50%);
`

export const ButtonContainer = styled.div`
	display: flex;
	position: absolute;
	bottom: 12px;
	left: 12px;
	right: 12px;
`

export const ButtonSpacer = styled.span`
	margin-right: 12px;
`

export const ButtonMessage = styled.div`
	display: flex;
	flex-grow: 1;
	opacity: 0.5;
`
