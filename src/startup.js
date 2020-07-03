import Logger from "@reactioncommerce/logger";
import Random from "@reactioncommerce/random";
import cronjobs from "./jobs/recurring-job.js";
/**
 * @summary Called on startup
 * @param {Object} context Startup context. This is the normal app context but without
 *   any information about the current request because there is no current request.
 * @returns {undefined}
 */
export default async function preStartupApp(context) {
    // In startup function:
    const { appEvents, collections: { OrderRecurring } } = context;
    Logger.info('Start background auto recurring');
    await cronjobs(context);
    appEvents.on("afterOrderCreate", async ({ order }) => {
        const now = new Date();
        const { customFields , referenceId, shopId, shipping, account } = order || {};
        let isAutorenewal = false;
        if(customFields) {
            isAutorenewal = customFields.isAutorenewal ? customFields.isAutorenewal : false
        }

        const foundItems  = [];
        shipping.map(ship => {
            const orderItem = ship.items.reduce((list, item) => {
                const { attributes } = item 
                let hasSubscribe = false;
                for (const attribute of attributes) {
                    const {label} = attribute
                    hasSubscribe = (label.toLowerCase() === 'period') ? true : false 
                    if(hasSubscribe){
                        foundItems.push(item);
                    }
                } 
                
            }, []);
            return orderItem;
        })

        if(isAutorenewal){
            const data = {
                _id: Random.id(),
                shopId,
                referenceId,
                type : 1,
                account,
                items: foundItems,
                status: 'pending',
                orderId: referenceId,
                updatedAt: now,
                createdAt: now,
            }

            await OrderRecurring.insertOne(data);
            Logger.info(`createRecurring data ${referenceId}`);
        }
        /*
        if (Array.isArray(order.customFields)) {
        await Promise.all(order.discounts.map(async (orderDiscount) => {
            const { discountId } = orderDiscount;
            const transaction = {
            appliedAt: new Date(),
            cartId: order.cartId,
            userId: order.accountId
            };

            await Discounts.updateOne({ _id: discountId }, { $addToSet: { transactions: transaction } });
        }));
        }
        */
    });
}