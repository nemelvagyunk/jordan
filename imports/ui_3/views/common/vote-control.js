import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { __ } from '/imports/localization/i18n.js';
import { onSuccess, displayMessage, handleError } from '/imports/ui_3/lib/errors.js';
import { Topics } from '/imports/api/topics/topics.js';
import { Agendas } from '/imports/api/agendas/agendas.js';
import { getActiveCommunity, getActiveCommunityId } from '/imports/ui_3/lib/active-community.js';

import './vote-control.html';

// ============================================================================
// KK SZAVAZASVEZERLO PULT (SMART atalakitas, 2026-08-25)
// A kozos kepviselo (manager) a video alatt lebego pultrol vezeti a kozgyulest:
//   - "Kovetkezo szavazas kiirasa"  -> a napirend kovetkezo (announced) pontja
//                                       'opened' allapotba kerul, es MINDEN
//                                       lakonal felugrik a Live_Vote panel
//   - "Aktualis lezarasa"           -> 'votingFinished' -> a szerver kiertekel
//                                       (voteEvaluate), es azonnal latszik az eredmeny
// Kozben elo (Meteor-reaktiv) aranyt mutat: hanyan szavaztak / hany szazalek
// tulajdoni hanyad, es kilistazhato, ki szavazott mar es ki nem.
// Csak a manager latja; a lakoknak semmi sem valtozik.
// ============================================================================

function liveAgendaOf(communityId) {
  if (!communityId) return undefined;
  return Agendas.findOne({ communityId, live: true });
}

function agendaVotes(communityId, agenda) {
  if (!agenda) return [];
  return Topics.find({ communityId, category: 'vote', agendaId: agenda._id }).fetch()
    .sort((a, b) => (a.serial || 0) - (b.serial || 0));
}

Template.Vote_control.onCreated(function voteControlOnCreated() {
  this.collapsed = new ReactiveVar(false);
  this.showPeople = new ReactiveVar(false);
  this.autorun(() => {
    const communityId = getActiveCommunityId();
    if (!communityId) return;
    // A topics.board publikacio a managernek a voteCasts mezot is leadja
    // (vote.peek jog), ebbol tudjuk, ki szavazott mar.
    this.subscribe('topics.board', { communityId });
    this.subscribe('memberships.inCommunity', { communityId });
  });
});

Template.Vote_control.helpers({
  showPanel() {
    const communityId = getActiveCommunityId();
    if (!communityId) return false;
    const user = Meteor.user();
    if (!user) return false;
    if (!user.hasPermission('vote.statusChange.opened.enter', { communityId })) return false;
    return !!liveAgendaOf(communityId);
  },
  collapsed() {
    return Template.instance().collapsed.get();
  },
  showPeople() {
    return Template.instance().showPeople.get();
  },
  serialAndTitle(topic) {
    if (!topic) return '';
    return (topic.serial ? topic.serial + '. ' : '') + topic.title;
  },
  openVote() {
    const communityId = getActiveCommunityId();
    return _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
  },
  nextVote() {
    const communityId = getActiveCommunityId();
    return _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'announced');
  },
  lastClosedVote() {
    const communityId = getActiveCommunityId();
    const finished = agendaVotes(communityId, liveAgendaOf(communityId))
      .filter(t => t.status === 'votingFinished' || t.status === 'closed');
    return finished.length ? finished[finished.length - 1] : undefined;
  },
  totalVoters() {
    const community = getActiveCommunity();
    if (!community) return 0;
    try { return community.voterships().length; } catch (e) { return 0; }
  },
  votedCount() {
    const communityId = getActiveCommunityId();
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
    return (topic && topic.voteParticipation && topic.voteParticipation.count) || 0;
  },
  votedUnitsPercent() {
    const communityId = getActiveCommunityId();
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
    if (!topic) return '0';
    try { return topic.votedPercent().toFixed(1); } catch (e) { return '0'; }
  },
  votedUnits() {     // leadott szavazatok tulajdoni egysegben
    const communityId = getActiveCommunityId();
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
    if (!topic || !topic.voteParticipation) return 0;
    return Math.round(topic.voteParticipation.units || 0);
  },
  totalUnits() {     // a haz osszes tulajdoni egysege
    const community = getActiveCommunity();
    if (!community) return 0;
    try { return Math.round(community.totalUnits()); } catch (e) { return 0; }
  },
  votedVoters() {
    return Template.instance().peopleLists().voted;
  },
  missingVoters() {
    return Template.instance().peopleLists().missing;
  },
});

// A ket nevsor (ki szavazott / ki nem) - a voteCasts mezobol, ami csak a
// managernek jon le. Ha a tagsagok meg nem toltodtek be, ures listat ad.
Template.Vote_control.onCreated(function attachPeopleLists() {
  this.peopleLists = function peopleLists() {
    const empty = { voted: [], missing: [] };
    const community = getActiveCommunity();
    const communityId = getActiveCommunityId();
    if (!community || !communityId) return empty;
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
    if (!topic) return empty;
    let voterships = [];
    try { voterships = community.voterships(); } catch (e) { return empty; }
    const voted = [];
    const missing = [];
    voterships.forEach((votership) => {
      const partnerId = votership.partnerId;
      let name = '?';
      try { name = votership.partner() ? votership.partner().toString() : '?'; } catch (e) { name = '?'; }
      let units = '';
      try { units = Math.round(votership.votingUnits()); } catch (e) { units = ''; }
      const entry = { name, units };
      let hasVoted = false;
      try { hasVoted = topic.hasVoted(partnerId); } catch (e) { hasVoted = false; }
      if (hasVoted) voted.push(entry); else missing.push(entry);
    });
    return { voted, missing };
  };
});

Template.Vote_control.events({
  'click .js-toggle'(event, instance) {
    instance.collapsed.set(!instance.collapsed.get());
  },
  'click .js-people-toggle'(event, instance) {
    instance.showPeople.set(!instance.showPeople.get());
  },
  'click .js-open-vote'(event, instance) {
    const communityId = getActiveCommunityId();
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'announced');
    if (!topic) return;
    Topics.methods.statusChange.call({ topicId: topic._id, status: 'opened' },
      onSuccess(() => displayMessage('success', __('Voting opened'))));
  },
  'click .js-close-vote'(event, instance) {
    const communityId = getActiveCommunityId();
    const topic = _.find(agendaVotes(communityId, liveAgendaOf(communityId)), t => t.status === 'opened');
    if (!topic) return;
    Topics.methods.statusChange.call({ topicId: topic._id, status: 'votingFinished' },
      onSuccess(() => displayMessage('success', __('Voting closed'))));
  },
});
