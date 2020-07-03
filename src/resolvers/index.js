import Query from "./Query/index.js";
import Recurring from "./Recurring/index.js";

export default {
  Recurring,
  Query,
  Order: {
    isAutorenewal: (node, context) => {
      const { customFields } = node || {};
      let isAutorenewal = false;
      if(customFields) {
        isAutorenewal = customFields.isAutorenewal ? customFields.isAutorenewal : false
      }

      return isAutorenewal
      
    }
  }
};
