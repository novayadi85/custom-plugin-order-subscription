import resolveShopFromShopId from "@reactioncommerce/api-utils/graphql/resolveShopFromShopId.js";
import { encodeRecurringOpaqueId } from "../../xforms/id.js";

export default {
  _id: (node) => encodeRecurringOpaqueId(node._id),
  shop: resolveShopFromShopId
};
