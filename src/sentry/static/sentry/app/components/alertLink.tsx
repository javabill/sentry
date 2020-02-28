import styled from '@emotion/styled';
import React from 'react';

import Link, {LinkProps} from 'app/components/links/link';
import InlineSvg from 'app/components/inlineSvg';
import space from 'app/styles/space';

type Size = 'small' | 'normal';
type Priority = 'info' | 'warning' | 'success' | 'error' | 'muted';

type OtherProps = {
  icon?: string;
  onClick?: (e: React.MouseEvent) => void;
} & Pick<LinkProps, 'to'>;

type DefaultProps = {
  size: Size;
  priority: Priority;
};

type Props = OtherProps & DefaultProps;

export default class AlertLink extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    priority: 'warning',
    size: 'normal',
  };

  render() {
    const {size, to, priority, icon, children, onClick} = this.props;
    return (
      <StyledLink to={to} onClick={onClick} size={size} priority={priority}>
        {icon && <StyledInlineSvg src={icon} size="1.5em" spacingSize={size} />}
        <AlertLinkText>{children}</AlertLinkText>
        <InlineSvg src="icon-chevron-right" size="1em" />
      </StyledLink>
    );
  }
}

const StyledLink = styled(Link)<{priority: Priority; size: Size}>`
  display: flex;
  align-items: center;
  background-color: ${p => p.theme.alert[p.priority].backgroundLight};
  color: ${p => p.theme.gray4};
  border: 1px dashed ${p => p.theme.alert[p.priority].border};
  padding: ${p => (p.size === 'small' ? `${space(1)} ${space(1.5)}` : space(2))};
  margin-bottom: ${space(3)};
  border-radius: 0.25em;
  transition: 0.2s border-color;

  &:hover {
    border-color: ${p => p.theme.blueLight};
  }

  &.focus-visible {
    outline: none;
    box-shadow: ${p => p.theme.alert[p.priority].border}7f 0 0 0 2px;
  }
`;

const AlertLinkText = styled('div')`
  flex-grow: 1;
`;

const StyledInlineSvg = styled(InlineSvg)<{spacingSize: Size}>`
  margin-right: ${p => (p.spacingSize === 'small' ? space(1) : space(1.5))};
`;
