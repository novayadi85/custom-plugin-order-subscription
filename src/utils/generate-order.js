import SimpleSchema from "simpl-schema";
import Logger from "@reactioncommerce/logger";
import ReactionError from "@reactioncommerce/reaction-error";
import hashToken from "@reactioncommerce/api-utils/hashToken.js";
import { encodeShopOpaqueId, encodeProductOpaqueId, encodeCatalogProductVariantOpaqueId } from "../xforms/id.js";

async function generateOrdersForShop(context, shopId) {
    const { collections: { Products, Catalog,  Cart, Shops, Orders, OrderRecurring } } = context;
  
    const shop = await Shops.findOne({ _id: shopId }, { projection: { _id: 1 } });
    if (!shop) {
      throw new ReactionError("not-found", `Shop ${shopId} not found`);
    }

    const recurrings = await OrderRecurring.find({
        shopId,
        status: 'pending'
    }).toArray();

    const cartCurrencyCode = (shop && shop.currency) || "USD";
    if(recurrings){
       // console.log('Recurring',recurrings)
        recurrings.forEach( async (recurring) => {
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
                const catalogItem = await Catalog.findOne({ "product.productId": productId });
                // if (!catalogItem) return;

                const { product: catalogProduct } = catalogItem;
                /*
                const variantIds = [];
                catalogProduct.variants.forEach((catalogProductVariant) => {
                    variantIds.push(catalogProductVariant.variantId);
                    if (catalogProductVariant.options) {
                    catalogProductVariant.options.forEach((catalogProductOption) => {
                        variantIds.push(catalogProductOption.variantId);
                    });
                    }
                });

                const variants = await Products.find({ _id: { $in: variantIds } }).toArray();
                */

                //console.log(variants)
                //console.log(catalogProduct.variants)

                let price = 0
                const variants = catalogProduct.variants
                
                const variant = variants.find((vnt) => vnt._id === variantId);
                if(variant) {
                    const { pricing } = variant 
                    const selectedPrice = pricing[cartCurrencyCode] 
                    price = selectedPrice.price
                }
                
                orderItems.push({
                    productConfiguration: {
                        productId: productId,
                        productVariantId: variantId
                    },
                    price:{
                        amount: price || 0,
                        currencyCode: cartCurrencyCode
                    },
                    quantity: 1
                })
                
            } 
            

            if(orderItems.length > 0){
               
                const {
                    cart,
                    token
                } = await context.mutations.createCart(context, {
                    items: orderItems,
                    shopId
                });

                if( token && cart ){
                    // update recurring Order with new cartId
                    await OrderRecurring.updateOne({_id: recurring._id}, 
                        { $set: {status: 'awaiting', cartId: cart._id  } }
                    )

                    /*
                    const {
                        orders, token 
                    } = await context.mutations.placeOrder(context, {
                        order:{
                            cartId: cart._id,
                            shopId,
                            currencyCode: cartCurrencyCode,
                            
                        },
                        payments: {
                            amount: 
                        }
                    });
                    */
                }
               
            }

        })
    }
}

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