import updateRecurringTaskForShop from "./updateRecurringTaskForShop.js";
import generateOrders from '../utils/generate-order.js';
const jobType = "recurring";

/**
 * @name generateRecurringJob
 * @summary Initializes and processes a job that regenerates Recurring
 * @param {Object} context App context
 * @returns {undefined}
 */
export default async function generateRecurringJob(context) {
  const { collections: { Shops } } = context;
  await context.backgroundJobs.addWorker({
    type: jobType,
    async worker(job) {
      const { notifyUserId = "", shopId } = job.data;
     // job.done(`${jobType} job done`, { repeatId: true });
      try {
        await generateOrders(context, { notifyUserId, shopIds: [shopId] });
        job.done(`${jobType} job done`, { repeatId: true });
      } catch (error) {
        job.fail(`Failed to generate sitemap. Error: ${error}`);
      }
    }
  });

  // Add one sitemap job per shop
  const shops = await Shops.find({}, { projection: { _id: 1, name: 1 } }).toArray();
  const promises = shops.map((shop) => updateRecurringTaskForShop(context, shop._id));
  await Promise.all(promises);

}
