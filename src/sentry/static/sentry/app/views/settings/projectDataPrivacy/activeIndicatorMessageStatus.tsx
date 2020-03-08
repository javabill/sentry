import {addMessage} from 'app/actionCreators/indicator';
import {t} from 'app/locale';

export type Status = 'success' | 'loading' | 'error' | 'cancelling';

function activeIndicatorMessageStatus(status?: Status) {
  if (status === 'loading') {
    addMessage(t('Loading...'), 'loading', {duration: 1000});
  }

  if (status === 'cancelling') {
    addMessage(t('Cancelling...'), 'loading', {duration: 1000});
  }

  if (status === 'success') {
    addMessage(t('Success'), 'success', {duration: 1000});
  }

  if (status === 'error') {
    addMessage(t('An error occurred while saving the form'), 'error', {duration: 1000});
  }
}

export default activeIndicatorMessageStatus;
