const functions = require("firebase-functions");


const admin = require("firebase-admin");

const serviceAccount = require("./account_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//imports js file
const Constant = require('./constant.js')

//cf_addProduct will reference addProduct, client will call on cf_addProduct 
exports.cf_addProduct = functions.https.onCall(addProduct);
exports.cf_getProductList = functions.https.onCall(getProductList);
exports.cf_getProductById = functions.https.onCall(getProductById);
exports.cf_updateProduct = functions.https.onCall(updateProduct);
exports.cf_deleteProduct = functions.https.onCall(deleteProduct);
exports.cf_getUserList = functions.https.onCall(getUserList);
exports.cf_updateUser = functions.https.onCall(updateUser);
exports.cf_deleteUser = functions.https.onCall(deleteUser); 
exports.cf_deleteReview = functions.https.onCall(deleteReview); 
exports.cf_getReviewById = functions.https.onCall(getReviewById);
exports.cf_updateReview = functions.https.onCall(updateReview);



//returns true or false if the email passed in is an admin account
function isAdmin(email){
    return Constant.adminEmails.includes(email);
}

//cloud function to update replies, called in firebase controller
async function updateReview(reviewInfo, context){

    
    //reviewInfo = {docId, data}
    try{
        await admin.firestore().collection(Constant.collectionNames.REVIEWS)
            .doc(reviewInfo.docId).update(reviewInfo.data)
    }catch(e){
        if(Constant.DEV) console.log(e)
        throw new functions.https.HttpsError('internal', 'updateReply Failed')
    }
}

//deletes reviews in firestore, called in fb_controller deleteReview
async function deleteReview(docId){

    try{
        await admin.firestore().collection(Constant.collectionNames.REVIEWS)
            .doc(docId).delete();
     }catch(e){
        if(Constant.DEV) console.log(e);
        throw new functions.https.HttpsError('internal', 'deleteReview Failed');
     }

}

//retrieves reviews by id from firestore
async function getReviewById(data){
    //retrieves review by docId/data
    try{
        const doc = await admin.firestore().collection(Constant.collectionNames.REVIEWS)
                    .doc(data).get();
        //if doc exists, then construct js review object
        if(doc.exists){
            //destructuring assignment
            const {productId, uid, email, timestamp, content} = doc.data();
            const r =  {productId, uid, email, timestamp, content}
            r.docId = doc.id
            return r;
        }else{
            //if doc doesn't exist
            return null;
        }

    }catch(e){
        if(Constant.DEV) console.log(e)
        throw new functions.https.HttpsError('internal', 'getReviewById Failed')
    }
}

//deletes users 
async function deleteUser(data, context){
    // data has {uid, update object} -> update will pair values ={key: value} such as email, name of users...etc
    if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }

    try{
       await admin.auth().deleteUser(data);
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'deleteUser Failed');
    }
}

async function updateUser(data, context){
   // data has {uid, update object} -> update will pair values ={key: value} such as email, name of users...etc
   if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }

    try{
       const uid = data.uid;
       const update = data.update;
       await admin.auth().updateUser(uid, update)
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'updateUser Failed');
    }
}

//get's list of users in firebase store
async function getUserList(data, context){
   if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }
    //array contains list of users
    const userList = [];
    //limit for the time being ratJAM
    const MAXRESULTS = 2; 
    
    try{
       //gets list of users
      let result = await admin.auth().listUsers(MAXRESULTS);
      //spread operator to store each value of users
      userList.push(...result.users);
      //if pageToken exists, then nextPageToken exists, else null
      let nextPageToken = result.pageToken
      //if nextpageToken exists, then read next batch of users
      while(nextPageToken){
          result = await admin.auth().listUsers(MAXRESULTS, nextPageToken);
          userList.push(...result.users);
          nextPageToken = result.pageToken;
      }

      return userList;
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'getUserList Failed');
    }
}

//returns entire list of products
async function getProductList(data, context){
    
    //displays error message if function is invoked by non-admin
    if(!isAdmin(context.auth.token.email)){
        if(Constant.DEV) console.log('not admin', context.auth.token.email);
        throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }

    try{
        let products = [];
        const snapShot = await admin.firestore().collection(Constant.collectionNames.PRODUCT)
                            .orderBy('name')
                            .get();
        snapShot.forEach( doc=>{
            //destructuring assignment from doc data
            const {name, price, summary, imageName, imageURL} = doc.data();
            // creates product object from doc data
            const p = {name, price, summary, imageName, imageURL};
            p.docId = doc.id; 
            products.push(p);
        });
        //return array of products from getproducts functions
        return products;
    }catch (e){
        if(Constant.DEV) console.log(e);
        throw new functions.https.HttpsError('internal', 'addProduct Failed');
    }
}

//context is implicitly provided, gives context on who is calling function
async function addProduct(data, context){

    //displays error message if function is invoked by non-admin
    if(!isAdmin(context.auth.token.email)){
        if(Constant.DEV) console.log('not admin', context.auth.token.email);
        throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }


    // data: serialized product object
    try{
        await admin.firestore().collection(Constant.collectionNames.PRODUCT)
                    .add(data);
    }catch (e){
        if(Constant.DEV) console.log(e);
        throw new functions.https.HttpsError('internal', 'addProduct Failed');
    }
    
}

//retrieves product by id from firestore, data is product.id
async function getProductById(data, context){

    //displays error message if function is invoked by non-admin
    if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }
    try{
       const doc = await admin.firestore().collection(Constant.collectionNames.PRODUCT)
                   .doc(data).get();
       if(doc.exists){
           const {name, summary, price, imageName, imageURL} = doc.data();
           const p = {name, summary, price, imageName, imageURL}
           p.docId = doc.id
           //returns javascript object
           return p;
       }else{
            return null;
       }
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'getProductById Failed');

    }

}


//delete's product with docId and imageName
async function deleteProduct(docId, context){
    //displays error message if function is invoked by non-admin
    if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }

    try{
       await admin.firestore().collection(Constant.collectionNames.PRODUCT)
           .doc(docId).delete();
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'deleteProduct Failed');
    }

}

async function updateProduct(productInfo, context){
   //productInfo = {docId, data}
   //displays error message if function is invoked by non-admin
    if(!isAdmin(context.auth.token.email)){
       if(Constant.DEV) console.log('not admin', context.auth.token.email);
       throw new functions.https.HttpsError('unauthenticated', 'Only admins may invoke this function');
    }

    try{
        //firebase will update the product by the docId with productInfo data
       await admin.firestore().collection(Constant.collectionNames.PRODUCT)
                   .doc(productInfo.docId).update(productInfo.data)
    }catch(e){
       if(Constant.DEV) console.log(e);
       throw new functions.https.HttpsError('internal', 'updateProduct Failed');
    }


}




