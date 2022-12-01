import Vue from 'vue'

import UserVersionCheck from "./UserVersionCheck";
const userVersionCheck = new UserVersionCheck(JSON.parse(`<%= JSON.stringify(options, null, 2) %>`));
Vue.prototype.$userVersionCheck = userVersionCheck;

export default (context,inject) => {
    userVersionCheck.app = context.app
}
