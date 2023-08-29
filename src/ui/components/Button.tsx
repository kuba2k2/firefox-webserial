import React from "react"
import styled from "styled-components"

type ButtonProps = {
	text?: string
	icon?: string
	isPrimary?: boolean
	isDisabled?: boolean
	isFocused?: boolean
	className?: string
	onClick?: () => void
}

const IconButton = styled.button<{ $icon: string }>`
	background-image: url("chrome://global/skin/icons/${(props) =>
		props.$icon}.svg");
	background-repeat: no-repeat;
	background-position: center;
`

export class Button extends React.Component<ButtonProps> {
	render() {
		if (this.props.icon) {
			return (
				<IconButton
					className={`ghost-button icon-button ${this.props.className}`}
					disabled={this.props.isDisabled}
					$icon={this.props.icon}
					onClick={this.props.onClick}
				/>
			)
		} else {
			return (
				<button
					className={this.props.className}
					type={this.props.isPrimary ? "submit" : "button"}
					disabled={this.props.isDisabled}
					onClick={this.props.onClick}
				>
					{this.props.text}
				</button>
			)
		}
	}
}
