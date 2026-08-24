import { Template } from 'meteor/templating';
import { Communities } from '/imports/api/communities/communities.js';
import { getActiveCommunityId } from '/imports/ui_3/lib/active-community';
import './birtokcsere.html';

// SMART atalakitas: Birtokcsere oldal - lakasvasarlaskor (tulajdonosvaltas)
// a KK itt archivalja a regi tulajdonost es veszi fel az ujat.
// Az Ownerships_box-ot (community-page) hasznaljuk ujra, sajat kontextussal.

Template.Birtokcsere_page.viewmodel({
  autorun() {
    const communityId = this.communityId();
    this.templateInstance.subscribe('communities.byId', { _id: communityId });
  },
  communityId() {
    return getActiveCommunityId();
  },
  communityIdObject() {
    return { communityId: this.communityId() };
  },
  community() {
    return Communities.findOne(this.communityId());
  },
  reactiveContext() {
    const self = this;
    return {
      communityId: () => self.communityId(),
      communityIdObject: () => self.communityIdObject(),
      community: () => self.community(),
    };
  },
});
