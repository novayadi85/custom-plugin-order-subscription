import SimpleSchema from "simpl-schema";
import Logger from "@reactioncommerce/logger";
import ReactionError from "@reactioncommerce/reaction-error";
import { encodeVariantOpaqueId, decodeVariantOpaqueId, encodeShopOpaqueId, encodeProductOpaqueId, encodeCatalogProductVariantOpaqueId } from "../xforms/id.js";

async function generateOrdersForShop(context, shopId) {
    const { collections: { Products, Shops, Orders, OrderRecurring } } = context;
  
    const shop = await Shops.findOne({ _id: shopId }, { projection: { _id: 1 } });
    if (!shop) {
      throw new ReactionError("not-found", `Shop ${shopId} not found`);
    }


    const recurrings = await OrderRecurring.find({
        shopId,
        status: 'pending'
    }).toArray();

     if(recurrings){
       // console.log('Recurring',recurrings)
        recurrings.forEach((recurring) => {
            const orderItems = [];
            const { updatedAt , account, items, orderId } = recurring
            Orders.findOne({ referenceId: orderId }, function(err, order){
                if(!err){
                    // push to items for new order
                    // orderItems.push()
                }
            });

            for (const item of items) {
                const { productId, quantity, attributes , variantId } = item
               // const product = findProduct(item);
               /* let product =  await context.collections.Catalog.find({
                    "product.productId": productId,
                    "product.isDeleted": { $ne: true },
                    "product.isVisible": true
                }).toArray();

                console.log(product)
                *
                */
                orderItems.push({
                    productConfiguration: {
                        productVariantId: "cmVhY3Rpb24vcHJvZHVjdDpCOHpmSmpvV1p3R2o3cDgyRw==",
                        productId: encodeProductOpaqueId(productId)
                    },
                    price:{
                        amount: 100,
                        currencyCode:"USD"
                    },
                    quantity
                })
            } 

            Logger.info(
                {
                   en: decodeVariantOpaqueId(variantId),
                   de: encodeVariantOpaqueId(variantId),
                   id: variantId
                }
            )

            if(orderItems.length > 0){
                //create cart
                
                /*
                const {
                    cart,
                    incorrectPriceFailures,
                    minOrderQuantityFailures,
                    token
                } = await context.mutations.createCart(context, {
                    items: orderItems,
                    shopId
                });
                */
                // const savedCart = await context.mutations.saveCart(context, newCart);

                //if(cart){
                  //  await OrderRecurring.update({_id: recurring._id}, {status: 'awaiting'})
               // }
                
               Logger.info({
                items: orderItems,
                shopId
               })
               
            }

        })

        
        
    }

    
}
/*
const findProducts = (items) => {
    const catalogItemIds = items.map((item) => item.productId);
    const catalogItems = await context.collections.Catalog.find({
        "product.productId": { $in: catalogItemIds },
        "product.isDeleted": { $ne: true },
        "product.isVisible": true
     }).toArray();

    return catalogItems;
}
  
*/
export default async function generateOrders(context, { shopIds = [], notifyUserId = "" }) {
    Logger.debug("Generating orders");
    const timeStart = new Date();
  
    // Add primary shop _id if none provided
    if (shopIds.length === 0) {
      throw new Error("generateOrder requires shopIds list");
    }
  
    // Generate sitemaps for each shop
    await Promise.all(shopIds.map((shopId) => generateOrdersForShop(context, shopId)));

    // Notify user, if manually generated
    if (notifyUserId) {
        await context.mutations.createNotification(context, {
            accountId: notifyUserId,
            type: "sitemapGenerated",
            message: "Sitemap refresh is complete",
            url: "/sitemap.xml"
        });
    }

    const timeEnd = new Date();
    const timeDiff = timeEnd.getTime() - timeStart.getTime();
    Logger.debug(`generateOrder generation complete. Took ${timeDiff}ms`);
}

/*

const { data } = await addItemsToCart([
    {
      price: {
        amount: price.price,
        currencyCode
      },
      productConfiguration: {
        productId: product.productId, // Pass the productId, not to be confused with _id
        productVariantId: selectedVariantOrOption.variantId // Pass the variantId, not to be confused with _id
      },
      quantity
    }
  ]);

*/