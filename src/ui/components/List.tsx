import React from "react"
import styled from "styled-components"

const Container = styled.ul`
	list-style-type: none;
	padding: 0;
	margin: 0 -8px;
`

const Item = styled.li<{ $active: boolean }>`
	appearance: none;
	color: ButtonText;
	border-radius: 4px;
	padding-inline: 8px 8px;

	${(props) =>
		props.$active
			? `
			background-color: color-mix(in srgb, currentColor 20%, ButtonFace);
			border: 2px solid ButtonText;`
			: `
			border: 2px solid transparent;

			&:hover {
				background-color: color-mix(in srgb, currentColor 10%, ButtonFace);
			}

			&:hover:active {
				background-color: color-mix(in srgb, currentColor 20%, ButtonFace);
			}`}
`

type ListProps = {
	items: string[]
	active?: number
	onClick: (index: number) => void
}

export class List extends React.Component<ListProps> {
	render() {
		return (
			<Container>
				{this.props.items.map((value, index) => (
					<Item
						$active={this.props.active === index}
						onClick={this.props.onClick.bind(null, index)}
						key={index}
					>
						{value}
					</Item>
				))}
			</Container>
		)
	}
}
