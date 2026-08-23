import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { __ } from '/imports/localization/i18n.js';
import { onSuccess, displayMessage } from '/imports/ui_3/lib/errors.js';
import { Topics } from '/imports/api/topics/topics.js';
import { Agendas } from '/imports/api/agendas/agendas.js';
import { castVote } from '/imports/api/topics/votings/methods.js';
import { getActiveCommunityId } from '/imports/ui_3/lib/active-community.js';
import { getActivePartnerId } from '/imports/ui_3/lib/active-partner.js';

import './live-vote.html';

// Elo szavazas panel: amikor az admin/KK megnyitja az elo kozgyules (live agenda)
// egy szavazasat, minden lakonal felugrik a kerdes a valaszgombokkal - a teljes
// kepernyos video folott is. Szavazas vagy bezaras utan eltunik.

Template.Live_Vote.onCreated(function () {
  this.autorun(() => {
    const communityId = getActiveCommunityId();
    if (communityId) {
      this.subscribe('topics.list', { communityId, category: 'vote', status: { $in: ['opened'] } });
    }
  });
});

Template.Live_Vote.helpers({
  openLiveVotes() {
    const communityId = getActiveCommunityId();
    if (!communityId) return [];
    const liveAgenda = Agendas.findOne({ communityId, live: true });
    if (!liveAgenda) return [];
    const partnerId = getActivePartnerId();
    if (!partnerId) return [];
    const dismissed = Session.get('dismissedLiveVotes') || [];
    return Topics.find({ communityId, category: 'vote', status: 'opened', agendaId: liveAgenda._id })
      .fetch()
      .filter(topic => !topic.hasVotedDirect(partnerId) && !_.contains(dismissed, topic._id));
  },
  choiceColor(topic, index) {
    if (topic.vote.type !== 'yesno') return '';
    return ['lv-yes', 'lv-no', 'lv-abstain'][index] || '';
  },
});

Template.Live_Vote.events({
  'click .js-cast'(event) {
    const $btn = $(event.target).closest('.js-cast');
    const topicId = $btn.data('topic');
    const index = $btn.data('index');
    castVote.call({ topicId, castedVote: [index] },
      onSuccess(() => displayMessage('success', __('Live vote registered')))
    );
  },
  'click .js-dismiss'(event) {
    const topicId = $(event.target).closest('.js-dismiss').data('topic');
    const dismissed = Session.get('dismissedLiveVotes') || [];
    dismissed.push(topicId);
    Session.set('dismissedLiveVotes', dismissed);
  },
});
