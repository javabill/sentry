import React from 'react';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import Button from 'app/components/button';
import space from 'app/styles/space';
import {fadeIn} from 'app/styles/animations';
import ButtonBar from 'app/components/buttonBar';

type Props = {
  orgId: string;
  children: (opts: {skip: (e: React.MouseEvent) => void}) => React.ReactNode;
  onSkip: () => void;
};

type State = {
  showConfirmation: boolean;
};

class SkipConfirm extends React.Component<Props, State> {
  state: State = {
    showConfirmation: false,
  };

  toggleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState(state => ({showConfirmation: !state.showConfirmation}));
  };

  handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.props.onSkip();
  };

  render() {
    const {children, orgId} = this.props;

    return (
      <React.Fragment>
        {children({skip: this.toggleConfirm})}
        <Confirmation
          visible={this.state.showConfirmation}
          orgId={orgId}
          onSkip={this.handleSkip}
          onDismiss={this.toggleConfirm}
        />
      </React.Fragment>
    );
  }
}

export default SkipConfirm;

type ConfirmProps = React.HTMLAttributes<HTMLDivElement> & {
  onSkip: (e: React.MouseEvent) => void;
  onDismiss: (e: React.MouseEvent) => void;
  orgId: string;
  visible: boolean;
};

const Confirmation = styled(({onDismiss, orgId, onSkip, ...props}: ConfirmProps) => (
  <div onClick={onDismiss} {...props}>
    <p>{t("Not sure what to do? We're here for you!")}</p>
    <ButtonBar gap={1}>
      <Button priority="primary" size="xsmall" to={`/settings/${orgId}/support/`}>
        {t('Go to support')}
      </Button>
      <Button size="xsmall" onClick={onSkip}>
        {t('Just skip')}
      </Button>
    </ButtonBar>
  </div>
))`
  display: ${p => (p.visible ? 'flex' : 'none')};
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0 ${space(3)};
  border-radius: ${p => p.theme.borderRadius};
  align-items: center;
  flex-direction: column;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  animation: ${fadeIn} 200ms normal forwards;
  font-size: ${p => p.theme.fontSizeMedium};

  p {
    margin-bottom: ${space(1)};
  }
`;
