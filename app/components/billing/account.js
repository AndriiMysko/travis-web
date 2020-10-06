import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { reads, empty, bool, not, and, or } from '@ember/object/computed';

export default Component.extend({
  store: service(),
  accounts: service(),

  account: null,

  subscription: reads('account.subscription'),
  v2subscription: reads('account.v2subscription'),
  isV2SubscriptionEmpty: empty('v2subscription'),
  isSubscriptionEmpty: empty('subscription'),
  isSubscriptionsEmpty: and('isSubscriptionEmpty', 'isV2SubscriptionEmpty'),
  hasV2Subscription: not('isV2SubscriptionEmpty'),
  trial: reads('account.trial'),
  isEducationalAccount: bool('account.education'),
  isNotEducationalAccount: not('isEducationalAccount'),

  isTrial: and('isSubscriptionsEmpty', 'isNotEducationalAccount'),
  isManual: bool('subscription.isManual'),
  isManaged: bool('subscription.managedSubscription'),
  isEducation: and('isSubscriptionsEmpty', 'isEducationalAccount'),
  showInvoices: computed('showPlansSelector', 'showAddonsSelector', function () {
    return !this.showPlansSelector && !this.showAddonsSelector && this.invoices;
  }),

  isLoading: or('accounts.fetchSubscriptions.isRunning', 'accounts.fetchV2Subscriptions.isRunning'),

  showPlansSelector: false,
  showAddonsSelector: false,

  invoices: computed('subscription.id', 'v2subscription.id', function () {
    const subscriptionId = this.isV2SubscriptionEmpty ? this.get('subscription.id') : this.get('v2subscription.id');
    const type = this.isV2SubscriptionEmpty ? 1 : 2;
    if (subscriptionId) {
      return this.store.query('invoice', { type, subscriptionId });
    } else {
      return [];
    }
  }),

  init() {
    this._super(...arguments);

    this.accounts.fetchV2Subscriptions.perform();
  }
});
