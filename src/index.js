import pkg from "../package.json";
import schemas from "./schemas/index.js";
import queries from "./queries/index.js";
import resolvers from "./resolvers/index.js";
import preStartupApp from "./startup.js";

/**
 * @summary Import and call this function to add this plugin to your API.
 * @param {ReactionAPI} app The ReactionAPI instance
 * @returns {undefined}
 */
export default async function register(app) {
  await app.registerPlugin({
    label: "Order Subscription",
    name: "custom-order-subscription",
    version: pkg.version,
    collections: {
      OrderRecurring: {
        name: "OrderRecurring",
        indexes: [
          // Create indexes. We set specific names for backwards compatibility
          // with indexes created by the aldeed:schema-index Meteor package.
          [{ shopId: 1 }, { name: "c2_shopId" }]
        ]
      }
    },
    functionsByType: {
      transformCustomOrderFields: [({ context, customFields, order }) => ({
        ...customFields,
      })],
      startup: [preStartupApp]
    },
    graphQL: {
      schemas,
      resolvers
    },
    queries,
    backgroundJobs: {
      cleanup: [
        { type: "recurring", purgeAfterDays: 3 }
      ]
    },
    /*
    shopSettingsConfig: {
      sitemapRefreshPeriod: {
        afterUpdate(context, { shopId }) {
          updateRecurringTaskForShop(context, shopId);
        },
        defaultValue: "every 5 minutes",
        permissionsThatCanEdit: ["reaction:legacy:sitemaps/update:settings"],
        simpleSchema: {
          type: String
        }
      }
    }
    */
  });
}
