import Logger from "@reactioncommerce/logger";

const jobType = "recurring";

/**
 * @summary Schedules a job to update sitemaps for one shop, canceling any existing job of this type.
 * @param {Object} context App context
 * @param {String} shopId ID of the shop to update sitemaps for
 * @return {Promise<undefined>} Nothing
 */
export default async function updateRecurringTaskForShop(context, shopId) {
  //const { recurringRefreshPeriod } = await context.queries.appSettings(context, shopId);
  const recurringRefreshPeriod = 'every 1 mins';
  Logger.debug(`Adding ${jobType} job for shop ${shopId}. Refresh ${recurringRefreshPeriod}`);

  // First cancel existing job for this shop. We can't use `cancelRepeats` option
  // on `scheduleJob` because that cancels all of that type, whereas we want to
  // cancel only those with the same type AND the same shopId.
  await context.backgroundJobs.cancelJobs({
    type: jobType,
    data: { shopId }
  });

  await context.backgroundJobs.scheduleJob({
    type: jobType,
    data: { shopId },
    retry: {
      retries: 5,
      wait: 10000,
      backoff: "exponential"
    },
    priority: "normal",
    schedule: recurringRefreshPeriod
  });
}
