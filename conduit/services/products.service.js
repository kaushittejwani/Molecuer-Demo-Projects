const { MoleculerClientError } = require("moleculer").Errors;


const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");
const requestLoggerMiddleware = async (ctx, next) => {
	ctx.hy="by";
	console.log(`Received request to create a product: ${JSON.stringify(ctx.params.product)}`);
	if (next) {
	  // eslint-disable-next-line no-mixed-spaces-and-tabs
	  await next(ctx);
	}
};


module.exports = {
	name: "products",
	mixins: [
		DbService("products"),
		CacheCleanerMixin(["cache.clean.products"])
	],
	settings:{
		rest:"/products",
		fields:["_id","productName","productDescription"],
		entityValidator:{
			productName: { type:"string" },
			productDescription: { type:"string" }

		},
		
		

	},
	actions:{
		create:{
			rest:"/createProduct",
			params:{
				product:{ type:"object" }
			},
			async handler(ctx){
				let entity=ctx.params.product;
				
				await this.validateEntity(entity);
				if(entity.productName){
					const found =await this.adapter.findOne( { productName:entity.productName });
					if(found){

                		throw new MoleculerClientError("product is already exists",422,"",[{ field:"productName",message:"is exist" }]);
					}
				}
				if(entity.productDescription){
					const found=await this.adapter.findOne({ productDescription:entity.productDescription });
					if(found){
						throw new MoleculerClientError("product already exist",422,"",[{ field:"productDescription",message:"is exist" }]);
					}
				}
				entity.createdAt=new Date();
				entity.hy=ctx.hy;
				const product=await this.adapter.insert(entity);
				return product;
				
				
			}
		},
	},hooks:{
		before:{
		 create:requestLoggerMiddleware
		},
				
	},
		
		
		update:{
			rest:"/updateProduct/:id",
			params:{
				product:{ type:"object",props:{
					productName:{ type:"string",optional:true },
					 productDescription:{ type:"string",optional:true }
				} }

			},

			async handler(ctx){
				let entity=ctx.params.product;
				if(entity.productName){
					const found =await this.adapter.findOne( { productName:entity.productName } );
					if(found){
						throw new MoleculerClientError("product is already exist",422,"",[ { field:"productName",message:"isexist"} ] );
					}else{
						entity.updatedAt=new Date();
						const newData={
							"$set":entity
						};
						const updateProduct=await this.adapter.updateById(ctx.params.id,newData);
						return updateProduct;
					}
                		
				}if(entity.productDescription){
					const found =await this.adapter.findOne( { productDescription:entity.productDescription } );
					if(found){
						throw new MoleculerClientError("product is already exist",422,"",[ { field:"productDescription",message:"isexist"} ] );
					}else{
						entity.updatedAt=new Date();
						const newData={
							"$set":entity
						};
						const updateProduct=await this.adapter.updateById(ctx.params._id,newData);
						return updateProduct;
					}
				}
				

			}
				
		},
		delete: {
			rest: "/delete/:productName",
			async handler(ctx) {
				const productName = ctx.params.productName;
				
				// Find the document by productName
				const product = await this.adapter.findOne({ productName });
		
				if (product) {
					// If the product is found, delete it by its _id
					await this.adapter.removeById(product._id);
					return "Product deleted successfully";
				} else {
					throw new MoleculerClientError("Product not found", 422, "", [{ field: "product", message: "not found" }]);
				}
			}
		},
		deleteAll: {
			rest: "/delete-all",
			async handler() {
				// Use the `removeMany` method without any query to delete all documents in the collection
				const result = await this.adapter.removeMany({});
				console.log(result.deletedCount);
				return "all document deleted";
		
				
				
			}
		},
		readALL:{
			rest:"/allProducts",
			async handler(ctx){
				const allProducts= await this.adapter.find({});
				return allProducts ;
			}
		},
		readOne:{
			rest:"/Product",
		   params:{
				productName:{ type:"string" }
		   },
		   async handler(ctx){
				const Product=await this.adapter.findOne({ productName:ctx.params.productName });
				return Product;
		   }
		}




		
		
		
};
		

