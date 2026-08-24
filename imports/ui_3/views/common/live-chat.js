import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';
import { Agendas } from '/imports/api/agendas/agendas.js';
import { Session } from 'meteor/session';
import { getActiveCommunity, getActiveCommunityId } from '/imports/ui_3/lib/active-community';

import './live-chat.html';

const MOBILE_BREAKPOINT = 576; // px - egyezik a live-chat.less media query-vel

// A meet.jit.si beagyazasa 2026-tol 5 perc utan bont (JaaS-re terel), ezert
// kozossegi szervert hasznalunk. A cim beallitasbol felulirhato (METEOR_SETTINGS:
// public.jitsiDomain), igy sajat Jitsi-szerverre kodmodositas nelkul atallhatunk.
const DEFAULT_JITSI_DOMAIN = 'meet.ffmuc.net';

Template.Live_Chat.helpers({
  liveAgenda() {
    const communityId = getActiveCommunityId();
    return Agendas.findOne({ communityId, live: true });
  },
  notJoined() {
    return !Session.get('joinedVideo');
  },
  joined() {
    return Session.get('joinedVideo');
  },
});

export function joinLiveChat(user, doc) {
  const community = getActiveCommunity();
  const houseName = community.name;
  const houseGUID = community._id;
  const agendaName = doc.title;
  const userName = user.displayOfficialName();
  const userAvatar = user.avatar;

  let roomName = houseGUID + houseName;
  roomName = roomName.replace(/[_\W]+/g,'');

  const domain = (Meteor.settings.public && Meteor.settings.public.jitsiDomain) || DEFAULT_JITSI_DOMAIN;
  const jitsiOptions = {
    roomName,
    parentNode: $('#live-chat')[0],
    configOverwrite: {
      // SMART: a KK-n kivul mindenki nemitva kezd - az 1. resztvevo a moderator
      // (KK), mert a szoba csak az o belepesevel indul; a tobbiek nemitva jonnek be.
      // A KK a resztvevo-listabol kerheti a lako mikrofonjanak bekapcsolasat
      // (kezfeltevesnel), es barkit vissza is nemithat.
      startAudioMuted: 1,
      disableDeepLinking: true, // telefonon ne az appboltba kuldje a lakot, maradjon a bongeszoben
      // A fontos gombok keruljenek elore - igy a kezfelteves lakoi fiokbol,
      // telefonon is elerheto (ami kifer, latszik, a tobbi a ... menube kerul)
      toolbarButtons: [
        'microphone', 'camera', 'raisehand', 'chat', 'desktop',
        'tileview', 'fullscreen', 'participants-pane', 'settings', 'hangup',
      ],
    },
    onload() {
      api.executeCommand('subject', houseName + ' - ' + agendaName);
      api.executeCommand('displayName', userName);
      api.executeCommand('avatarUrl', userAvatar);
    },
  };
  Session.set('joinedVideo', true);
  const api = new JitsiMeetExternalAPI(domain, jitsiOptions);
  // Telefonon (kis kepernyon) csatlakozaskor mindig teljes kepernyore valtunk
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    $('.live-chat-config').addClass('maximized');
    $('.maximize-icon i').removeClass('fa-expand').addClass('fa-compress');
  }
  return api;
}

Template.Live_Chat.events({
  'click .spin-icon'() {
    $('.live-chat-config-box').toggleClass('show');
  },
  'click .maximize-icon'() {
    $('.live-chat-config').toggleClass('maximized');
    $('.maximize-icon i').toggleClass('fa-expand fa-compress');
  },
  'click .join-video'() {
    const communityId = getActiveCommunityId();
    joinLiveChat(Meteor.user(), Agendas.findOne({ communityId, live: true }));
  },
});
