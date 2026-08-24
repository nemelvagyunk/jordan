import { Meteor } from 'meteor/meteor';
import { BrowserPolicy } from 'meteor/browser-policy';

// https://stackoverflow.com/questions/30280370/how-does-content-security-policy-work#30280371

BrowserPolicy.framing.disallow();
BrowserPolicy.content.allowInlineScripts();
BrowserPolicy.content.disallowEval();
BrowserPolicy.content.allowInlineStyles();
BrowserPolicy.content.allowFontDataUrl();
BrowserPolicy.content.allowSameOriginForAll();
BrowserPolicy.content.allowOriginForAll('data:');
BrowserPolicy.content.allowOriginForAll('https://fonts.googleapis.com');
BrowserPolicy.content.allowOriginForAll('https://fonts.gstatic.com');
BrowserPolicy.content.allowImageOrigin('*');
BrowserPolicy.content.allowFrameOrigin('meet.jit.si');
// Sajat/kozossegi Jitsi szerver: a METEOR_SETTINGS public.jitsiDomain altal
// megadott domaint is engedjuk beagyazni (enelkul a CSP "Ez a tartalom le van
// tiltva" uzenettel blokkolja a video iframe-et barmilyen mas szerveren).
const jitsiDomain = Meteor.settings.public && Meteor.settings.public.jitsiDomain;
if (jitsiDomain) {
  BrowserPolicy.content.allowFrameOrigin(jitsiDomain);
}
BrowserPolicy.content.allowOriginForAll('https://drive.google.com');
BrowserPolicy.content.allowOriginForAll('https://www.googletagmanager.com');
BrowserPolicy.content.allowOriginForAll('https://connect.facebook.net');
