interface ImgIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number
  sideMargin?: boolean
}

export const ImgIcon = ({
  size = 1,
  sideMargin = false,
  style,
  ...props
}: ImgIconProps) => (
  <img
    alt=""
    style={{
      display: 'inline-block',
      width: `${size}em`,
      height: `${size}em`,
      marginTop: `${0.5 * (1 - size)}em`,
      marginBottom: `${0.5 * (1 - size)}em`,
      marginLeft: sideMargin ? `${0.5 * (1 - size)}em` : undefined,
      marginRight: sideMargin ? `${0.5 * (1 - size)}em` : undefined,
      verticalAlign: 'text-bottom',
      ...style,
    }}
    {...props}
  />
)
