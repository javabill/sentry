import React from 'react';
import styled from '@emotion/styled';

import space from 'app/styles/space';
import {t} from 'app/locale';
import {Panel, PanelHeader, PanelBody} from 'app/components/panels';
import Button from 'app/components/button';
import {IconAdd} from 'app/icons/iconAdd';
import ButtonBar from 'app/components/buttonBar';

import ProjectDataPrivacyRulesForm from './projectDataPrivacyRulesForm';
import {DATA_TYPE, ACTION_TYPE} from './utils';
import activeIndicatorMessageStatus, {Status} from './activeIndicatorMessageStatus';

type Rule = Omit<
  React.ComponentProps<typeof ProjectDataPrivacyRulesForm>,
  'onDelete' | 'onChange'
>;

type State = {
  rules: Array<Rule>;
  savedRules: Array<Rule>;
  status?: Status;
};

let requestResponse: Array<Rule> = [
  {
    id: 1,
    action: ACTION_TYPE.MASK,
    data: DATA_TYPE.BANK_ACCOUNTS,
    from: 'api_key && !$object',
  },
  {
    id: 2,
    action: ACTION_TYPE.REMOVE,
    data: DATA_TYPE.IP_ADDRESSES,
    from: 'xxx && xxx',
  },
];

class ProjectDataPrivacyRulesPanel extends React.Component<{}, State> {
  state: State = {
    rules: [],
    savedRules: [],
    status: 'loading',
  };

  componentDidMount() {
    this.loadRules();
  }

  resetStatus = () => {
    this.setState({
      status: undefined,
    });
  };

  loadRules = async () => {
    // add request here
    const result: Array<Rule> = await new Promise(resolve => {
      setTimeout(async function() {
        resolve(requestResponse);
      }, 1000);
    });

    this.setState(
      {
        rules: result,
        savedRules: result,
      },
      () => {
        this.resetStatus();
      }
    );
  };

  handleAddRule = () => {
    this.setState(prevState => ({
      rules: [
        ...prevState.rules,
        {
          id: prevState.rules.length + 1,
          action: ACTION_TYPE.MASK,
          data: DATA_TYPE.BANK_ACCOUNTS,
          from: '',
        },
      ],
    }));
  };

  handleDeleteRule = (ruleId: number) => {
    this.setState(prevState => ({
      rules: prevState.rules.filter(rule => rule.id !== ruleId),
    }));
  };

  handleChange = (updatedRule: Rule) => {
    this.setState(prevState => ({
      rules: prevState.rules.map(rule => {
        if (rule.id === updatedRule.id) {
          return updatedRule;
        }
        return rule;
      }),
    }));
  };

  handleSubmit = () => {
    requestResponse = this.state.rules;

    this.setState(
      prevState => ({
        status: 'success',
        savedRules: prevState.rules,
      }),
      () => {
        this.resetStatus();
      }
    );
  };

  handleValidation = () => {
    const {rules} = this.state;
    const isAnyRuleFieldEmpty = rules.find(rule =>
      Object.keys(rule).find(ruleKey => !rule[ruleKey])
    );

    const isFormValid = !isAnyRuleFieldEmpty;

    if (isFormValid) {
      this.handleSubmit();
    } else {
      this.setState(
        {
          status: 'error',
        },
        () => {
          this.resetStatus();
        }
      );
    }
  };

  handleSaveForm = (event: React.MouseEvent) => {
    event.stopPropagation();
    this.handleValidation();
  };

  handleCancelForm = () => {
    this.setState(
      prevState => ({
        status: 'cancelling',
        rules: prevState.savedRules,
      }),
      () => {
        this.resetStatus();
      }
    );
  };

  render() {
    const {rules, status} = this.state;

    activeIndicatorMessageStatus(status);

    return (
      <React.Fragment>
        <Panel>
          <PanelHeader>{t('Data Privacy Rules')}</PanelHeader>
          <PanelBody>
            {rules.map(rule => (
              <ProjectDataPrivacyRulesForm
                key={rule.id}
                onDelete={this.handleDeleteRule}
                onChange={this.handleChange}
                id={rule.id}
                action={rule.action}
                data={rule.data}
                customRegularExpression={rule.customRegularExpression}
                from={rule.from}
              />
            ))}
            <PanelAction>
              <StyledButton
                icon={<IconAdd circle />}
                onClick={this.handleAddRule}
                borderless
              >
                {t('Add Rule')}
              </StyledButton>
            </PanelAction>
          </PanelBody>
        </Panel>
        {rules.length > 0 && (
          <StyledButtonBar gap={1.5}>
            <Button onClick={this.handleCancelForm}>{t('Cancel')}</Button>
            <Button priority="primary" onClick={this.handleSaveForm}>
              {t('Save Rules')}
            </Button>
          </StyledButtonBar>
        )}
      </React.Fragment>
    );
  }
}

export default ProjectDataPrivacyRulesPanel;

const PanelAction = styled('div')`
  padding: ${space(2)} ${space(3)};
`;

// TODO(style): clarify if the color below should be added to the theme or if we should use another color - #3d74db
const StyledButton = styled(Button)`
  > *:first-child {
    color: #3d74db;
    padding: 0;
  }
`;

const StyledButtonBar = styled(ButtonBar)`
  justify-content: flex-end;
`;
