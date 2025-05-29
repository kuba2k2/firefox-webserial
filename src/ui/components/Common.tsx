import styled from "styled-components"
import { PopupRequest } from "../../utils/types"
import { Button } from "../controls/Button"

export type CommonProps = {
	resolve: (value: any) => void
	reject: (reason?: any) => void
} & PopupRequest

export const MainContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
`

export const MessageContainer = styled.div`
	flex: 0 0 auto;
	margin: 0 12px;
	position: relative;
	min-height: 40px;
	padding-right: 56px;
`

export const MessageDivider = styled.hr`
	height: 2px;
	margin: 8px 12px 0;
`

export const ListContainer = styled.div`
	flex: 1 1 auto;
	overflow: auto;
	padding: 8px 12px;
`

export const ReloadButton = styled(Button)`
	position: absolute;
	top: 50%;
	right: 0;
	transform: translateY(-50%);
`

export const ButtonContainer = styled.div`
	display: flex;
	padding: 12px;
`

export const ButtonSpacer = styled.span`
	margin-right: 12px;
`

export const ButtonMessage = styled.div`
	display: flex;
	flex-grow: 1;
	opacity: 0.5;
`
